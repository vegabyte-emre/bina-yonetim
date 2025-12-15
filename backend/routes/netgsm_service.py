# Netgsm SMS Service
# Dokümantasyon: https://www.netgsm.com.tr/dokuman/#sms-gönderimi

import httpx
import base64
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

class NetgsmService:
    """Netgsm SMS gönderme servisi"""
    
    API_URL = "https://api.netgsm.com.tr/sms/rest/v2/send"
    BALANCE_URL = "https://api.netgsm.com.tr/balance"
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def get_config(self) -> dict:
        """Netgsm ayarlarını getir"""
        config = await self.db.netgsm_config.find_one({"id": "default"}, {"_id": 0})
        return config or {}
    
    async def save_config(self, config: dict) -> bool:
        """Netgsm ayarlarını kaydet"""
        await self.db.netgsm_config.update_one(
            {"id": "default"},
            {"$set": {**config, "id": "default"}},
            upsert=True
        )
        return True
    
    def _get_auth_header(self, username: str, password: str) -> str:
        """Basic Auth header oluştur"""
        credentials = f"{username}:{password}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"
    
    async def send_sms(
        self, 
        phone_numbers: List[str], 
        message: str,
        sender: Optional[str] = None,
        iys_filter: str = "0"  # 0: Bilgilendirme, 11: Ticari bireysel, 12: Ticari tacir
    ) -> dict:
        """
        SMS gönder
        
        Args:
            phone_numbers: Telefon numaraları listesi (5XXXXXXXXX formatında)
            message: Mesaj metni
            sender: Gönderici adı (msgheader)
            iys_filter: İYS filtresi
        
        Returns:
            dict: API yanıtı
        """
        config = await self.get_config()
        
        if not config.get("username") or not config.get("password"):
            return {"success": False, "error": "Netgsm yapılandırması eksik"}
        
        if not config.get("is_active", False):
            return {"success": False, "error": "Netgsm servisi devre dışı"}
        
        # Mesajları hazırla
        messages = []
        for phone in phone_numbers:
            # Telefon numarasını temizle
            clean_phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            if clean_phone.startswith("+90"):
                clean_phone = clean_phone[3:]
            elif clean_phone.startswith("90"):
                clean_phone = clean_phone[2:]
            elif clean_phone.startswith("0"):
                clean_phone = clean_phone[1:]
            
            messages.append({
                "msg": message,
                "no": clean_phone
            })
        
        payload = {
            "msgheader": sender or config.get("default_sender", ""),
            "messages": messages,
            "encoding": "TR",
            "iysfilter": iys_filter
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": self._get_auth_header(config["username"], config["password"])
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.API_URL, json=payload, headers=headers)
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Log SMS
                    await self.db.sms_logs.insert_one({
                        "phone_numbers": phone_numbers,
                        "message": message,
                        "sender": sender or config.get("default_sender"),
                        "response": result,
                        "status": "success" if result.get("code") in ["00", "01", "02"] else "error",
                        "job_id": result.get("jobid"),
                        "created_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat()
                    })
                    
                    return {
                        "success": True,
                        "job_id": result.get("jobid"),
                        "code": result.get("code"),
                        "description": result.get("description")
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}",
                        "detail": response.text
                    }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def check_balance(self) -> dict:
        """Kredi bakiyesini sorgula"""
        config = await self.get_config()
        
        if not config.get("username") or not config.get("password"):
            return {"success": False, "error": "Netgsm yapılandırması eksik"}
        
        payload = {
            "usercode": config["username"],
            "password": config["password"],
            "stip": 3  # Tüm varlık bilgisi
        }
        
        headers = {"Content-Type": "application/json"}
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.BALANCE_URL, json=payload, headers=headers)
                
                if response.status_code == 200:
                    result = response.json()
                    return {"success": True, "balance": result.get("balance", [])}
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def test_connection(self) -> dict:
        """Bağlantıyı test et"""
        return await self.check_balance()
