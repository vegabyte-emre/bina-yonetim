"""
Google Calendar + Meet Integration
Toplantı oluşturma ve Google Meet linki alma
"""

import os
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest
import requests

router = APIRouter(prefix="/api/google-calendar", tags=["Google Calendar"])

# Google OAuth Config - will be loaded from DB
SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email"
]

# Database reference (will be set from main server)
db = None

def set_db(database):
    global db
    db = database


class GoogleCalendarConfig(BaseModel):
    client_id: str
    client_secret: str
    redirect_uri: str


class MeetingRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    duration_minutes: int = 60
    attendees: Optional[list] = []


async def get_google_config(building_id: str) -> dict:
    """Get Google Calendar config for a building"""
    config = await db.google_calendar_config.find_one(
        {"building_id": building_id},
        {"_id": 0}
    )
    return config


async def get_google_tokens(building_id: str) -> dict:
    """Get stored Google tokens for a building"""
    tokens = await db.google_tokens.find_one(
        {"building_id": building_id},
        {"_id": 0}
    )
    return tokens


async def save_google_tokens(building_id: str, tokens: dict):
    """Save Google tokens for a building"""
    await db.google_tokens.update_one(
        {"building_id": building_id},
        {"$set": {
            "building_id": building_id,
            **tokens,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )


async def get_credentials(building_id: str) -> Optional[Credentials]:
    """Get valid credentials, refresh if needed"""
    config = await get_google_config(building_id)
    tokens = await get_google_tokens(building_id)
    
    if not config or not tokens:
        return None
    
    creds = Credentials(
        token=tokens.get("access_token"),
        refresh_token=tokens.get("refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=config.get("client_id"),
        client_secret=config.get("client_secret"),
        scopes=SCOPES
    )
    
    # Refresh if expired
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(GoogleRequest())
            await save_google_tokens(building_id, {
                "access_token": creds.token,
                "refresh_token": creds.refresh_token
            })
        except Exception as e:
            print(f"Token refresh failed: {e}")
            return None
    
    return creds


# ============ CONFIG ENDPOINTS ============

@router.get("/config/{building_id}")
async def get_config(building_id: str):
    """Get Google Calendar configuration status"""
    config = await get_google_config(building_id)
    tokens = await get_google_tokens(building_id)
    
    return {
        "is_configured": config is not None and bool(config.get("client_id")),
        "is_connected": tokens is not None and bool(tokens.get("access_token")),
        "client_id": config.get("client_id", "")[:20] + "..." if config else None
    }


@router.post("/config/{building_id}")
async def save_config(building_id: str, config: GoogleCalendarConfig):
    """Save Google Calendar configuration"""
    await db.google_calendar_config.update_one(
        {"building_id": building_id},
        {"$set": {
            "building_id": building_id,
            "client_id": config.client_id,
            "client_secret": config.client_secret,
            "redirect_uri": config.redirect_uri,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"success": True, "message": "Konfigürasyon kaydedildi"}


@router.delete("/config/{building_id}")
async def delete_config(building_id: str):
    """Disconnect Google Calendar"""
    await db.google_tokens.delete_one({"building_id": building_id})
    return {"success": True, "message": "Google Calendar bağlantısı kesildi"}


# ============ OAUTH ENDPOINTS ============

@router.get("/auth/{building_id}")
async def start_oauth(building_id: str):
    """Start Google OAuth flow"""
    config = await get_google_config(building_id)
    
    if not config or not config.get("client_id"):
        raise HTTPException(
            status_code=400, 
            detail="Google Calendar yapılandırması bulunamadı. Önce Ayarlar'dan yapılandırın."
        )
    
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": config["client_id"],
                "client_secret": config["client_secret"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token"
            }
        },
        scopes=SCOPES,
        redirect_uri=config["redirect_uri"]
    )
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        prompt='consent',
        state=building_id  # Pass building_id in state
    )
    
    return {"authorization_url": authorization_url}


@router.get("/callback")
async def oauth_callback(code: str, state: str):
    """Handle Google OAuth callback"""
    building_id = state
    config = await get_google_config(building_id)
    
    if not config:
        raise HTTPException(status_code=400, detail="Yapılandırma bulunamadı")
    
    # Exchange code for tokens
    try:
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': config["client_id"],
                'client_secret': config["client_secret"],
                'redirect_uri': config["redirect_uri"],
                'grant_type': 'authorization_code'
            }
        ).json()
        
        if 'error' in token_response:
            raise HTTPException(
                status_code=400, 
                detail=f"Token alınamadı: {token_response.get('error_description', token_response.get('error'))}"
            )
        
        # Get user email
        user_info = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {token_response["access_token"]}'}
        ).json()
        
        # Save tokens
        await save_google_tokens(building_id, {
            "access_token": token_response["access_token"],
            "refresh_token": token_response.get("refresh_token"),
            "email": user_info.get("email")
        })
        
        # Redirect back to settings with success message
        frontend_url = os.environ.get("ADMIN_PANEL_URL", "http://localhost:3001")
        return RedirectResponse(f"{frontend_url}/settings?google_connected=true")
        
    except Exception as e:
        print(f"OAuth callback error: {e}")
        frontend_url = os.environ.get("ADMIN_PANEL_URL", "http://localhost:3001")
        return RedirectResponse(f"{frontend_url}/settings?google_error=true")


# ============ MEETING ENDPOINTS ============

@router.post("/meetings/{building_id}")
async def create_meeting_with_meet(building_id: str, meeting: MeetingRequest):
    """Create a calendar event with Google Meet link"""
    creds = await get_credentials(building_id)
    
    if not creds:
        raise HTTPException(
            status_code=401,
            detail="Google Calendar bağlantısı bulunamadı. Önce Ayarlar'dan bağlayın."
        )
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        # Parse date and time
        start_datetime = datetime.strptime(f"{meeting.date} {meeting.time}", "%Y-%m-%d %H:%M")
        end_datetime = start_datetime + timedelta(minutes=meeting.duration_minutes)
        
        # Create event with Google Meet
        event = {
            'summary': meeting.title,
            'description': meeting.description,
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'Europe/Istanbul',
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'Europe/Istanbul',
            },
            'conferenceData': {
                'createRequest': {
                    'requestId': f"meet-{building_id}-{datetime.now().timestamp()}",
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            },
            'attendees': [{'email': email} for email in meeting.attendees if email],
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }
        
        created_event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1,
            sendUpdates='all'
        ).execute()
        
        # Extract Meet link
        meet_link = None
        if 'conferenceData' in created_event:
            entry_points = created_event['conferenceData'].get('entryPoints', [])
            for ep in entry_points:
                if ep.get('entryPointType') == 'video':
                    meet_link = ep.get('uri')
                    break
        
        return {
            "success": True,
            "event_id": created_event.get('id'),
            "html_link": created_event.get('htmlLink'),
            "meet_link": meet_link,
            "start": created_event['start'].get('dateTime'),
            "end": created_event['end'].get('dateTime')
        }
        
    except Exception as e:
        print(f"Calendar event creation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Toplantı oluşturulamadı: {str(e)}"
        )


@router.get("/meetings/{building_id}")
async def get_upcoming_meetings(building_id: str):
    """Get upcoming calendar events"""
    creds = await get_credentials(building_id)
    
    if not creds:
        return []
    
    try:
        service = build('calendar', 'v3', credentials=creds)
        
        now = datetime.now(timezone.utc).isoformat()
        events_result = service.events().list(
            calendarId='primary',
            timeMin=now,
            maxResults=20,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        return [
            {
                "id": e.get('id'),
                "title": e.get('summary'),
                "description": e.get('description'),
                "start": e['start'].get('dateTime', e['start'].get('date')),
                "end": e['end'].get('dateTime', e['end'].get('date')),
                "meet_link": e.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri') if e.get('conferenceData') else None,
                "html_link": e.get('htmlLink')
            }
            for e in events
        ]
        
    except Exception as e:
        print(f"Failed to fetch events: {e}")
        return []
