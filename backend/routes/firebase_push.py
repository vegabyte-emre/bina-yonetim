"""Firebase Cloud Messaging - Topic Based Push Notifications

Bu modül bina bazlı push notification gönderimini sağlar.
Her bina için ayrı topic oluşturulur: building_{building_id}
Sakinler giriş yaptığında kendi binalarının topic'ine subscribe olur.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, messaging
import os
import logging
from pathlib import Path

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/firebase", tags=["firebase-push"])

# Initialize Firebase Admin SDK
FIREBASE_INITIALIZED = False

def init_firebase():
    global FIREBASE_INITIALIZED
    if FIREBASE_INITIALIZED:
        return True
    
    try:
        # Get credentials file path
        cred_path = Path(__file__).parent.parent / "firebase_credentials.json"
        
        if not cred_path.exists():
            logger.error(f"Firebase credentials file not found: {cred_path}")
            return False
        
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred)
        FIREBASE_INITIALIZED = True
        logger.info("Firebase Admin SDK initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Firebase initialization failed: {e}")
        return False

# Initialize on module load
init_firebase()

# ============ MODELS ============

class SubscribeTopicRequest(BaseModel):
    """Bir cihazı bina topic'ine abone et"""
    fcm_token: str
    building_id: str

class UnsubscribeTopicRequest(BaseModel):
    """Bir cihazı bina topic'inden çıkar"""
    fcm_token: str
    building_id: str

class SendToTopicRequest(BaseModel):
    """Bina topic'ine bildirim gönder"""
    building_id: str
    title: str
    body: str
    data: Optional[dict] = {}
    image_url: Optional[str] = None

class SendToTokenRequest(BaseModel):
    """Tek bir cihaza bildirim gönder"""
    fcm_token: str
    title: str
    body: str
    data: Optional[dict] = {}

class SendAnnouncementNotificationRequest(BaseModel):
    """Duyuru bildirimi gönder"""
    building_id: str
    announcement_id: str
    title: str
    body: str
    priority: Optional[str] = "normal"
    image_url: Optional[str] = None

# ============ HELPER FUNCTIONS ============

def get_topic_name(building_id: str) -> str:
    """Bina ID'sinden topic adı oluştur"""
    # Firebase topic isimleri sadece alfanumerik ve - _ . karakterleri destekler
    safe_id = building_id.replace("-", "_")
    return f"building_{safe_id}"

# ============ ENDPOINTS ============

@router.post("/subscribe")
async def subscribe_to_building_topic(request: SubscribeTopicRequest):
    """Cihazı bina topic'ine abone et
    
    Sakin uygulamaya giriş yaptığında çağrılır.
    Cihaz, kendi binasının topic'ine abone olur.
    """
    if not FIREBASE_INITIALIZED:
        raise HTTPException(status_code=503, detail="Firebase not initialized")
    
    try:
        topic = get_topic_name(request.building_id)
        response = messaging.subscribe_to_topic([request.fcm_token], topic)
        
        if response.success_count > 0:
            logger.info(f"Device subscribed to topic: {topic}")
            return {
                "success": True,
                "message": f"Successfully subscribed to building notifications",
                "topic": topic
            }
        else:
            error_msg = response.errors[0].reason if response.errors else "Unknown error"
            raise HTTPException(status_code=400, detail=f"Subscription failed: {error_msg}")
            
    except Exception as e:
        logger.error(f"Subscribe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unsubscribe")
async def unsubscribe_from_building_topic(request: UnsubscribeTopicRequest):
    """Cihazı bina topic'inden çıkar
    
    Sakin uygulamadan çıkış yaptığında çağrılır.
    """
    if not FIREBASE_INITIALIZED:
        raise HTTPException(status_code=503, detail="Firebase not initialized")
    
    try:
        topic = get_topic_name(request.building_id)
        response = messaging.unsubscribe_from_topic([request.fcm_token], topic)
        
        if response.success_count > 0:
            logger.info(f"Device unsubscribed from topic: {topic}")
            return {
                "success": True,
                "message": "Successfully unsubscribed from building notifications",
                "topic": topic
            }
        else:
            error_msg = response.errors[0].reason if response.errors else "Unknown error"
            raise HTTPException(status_code=400, detail=f"Unsubscribe failed: {error_msg}")
            
    except Exception as e:
        logger.error(f"Unsubscribe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-to-building")
async def send_notification_to_building(request: SendToTopicRequest):
    """Bir binanın tüm sakinlerine bildirim gönder
    
    Topic-based messaging kullanır.
    Sadece o binaya abone olan cihazlar bildirimi alır.
    """
    if not FIREBASE_INITIALIZED:
        raise HTTPException(status_code=503, detail="Firebase not initialized")
    
    try:
        topic = get_topic_name(request.building_id)
        
        # Android için notification config
        android_config = messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                icon="notification_icon",
                color="#7C3AED",  # Purple color
                sound="default",
                channel_id="building_announcements"
            )
        )
        
        # iOS için notification config  
        apns_config = messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title=request.title,
                        body=request.body
                    ),
                    sound="default",
                    badge=1
                )
            )
        )
        
        # Mesaj oluştur
        message = messaging.Message(
            notification=messaging.Notification(
                title=request.title,
                body=request.body,
                image=request.image_url
            ),
            data={
                "type": "announcement",
                "building_id": request.building_id,
                **{k: str(v) for k, v in request.data.items()}  # Convert all values to string
            },
            topic=topic,
            android=android_config,
            apns=apns_config
        )
        
        # Gönder
        response = messaging.send(message)
        logger.info(f"Notification sent to topic {topic}: {response}")
        
        return {
            "success": True,
            "message": f"Notification sent to building topic",
            "message_id": response,
            "topic": topic
        }
        
    except Exception as e:
        logger.error(f"Send notification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-announcement")
async def send_announcement_notification(request: SendAnnouncementNotificationRequest):
    """Duyuru bildirimi gönder
    
    Admin panelden duyuru oluşturulduğunda çağrılır.
    Sadece ilgili binanın sakinlerine bildirim gider.
    """
    if not FIREBASE_INITIALIZED:
        raise HTTPException(status_code=503, detail="Firebase not initialized")
    
    try:
        topic = get_topic_name(request.building_id)
        
        # Önceliğe göre Android priority ayarla
        android_priority = "high" if request.priority in ["urgent", "high"] else "normal"
        
        android_config = messaging.AndroidConfig(
            priority=android_priority,
            notification=messaging.AndroidNotification(
                icon="notification_icon",
                color="#7C3AED",
                sound="default",
                channel_id="building_announcements",
                # Acil duyurular için vibrate pattern
                vibrate_timings_millis=[0, 250, 250, 250] if request.priority == "urgent" else None
            )
        )
        
        apns_config = messaging.APNSConfig(
            payload=messaging.APNSPayload(
                aps=messaging.Aps(
                    alert=messaging.ApsAlert(
                        title=request.title,
                        body=request.body
                    ),
                    sound="default",
                    badge=1,
                    # Acil duyurular için critical alert (iOS 12+)
                    # critical_sound=messaging.CriticalSound(name="default", volume=1.0) if request.priority == "urgent" else None
                )
            )
        )
        
        message = messaging.Message(
            notification=messaging.Notification(
                title=request.title,
                body=request.body,
                image=request.image_url
            ),
            data={
                "type": "announcement",
                "announcement_id": request.announcement_id,
                "building_id": request.building_id,
                "priority": request.priority,
                "click_action": "OPEN_ANNOUNCEMENT"
            },
            topic=topic,
            android=android_config,
            apns=apns_config
        )
        
        response = messaging.send(message)
        logger.info(f"Announcement notification sent to {topic}: {response}")
        
        return {
            "success": True,
            "message": "Announcement notification sent successfully",
            "message_id": response,
            "topic": topic,
            "building_id": request.building_id
        }
        
    except Exception as e:
        logger.error(f"Send announcement notification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-to-token")
async def send_notification_to_token(request: SendToTokenRequest):
    """Tek bir cihaza bildirim gönder
    
    Belirli bir kullanıcıya özel bildirim göndermek için kullanılır.
    """
    if not FIREBASE_INITIALIZED:
        raise HTTPException(status_code=503, detail="Firebase not initialized")
    
    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=request.title,
                body=request.body
            ),
            data={k: str(v) for k, v in request.data.items()},
            token=request.fcm_token
        )
        
        response = messaging.send(message)
        logger.info(f"Notification sent to token: {response}")
        
        return {
            "success": True,
            "message": "Notification sent successfully",
            "message_id": response
        }
        
    except messaging.UnregisteredError:
        raise HTTPException(status_code=404, detail="Device token is no longer valid")
    except Exception as e:
        logger.error(f"Send to token error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_firebase_status():
    """Firebase durumunu kontrol et"""
    return {
        "initialized": FIREBASE_INITIALIZED,
        "project_id": "bina-yonetimi-app" if FIREBASE_INITIALIZED else None
    }
