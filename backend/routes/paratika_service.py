# Paratika Payment Service
# Dokümantasyon: https://entegrasyon.paratika.com.tr/paratika/api/v2/doc

import httpx
import hashlib
import uuid
from typing import Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase

class ParatikaService:
    """Paratika ödeme sistemi servisi"""
    
    # API URL'leri
    TEST_URL = "https://test.paratika.com.tr/paratika/api/v2"
    ENTEGRASYON_URL = "https://entegrasyon.paratika.com.tr/paratika/api/v2"
    PRODUCTION_URL = "https://vpos.paratika.com.tr/paratika/api/v2"
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def get_config(self) -> dict:
        """Paratika ayarlarını getir"""
        config = await self.db.paratika_config.find_one({"id": "default"}, {"_id": 0})
        return config or {}
    
    async def save_config(self, config: dict) -> bool:
        """Paratika ayarlarını kaydet"""
        await self.db.paratika_config.update_one(
            {"id": "default"},
            {"$set": {**config, "id": "default"}},
            upsert=True
        )
        return True
    
    def _get_api_url(self, is_live: bool = False) -> str:
        """API URL'ini döndür"""
        return self.PRODUCTION_URL if is_live else self.TEST_URL
    
    async def create_session_token(
        self,
        amount: float,
        currency: str = "TRY",
        order_id: str = None,
        customer_info: dict = None,
        return_url: str = None,
        cancel_url: str = None
    ) -> dict:
        """
        Ödeme için oturum anahtarı oluştur
        
        Args:
            amount: Ödeme tutarı
            currency: Para birimi (TRY, USD, EUR)
            order_id: Sipariş ID
            customer_info: Müşteri bilgileri
            return_url: Başarılı ödeme dönüş URL'i
            cancel_url: İptal dönüş URL'i
        """
        config = await self.get_config()
        
        if not config.get("merchant") or not config.get("merchant_user") or not config.get("merchant_password"):
            return {"success": False, "error": "Paratika yapılandırması eksik"}
        
        if not config.get("is_active", False):
            return {"success": False, "error": "Paratika servisi devre dışı"}
        
        api_url = self._get_api_url(config.get("is_live", False))
        
        # Unique order ID oluştur
        if not order_id:
            order_id = f"YNT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:8].upper()}"
        
        payload = {
            "ACTION": "SESSIONTOKEN",
            "MERCHANT": config["merchant"],
            "MERCHANTUSER": config["merchant_user"],
            "MERCHANTPASSWORD": config["merchant_password"],
            "SESSIONTYPE": "PAYMENTSESSION",
            "AMOUNT": str(amount),
            "CURRENCY": currency,
            "MERCHANTPAYMENTID": order_id,
            "RETURNURL": return_url or config.get("return_url", ""),
            "CANCELURL": cancel_url or config.get("cancel_url", "")
        }
        
        # Müşteri bilgilerini ekle
        if customer_info:
            if customer_info.get("email"):
                payload["CUSTOMEREMAIL"] = customer_info["email"]
            if customer_info.get("name"):
                payload["CUSTOMERNAME"] = customer_info["name"]
            if customer_info.get("phone"):
                payload["CUSTOMERPHONE"] = customer_info["phone"]
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(api_url, data=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if result.get("responseCode") == "00":
                        # Ödeme kaydı oluştur
                        await self.db.payments.insert_one({
                            "id": str(uuid.uuid4()),
                            "order_id": order_id,
                            "session_token": result.get("sessionToken"),
                            "amount": amount,
                            "currency": currency,
                            "customer_info": customer_info,
                            "status": "pending",
                            "is_live": config.get("is_live", False),
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
                        
                        return {
                            "success": True,
                            "session_token": result.get("sessionToken"),
                            "order_id": order_id,
                            "payment_url": f"{api_url.replace('/api/v2', '')}/payment/{result.get('sessionToken')}"
                        }
                    else:
                        return {
                            "success": False,
                            "error": result.get("responseMsg"),
                            "error_code": result.get("errorCode")
                        }
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def query_payment(self, order_id: str = None, session_token: str = None) -> dict:
        """Ödeme durumunu sorgula"""
        config = await self.get_config()
        
        if not config.get("merchant"):
            return {"success": False, "error": "Paratika yapılandırması eksik"}
        
        api_url = self._get_api_url(config.get("is_live", False))
        
        payload = {
            "ACTION": "QUERYSESSION",
            "MERCHANT": config["merchant"],
            "MERCHANTUSER": config["merchant_user"],
            "MERCHANTPASSWORD": config["merchant_password"]
        }
        
        if session_token:
            payload["SESSIONTOKEN"] = session_token
        elif order_id:
            payload["MERCHANTPAYMENTID"] = order_id
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(api_url, data=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Veritabanındaki kaydı güncelle
                    if result.get("responseCode") == "00":
                        update_data = {
                            "paratika_response": result,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                        
                        # Ödeme durumunu belirle
                        if result.get("sessionStatus") == "COMPLETED":
                            update_data["status"] = "completed"
                        elif result.get("sessionStatus") == "CANCELED":
                            update_data["status"] = "cancelled"
                        elif result.get("sessionStatus") == "FAILED":
                            update_data["status"] = "failed"
                        
                        if order_id:
                            await self.db.payments.update_one(
                                {"order_id": order_id},
                                {"$set": update_data}
                            )
                    
                    return {"success": True, "data": result}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def refund(self, order_id: str, amount: float = None) -> dict:
        """Ödeme iadesi yap"""
        config = await self.get_config()
        
        if not config.get("merchant"):
            return {"success": False, "error": "Paratika yapılandırması eksik"}
        
        # Orijinal ödemeyi bul
        payment = await self.db.payments.find_one({"order_id": order_id}, {"_id": 0})
        if not payment:
            return {"success": False, "error": "Ödeme bulunamadı"}
        
        api_url = self._get_api_url(config.get("is_live", False))
        
        payload = {
            "ACTION": "REFUND",
            "MERCHANT": config["merchant"],
            "MERCHANTUSER": config["merchant_user"],
            "MERCHANTPASSWORD": config["merchant_password"],
            "MERCHANTPAYMENTID": order_id,
            "AMOUNT": str(amount or payment.get("amount"))
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(api_url, data=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if result.get("responseCode") == "00":
                        # Ödeme kaydını güncelle
                        await self.db.payments.update_one(
                            {"order_id": order_id},
                            {"$set": {
                                "status": "refunded",
                                "refund_response": result,
                                "refunded_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        return {"success": True, "data": result}
                    else:
                        return {
                            "success": False,
                            "error": result.get("responseMsg"),
                            "error_code": result.get("errorCode")
                        }
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def test_connection(self) -> dict:
        """Bağlantıyı test et - basit bir sorgu ile"""
        config = await self.get_config()
        
        if not config.get("merchant"):
            return {"success": False, "error": "Paratika yapılandırması eksik"}
        
        api_url = self._get_api_url(config.get("is_live", False))
        
        # Basit bir QUERYPAYMENTSYSTEMS sorgusu yap
        payload = {
            "ACTION": "QUERYPAYMENTSYSTEMS",
            "MERCHANT": config["merchant"],
            "MERCHANTUSER": config["merchant_user"],
            "MERCHANTPASSWORD": config["merchant_password"]
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(api_url, data=payload)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("responseCode") == "00":
                        return {"success": True, "message": "Bağlantı başarılı", "payment_systems": result.get("paymentSystems", [])}
                    else:
                        return {"success": False, "error": result.get("responseMsg", "Bağlantı hatası")}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
