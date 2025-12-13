from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os

router = APIRouter(prefix="/api/push-notifications", tags=["push-notifications"])

# Expo Push Notification URL
EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

class PushToken(BaseModel):
    resident_id: str
    push_token: str
    device_type: Optional[str] = "android"

class SendNotificationRequest(BaseModel):
    announcement_id: str
    title: str
    body: str
    data: Optional[dict] = {}

class BulkNotificationRequest(BaseModel):
    title: str
    body: str
    tokens: List[str]
    data: Optional[dict] = {}

# MongoDB collection
from motor.motor_asyncio import AsyncIOMotorClient

# Get database instance
async def get_db():
    from main import db
    return db

@router.post("/register-token")
async def register_push_token(token_data: PushToken, db = Depends(get_db)):
    """Register or update a resident's push notification token"""
    try:
        # Update resident with push token
        result = await db.residents.update_one(
            {"id": token_data.resident_id},
            {
                "$set": {
                    "push_token": token_data.push_token,
                    "device_type": token_data.device_type
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        return {"success": True, "message": "Push token registered successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-announcement")
async def send_announcement_notification(
    request: SendNotificationRequest,
    db = Depends(get_db)
):
    """Send push notification to all residents for an announcement"""
    try:
        # Get all residents with push tokens
        residents = await db.residents.find(
            {"push_token": {"$exists": True, "$ne": None}},
            {"push_token": 1}
        ).to_list(1000)
        
        if not residents:
            return {"success": True, "message": "No residents with push tokens found", "sent_count": 0}
        
        tokens = [r["push_token"] for r in residents if r.get("push_token")]
        
        # Prepare Expo push messages
        messages = []
        for token in tokens:
            if token.startswith("ExponentPushToken"):
                messages.append({
                    "to": token,
                    "sound": "default",
                    "title": request.title,
                    "body": request.body,
                    "data": {
                        "announcement_id": request.announcement_id,
                        "type": "announcement",
                        **request.data
                    }
                })
        
        if not messages:
            return {"success": True, "message": "No valid push tokens found", "sent_count": 0}
        
        # Send to Expo
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "message": f"Notifications sent to {len(messages)} residents",
                    "sent_count": len(messages),
                    "expo_response": result
                }
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to send push notifications")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-bulk")
async def send_bulk_notification(request: BulkNotificationRequest):
    """Send push notification to specific tokens"""
    try:
        messages = []
        for token in request.tokens:
            if token.startswith("ExponentPushToken"):
                messages.append({
                    "to": token,
                    "sound": "default",
                    "title": request.title,
                    "body": request.body,
                    "data": request.data
                })
        
        if not messages:
            return {"success": True, "message": "No valid push tokens", "sent_count": 0}
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                EXPO_PUSH_URL,
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                }
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": f"Notifications sent to {len(messages)} devices",
                    "sent_count": len(messages)
                }
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to send notifications")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/remove-token/{resident_id}")
async def remove_push_token(resident_id: str, db = Depends(get_db)):
    """Remove a resident's push token (e.g., on logout)"""
    try:
        result = await db.residents.update_one(
            {"id": resident_id},
            {"$unset": {"push_token": "", "device_type": ""}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Resident not found")
        
        return {"success": True, "message": "Push token removed"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
