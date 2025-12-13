"""Expo Push Notifications - Building Based

Bu modül Expo Push Notification servisini kullanarak bina bazlı bildirim gönderir.
Her sakin giriş yaptığında push token'ı backend'e kaydedilir.
Duyuru gönderildiğinde, ilgili binanın tüm token'larına bildirim gider.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import httpx
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/expo-push", tags=["expo-push"])

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(MONGO_URL)
db = client[os.environ.get('DB_NAME', 'bina_yonetim')]

# Expo Push API URL
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# ============ MODELS ============

class RegisterTokenRequest(BaseModel):
    """Kullanıcının push token'ını kaydet"""
    expo_push_token: str
    user_id: str
    building_id: str

class SendToBuildingRequest(BaseModel):
    """Binaya bildirim gönder"""
    building_id: str
    title: str
    body: str
    data: Optional[dict] = {}

class SendAnnouncementRequest(BaseModel):
    """Duyuru bildirimi gönder"""
    building_id: str
    announcement_id: str
    title: str
    body: str
    priority: Optional[str] = "normal"

# ============ ENDPOINTS ============

@router.post("/register-token")
async def register_push_token(request: RegisterTokenRequest):
    """Kullanıcının Expo push token'ını kaydet
    
    Kullanıcı uygulamaya giriş yaptığında çağrılır.
    Token, kullanıcı ve bina bilgisiyle birlikte kaydedilir.
    """
    try:
        # Mevcut token'ı güncelle veya yeni kayıt oluştur
        await db.push_tokens.update_one(
            {"user_id": request.user_id},
            {
                "$set": {
                    "expo_push_token": request.expo_push_token,
                    "building_id": request.building_id,
                    "user_id": request.user_id,
                    "is_active": True
                }
            },
            upsert=True
        )
        
        logger.info(f"Push token registered for user {request.user_id} in building {request.building_id}")
        
        return {
            "success": True,
            "message": "Push token registered successfully"
        }
        
    except Exception as e:
        logger.error(f"Register token error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unregister-token")
async def unregister_push_token(user_id: str):
    """Kullanıcının push token'ını deaktif et
    
    Kullanıcı çıkış yaptığında çağrılır.
    """
    try:
        await db.push_tokens.update_one(
            {"user_id": user_id},
            {"$set": {"is_active": False}}
        )
        
        logger.info(f"Push token deactivated for user {user_id}")
        
        return {
            "success": True,
            "message": "Push token deactivated"
        }
        
    except Exception as e:
        logger.error(f"Unregister token error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-to-building")
async def send_notification_to_building(request: SendToBuildingRequest):
    """Bir binanın tüm sakinlerine bildirim gönder
    
    İlgili binadaki tüm aktif token'lara Expo Push API ile bildirim gönderir.
    """
    try:
        # Binadaki tüm aktif token'ları al
        tokens_cursor = db.push_tokens.find({
            "building_id": request.building_id,
            "is_active": True
        })
        tokens = await tokens_cursor.to_list(1000)
        
        if not tokens:
            return {
                "success": True,
                "message": "No active devices found for this building",
                "sent_count": 0
            }
        
        # Expo push mesajları oluştur
        messages = []
        for token_doc in tokens:
            expo_token = token_doc.get("expo_push_token")
            if expo_token and expo_token.startswith("ExponentPushToken"):
                messages.append({
                    "to": expo_token,
                    "sound": "default",
                    "title": request.title,
                    "body": request.body,
                    "data": request.data,
                    "priority": "high",
                    "channelId": "building_announcements"
                })
        
        if not messages:
            return {
                "success": True,
                "message": "No valid Expo push tokens found",
                "sent_count": 0
            }
        
        # Expo Push API'ye gönder
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Notifications sent to {len(messages)} devices in building {request.building_id}")
                
                return {
                    "success": True,
                    "message": f"Notifications sent to {len(messages)} devices",
                    "sent_count": len(messages),
                    "building_id": request.building_id
                }
            else:
                logger.error(f"Expo Push API error: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to send notifications")
                
    except Exception as e:
        logger.error(f"Send to building error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-announcement")
async def send_announcement_notification(request: SendAnnouncementRequest):
    """Duyuru bildirimi gönder
    
    Admin panelden duyuru oluşturulduğunda çağrılır.
    Sadece ilgili binanın sakinlerine bildirim gider.
    """
    try:
        # Binadaki tüm aktif token'ları al
        tokens_cursor = db.push_tokens.find({
            "building_id": request.building_id,
            "is_active": True
        })
        tokens = await tokens_cursor.to_list(1000)
        
        if not tokens:
            return {
                "success": True,
                "message": "Bu binada aktif cihaz bulunamadı",
                "sent_count": 0,
                "building_id": request.building_id
            }
        
        # Expo push mesajları oluştur
        messages = []
        for token_doc in tokens:
            expo_token = token_doc.get("expo_push_token")
            if expo_token and expo_token.startswith("ExponentPushToken"):
                messages.append({
                    "to": expo_token,
                    "sound": "default",
                    "title": request.title,
                    "body": request.body,
                    "data": {
                        "type": "announcement",
                        "announcement_id": request.announcement_id,
                        "building_id": request.building_id,
                        "priority": request.priority
                    },
                    "priority": "high" if request.priority in ["urgent", "high"] else "default",
                    "channelId": "building_announcements"
                })
        
        if not messages:
            return {
                "success": True,
                "message": "Geçerli push token bulunamadı",
                "sent_count": 0,
                "building_id": request.building_id
            }
        
        # Expo Push API'ye gönder
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Announcement notification sent to {len(messages)} devices")
                
                return {
                    "success": True,
                    "message": f"Bildirim {len(messages)} cihaza gönderildi",
                    "sent_count": len(messages),
                    "building_id": request.building_id
                }
            else:
                logger.error(f"Expo Push API error: {response.text}")
                raise HTTPException(status_code=500, detail="Bildirim gönderilemedi")
                
    except Exception as e:
        logger.error(f"Send announcement error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tokens/{building_id}")
async def get_building_tokens(building_id: str):
    """Binadaki kayıtlı token'ları listele (debug için)"""
    try:
        tokens_cursor = db.push_tokens.find(
            {"building_id": building_id},
            {"_id": 0}
        )
        tokens = await tokens_cursor.to_list(100)
        
        return {
            "building_id": building_id,
            "total_tokens": len(tokens),
            "active_tokens": len([t for t in tokens if t.get("is_active")]),
            "tokens": tokens
        }
        
    except Exception as e:
        logger.error(f"Get tokens error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
