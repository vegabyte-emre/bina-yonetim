from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import os
import logging
import uuid
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Süperadmin Panel API")
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "building_admin"  # superadmin or building_admin
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    building_id: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    building_id: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    building_id: Optional[str] = None
    created_at: datetime

class UserInDB(User):
    hashed_password: str

class BuildingBase(BaseModel):
    name: str
    address: str
    city: str
    district: str
    block_count: int = 1
    apartment_count: int
    currency: str = "TRY"
    aidat_amount: float = 0.0
    admin_name: str
    admin_email: EmailStr
    admin_phone: str

class BuildingCreate(BuildingBase):
    admin_password: str

class BuildingUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    block_count: Optional[int] = None
    apartment_count: Optional[int] = None
    currency: Optional[str] = None
    aidat_amount: Optional[float] = None
    admin_name: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    admin_phone: Optional[str] = None
    is_active: Optional[bool] = None

class Building(BuildingBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    is_active: bool = True
    subscription_status: str = "trial"  # trial, active, expired
    subscription_end_date: Optional[datetime] = None
    created_at: datetime

class SubscriptionPlanBase(BaseModel):
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    max_apartments: int
    features: List[str]
    is_active: bool = True

class SubscriptionPlanCreate(SubscriptionPlanBase):
    pass

class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    max_apartments: Optional[int] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None

class SubscriptionPlan(SubscriptionPlanBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class DashboardStats(BaseModel):
    total_buildings: int
    active_buildings: int
    inactive_buildings: int
    total_users: int
    total_apartments: int
    total_revenue: float
    recent_buildings: List[Building]

class SystemSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "system_settings"
    sms_provider: Optional[str] = None
    sms_api_key: Optional[str] = None
    sms_username: Optional[str] = None
    payment_provider: Optional[str] = None
    payment_api_key: Optional[str] = None
    payment_secret_key: Optional[str] = None
    email_from: Optional[str] = None
    updated_at: datetime

# ============ BUILDING MANAGER MODELS ============

class BlockBase(BaseModel):
    building_id: str
    name: str  # A, B, C, etc.
    floor_count: int
    apartment_per_floor: int

class BlockCreate(BlockBase):
    pass

class BlockUpdate(BaseModel):
    name: Optional[str] = None
    floor_count: Optional[int] = None
    apartment_per_floor: Optional[int] = None

class Block(BlockBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class ApartmentBase(BaseModel):
    building_id: str
    block_id: str
    floor: int
    door_number: str  # e.g., "1", "2", "A", "B"
    apartment_number: str  # Full number like "A-301"
    square_meters: Optional[float] = None
    room_count: Optional[str] = None  # "2+1", "3+1", etc.
    status: str = "empty"  # empty, rented, owner_occupied

class ApartmentCreate(ApartmentBase):
    pass

class ApartmentUpdate(BaseModel):
    floor: Optional[int] = None
    door_number: Optional[str] = None
    square_meters: Optional[float] = None
    room_count: Optional[str] = None
    status: Optional[str] = None

class Apartment(ApartmentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class ResidentBase(BaseModel):
    building_id: str
    apartment_id: str
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    type: str  # owner, tenant
    tc_number: Optional[str] = None  # Turkish ID number
    move_in_date: Optional[datetime] = None
    move_out_date: Optional[datetime] = None
    is_active: bool = True

class ResidentCreate(ResidentBase):
    password: str  # For mobile app login

class ResidentUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    type: Optional[str] = None
    tc_number: Optional[str] = None
    move_in_date: Optional[datetime] = None
    move_out_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class Resident(ResidentBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class ResidentInDB(Resident):
    hashed_password: str

class DueBase(BaseModel):
    building_id: str
    apartment_id: str
    resident_id: str
    month: str  # Format: "2024-01"
    amount: float
    description: str
    due_date: datetime
    status: str = "unpaid"  # unpaid, paid, overdue

class DueCreate(DueBase):
    pass

class DueUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None
    paid_date: Optional[datetime] = None

class Due(DueBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    paid_date: Optional[datetime] = None
    created_at: datetime

class AnnouncementBase(BaseModel):
    building_id: str
    title: str
    content: str
    type: str = "general"  # general, urgent, maintenance, event
    is_active: bool = True

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None

class Announcement(AnnouncementBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    created_at: datetime

class RequestBase(BaseModel):
    building_id: str
    apartment_id: str
    resident_id: str
    type: str  # complaint, maintenance, request
    category: str  # plumbing, electrical, cleaning, security, other
    title: str
    description: str
    priority: str = "normal"  # low, normal, high, urgent
    status: str = "pending"  # pending, in_progress, resolved, rejected

class RequestCreate(RequestBase):
    pass

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    response: Optional[str] = None

class Request(RequestBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    response: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

class BuildingManagerDashboardStats(BaseModel):
    total_apartments: int
    occupied_apartments: int
    empty_apartments: int
    total_residents: int
    pending_dues: int
    pending_requests: int
    total_due_amount: float
    collected_amount: float

# ============ HELPER FUNCTIONS ============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise credentials_exception
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

async def get_current_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required"
        )
    return current_user

async def get_current_building_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "building_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Building admin access required"
        )
    if not current_user.building_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Building admin must be associated with a building"
        )
    return current_user

async def get_current_resident(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_role: str = payload.get("role")
        
        if user_id is None or user_role != "resident":
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Find resident by ID
    resident_doc = await db.residents.find_one({"id": user_id}, {"_id": 0})
    if resident_doc is None:
        raise credentials_exception
    
    # Convert datetime strings if needed
    if isinstance(resident_doc.get('created_at'), str):
        resident_doc['created_at'] = datetime.fromisoformat(resident_doc['created_at'])
    if isinstance(resident_doc.get('move_in_date'), str):
        resident_doc['move_in_date'] = datetime.fromisoformat(resident_doc['move_in_date'])
    if resident_doc.get('move_out_date') and isinstance(resident_doc.get('move_out_date'), str):
        resident_doc['move_out_date'] = datetime.fromisoformat(resident_doc['move_out_date'])
    
    return Resident(**resident_doc)

# ============ AUTH ROUTES ============


@api_router.get("/residents/me", response_model=Resident)
async def get_current_resident_info(current_resident: Resident = Depends(get_current_resident)):
    """Get current logged-in resident information"""
    return current_resident

@api_router.get("/users/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current logged-in user information"""
    return current_user


# Mobile App - Resident Login
class ResidentLoginRequest(BaseModel):
    phone: str
    password: str

@api_router.post("/auth/resident-login", response_model=Token)
async def resident_login(login_data: ResidentLoginRequest):
    # Find resident by phone
    resident = await db.residents.find_one({"phone": login_data.phone, "is_active": True}, {"_id": 0})
    
    if not resident:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="HATA_1: Telefon bulunamadı"
        )
    
    # Verify password
    if not pwd_context.verify(login_data.password, resident.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="HATA_2: Şifre yanlış"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": resident["id"], "role": "resident", "building_id": resident.get("building_id")},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_doc = await db.users.find_one({"email": form_data.username}, {"_id": 0})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token = create_access_token(data={"sub": user_doc["id"]})
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ BUILDING ROUTES ============

@api_router.get("/buildings", response_model=List[Building])
async def get_buildings(current_user: User = Depends(get_current_superadmin)):
    buildings = await db.buildings.find({}, {"_id": 0}).to_list(1000)
    for building in buildings:
        if isinstance(building.get('created_at'), str):
            building['created_at'] = datetime.fromisoformat(building['created_at'])
        if isinstance(building.get('subscription_end_date'), str):
            building['subscription_end_date'] = datetime.fromisoformat(building['subscription_end_date'])
    return buildings

@api_router.get("/buildings/{building_id}", response_model=Building)
async def get_building(building_id: str, current_user: User = Depends(get_current_superadmin)):
    building = await db.buildings.find_one({"id": building_id}, {"_id": 0})
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    
    if isinstance(building.get('created_at'), str):
        building['created_at'] = datetime.fromisoformat(building['created_at'])
    if isinstance(building.get('subscription_end_date'), str):
        building['subscription_end_date'] = datetime.fromisoformat(building['subscription_end_date'])
    
    return building

@api_router.post("/buildings", response_model=Building)
async def create_building(building_data: BuildingCreate, current_user: User = Depends(get_current_superadmin)):
    # Check if admin email already exists
    existing_user = await db.users.find_one({"email": building_data.admin_email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Admin email already exists")
    
    # Create building
    building_id = str(uuid.uuid4())
    building = Building(
        id=building_id,
        name=building_data.name,
        address=building_data.address,
        city=building_data.city,
        district=building_data.district,
        block_count=building_data.block_count,
        apartment_count=building_data.apartment_count,
        currency=building_data.currency,
        aidat_amount=building_data.aidat_amount,
        admin_name=building_data.admin_name,
        admin_email=building_data.admin_email,
        admin_phone=building_data.admin_phone,
        is_active=True,
        subscription_status="trial",
        subscription_end_date=datetime.now(timezone.utc) + timedelta(days=30),
        created_at=datetime.now(timezone.utc)
    )
    
    building_doc = building.model_dump()
    building_doc['created_at'] = building_doc['created_at'].isoformat()
    if building_doc['subscription_end_date']:
        building_doc['subscription_end_date'] = building_doc['subscription_end_date'].isoformat()
    
    await db.buildings.insert_one(building_doc)
    
    # Create admin user for building
    admin_user_id = str(uuid.uuid4())
    admin_user = UserInDB(
        id=admin_user_id,
        email=building_data.admin_email,
        full_name=building_data.admin_name,
        role="building_admin",
        is_active=True,
        building_id=building_id,
        hashed_password=get_password_hash(building_data.admin_password),
        created_at=datetime.now(timezone.utc)
    )
    
    admin_doc = admin_user.model_dump()
    admin_doc['created_at'] = admin_doc['created_at'].isoformat()
    await db.users.insert_one(admin_doc)
    
    return building

@api_router.put("/buildings/{building_id}", response_model=Building)
async def update_building(building_id: str, building_data: BuildingUpdate, current_user: User = Depends(get_current_superadmin)):
    existing_building = await db.buildings.find_one({"id": building_id})
    if not existing_building:
        raise HTTPException(status_code=404, detail="Building not found")
    
    update_data = {k: v for k, v in building_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.buildings.update_one({"id": building_id}, {"$set": update_data})
    
    updated_building = await db.buildings.find_one({"id": building_id}, {"_id": 0})
    
    if isinstance(updated_building.get('created_at'), str):
        updated_building['created_at'] = datetime.fromisoformat(updated_building['created_at'])
    if isinstance(updated_building.get('subscription_end_date'), str):
        updated_building['subscription_end_date'] = datetime.fromisoformat(updated_building['subscription_end_date'])
    
    return Building(**updated_building)

@api_router.delete("/buildings/{building_id}")
async def delete_building(building_id: str, current_user: User = Depends(get_current_superadmin)):
    result = await db.buildings.delete_one({"id": building_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Building not found")
    
    # Also delete associated users
    await db.users.delete_many({"building_id": building_id})
    
    return {"message": "Building deleted successfully"}

# ============ USER ROUTES ============

@api_router.get("/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_superadmin)):
    users = await db.users.find({}, {"_id": 0, "hashed_password": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_superadmin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return user

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(get_current_superadmin)):
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    new_user = UserInDB(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=user_data.is_active,
        building_id=user_data.building_id,
        hashed_password=get_password_hash(user_data.password),
        created_at=datetime.now(timezone.utc)
    )
    
    user_doc = new_user.model_dump()
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    await db.users.insert_one(user_doc)
    
    # Return without password
    return User(**{k: v for k, v in new_user.model_dump().items() if k != 'hashed_password'})

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, current_user: User = Depends(get_current_superadmin)):
    existing_user = await db.users.find_one({"id": user_id})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    # Hash password if provided
    if 'password' in update_data:
        update_data['hashed_password'] = get_password_hash(update_data['password'])
        del update_data['password']
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return User(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_superadmin)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ============ SUBSCRIPTION ROUTES ============

@api_router.get("/subscriptions", response_model=List[SubscriptionPlan])
async def get_subscriptions(current_user: User = Depends(get_current_superadmin)):
    plans = await db.subscription_plans.find({}, {"_id": 0}).to_list(1000)
    for plan in plans:
        if isinstance(plan.get('created_at'), str):
            plan['created_at'] = datetime.fromisoformat(plan['created_at'])
    return plans

@api_router.post("/subscriptions", response_model=SubscriptionPlan)
async def create_subscription(plan_data: SubscriptionPlanCreate, current_user: User = Depends(get_current_superadmin)):
    plan_id = str(uuid.uuid4())
    new_plan = SubscriptionPlan(
        id=plan_id,
        name=plan_data.name,
        description=plan_data.description,
        price_monthly=plan_data.price_monthly,
        price_yearly=plan_data.price_yearly,
        max_apartments=plan_data.max_apartments,
        features=plan_data.features,
        is_active=plan_data.is_active,
        created_at=datetime.now(timezone.utc)
    )
    
    plan_doc = new_plan.model_dump()
    plan_doc['created_at'] = plan_doc['created_at'].isoformat()
    await db.subscription_plans.insert_one(plan_doc)
    
    return new_plan

@api_router.put("/subscriptions/{plan_id}", response_model=SubscriptionPlan)
async def update_subscription(plan_id: str, plan_data: SubscriptionPlanUpdate, current_user: User = Depends(get_current_superadmin)):
    existing_plan = await db.subscription_plans.find_one({"id": plan_id})
    if not existing_plan:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    
    update_data = {k: v for k, v in plan_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.subscription_plans.update_one({"id": plan_id}, {"$set": update_data})
    
    updated_plan = await db.subscription_plans.find_one({"id": plan_id}, {"_id": 0})
    
    if isinstance(updated_plan.get('created_at'), str):
        updated_plan['created_at'] = datetime.fromisoformat(updated_plan['created_at'])
    
    return SubscriptionPlan(**updated_plan)

@api_router.delete("/subscriptions/{plan_id}")
async def delete_subscription(plan_id: str, current_user: User = Depends(get_current_superadmin)):
    result = await db.subscription_plans.delete_one({"id": plan_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscription plan not found")
    return {"message": "Subscription plan deleted successfully"}

# ============ DASHBOARD ROUTES ============

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_superadmin)):
    # Get building stats
    all_buildings = await db.buildings.find({}, {"_id": 0}).to_list(1000)
    total_buildings = len(all_buildings)
    active_buildings = len([b for b in all_buildings if b.get('is_active', True)])
    inactive_buildings = total_buildings - active_buildings
    total_apartments = sum(b.get('apartment_count', 0) for b in all_buildings)
    
    # Get user count
    total_users = await db.users.count_documents({})
    
    # Calculate revenue (mock for now)
    total_revenue = 0.0
    for building in all_buildings:
        if building.get('subscription_status') == 'active':
            total_revenue += 500.0  # Mock monthly revenue per building
    
    # Get recent buildings
    recent = sorted(all_buildings, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
    for building in recent:
        if isinstance(building.get('created_at'), str):
            building['created_at'] = datetime.fromisoformat(building['created_at'])
        if isinstance(building.get('subscription_end_date'), str):
            building['subscription_end_date'] = datetime.fromisoformat(building['subscription_end_date'])
    
    return DashboardStats(
        total_buildings=total_buildings,
        active_buildings=active_buildings,
        inactive_buildings=inactive_buildings,
        total_users=total_users,
        total_apartments=total_apartments,
        total_revenue=total_revenue,
        recent_buildings=[Building(**b) for b in recent]
    )

# ============ SETTINGS ROUTES ============

@api_router.get("/settings", response_model=SystemSettings)
async def get_settings(current_user: User = Depends(get_current_superadmin)):
    settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = SystemSettings(
            id="system_settings",
            updated_at=datetime.now(timezone.utc)
        )
        settings_doc = default_settings.model_dump()
        settings_doc['updated_at'] = settings_doc['updated_at'].isoformat()
        await db.system_settings.insert_one(settings_doc)
        return default_settings
    
    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
    
    return SystemSettings(**settings)

@api_router.put("/settings", response_model=SystemSettings)
async def update_settings(settings_data: dict, current_user: User = Depends(get_current_superadmin)):
    settings_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    settings_data['id'] = "system_settings"
    
    await db.system_settings.update_one(
        {"id": "system_settings"},
        {"$set": settings_data},
        upsert=True
    )
    
    updated_settings = await db.system_settings.find_one({"id": "system_settings"}, {"_id": 0})
    
    if isinstance(updated_settings.get('updated_at'), str):
        updated_settings['updated_at'] = datetime.fromisoformat(updated_settings['updated_at'])
    
    return SystemSettings(**updated_settings)

# ============ BLOCK ROUTES (Building Admin) ============

@api_router.get("/blocks", response_model=List[Block])
async def get_blocks(current_user: User = Depends(get_current_building_admin)):
    blocks = await db.blocks.find({"building_id": current_user.building_id}, {"_id": 0}).to_list(1000)
    for block in blocks:
        if isinstance(block.get('created_at'), str):
            block['created_at'] = datetime.fromisoformat(block['created_at'])
    return blocks


@api_router.get("/blocks/{block_id}", response_model=Block)
async def get_block_by_id(block_id: str):
    """Get a single block by ID - accessible by authenticated users"""
    block = await db.blocks.find_one({"id": block_id}, {"_id": 0})
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    if isinstance(block.get('created_at'), str):
        block['created_at'] = datetime.fromisoformat(block['created_at'])
    
    return Block(**block)

@api_router.post("/blocks", response_model=Block)
async def create_block(block_data: BlockCreate, current_user: User = Depends(get_current_building_admin)):
    if block_data.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Cannot create block for another building")
    
    block_id = str(uuid.uuid4())
    new_block = Block(
        id=block_id,
        building_id=block_data.building_id,
        name=block_data.name,
        floor_count=block_data.floor_count,
        apartment_per_floor=block_data.apartment_per_floor,
        created_at=datetime.now(timezone.utc)
    )
    
    block_doc = new_block.model_dump()
    block_doc['created_at'] = block_doc['created_at'].isoformat()
    await db.blocks.insert_one(block_doc)
    
    return new_block

@api_router.put("/blocks/{block_id}", response_model=Block)
async def update_block(block_id: str, block_data: BlockUpdate, current_user: User = Depends(get_current_building_admin)):
    existing_block = await db.blocks.find_one({"id": block_id, "building_id": current_user.building_id})
    if not existing_block:
        raise HTTPException(status_code=404, detail="Block not found")
    
    update_data = {k: v for k, v in block_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.blocks.update_one({"id": block_id}, {"$set": update_data})
    
    updated_block = await db.blocks.find_one({"id": block_id}, {"_id": 0})
    
    if isinstance(updated_block.get('created_at'), str):
        updated_block['created_at'] = datetime.fromisoformat(updated_block['created_at'])
    
    return Block(**updated_block)

@api_router.delete("/blocks/{block_id}")
async def delete_block(block_id: str, current_user: User = Depends(get_current_building_admin)):
    result = await db.blocks.delete_one({"id": block_id, "building_id": current_user.building_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Block not found")
    return {"message": "Block deleted successfully"}

# ============ APARTMENT ROUTES (Building Admin) ============

@api_router.get("/apartments", response_model=List[Apartment])
async def get_apartments(current_user: User = Depends(get_current_building_admin)):
    apartments = await db.apartments.find({"building_id": current_user.building_id}, {"_id": 0}).to_list(1000)
    for apartment in apartments:
        if isinstance(apartment.get('created_at'), str):
            apartment['created_at'] = datetime.fromisoformat(apartment['created_at'])
    return apartments


@api_router.get("/apartments/{apartment_id}", response_model=Apartment)
async def get_apartment_by_id(apartment_id: str):
    """Get a single apartment by ID - accessible by authenticated users"""
    apartment = await db.apartments.find_one({"id": apartment_id}, {"_id": 0})
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    if isinstance(apartment.get('created_at'), str):
        apartment['created_at'] = datetime.fromisoformat(apartment['created_at'])
    
    return Apartment(**apartment)

@api_router.post("/apartments", response_model=Apartment)
async def create_apartment(apartment_data: ApartmentCreate, current_user: User = Depends(get_current_building_admin)):
    if apartment_data.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Cannot create apartment for another building")
    
    apartment_id = str(uuid.uuid4())
    new_apartment = Apartment(
        id=apartment_id,
        building_id=apartment_data.building_id,
        block_id=apartment_data.block_id,
        floor=apartment_data.floor,
        door_number=apartment_data.door_number,
        apartment_number=apartment_data.apartment_number,
        square_meters=apartment_data.square_meters,
        room_count=apartment_data.room_count,
        status=apartment_data.status,
        created_at=datetime.now(timezone.utc)
    )
    
    apartment_doc = new_apartment.model_dump()
    apartment_doc['created_at'] = apartment_doc['created_at'].isoformat()
    await db.apartments.insert_one(apartment_doc)
    
    return new_apartment

@api_router.put("/apartments/{apartment_id}", response_model=Apartment)
async def update_apartment(apartment_id: str, apartment_data: ApartmentUpdate, current_user: User = Depends(get_current_building_admin)):
    existing_apartment = await db.apartments.find_one({"id": apartment_id, "building_id": current_user.building_id})
    if not existing_apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    update_data = {k: v for k, v in apartment_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.apartments.update_one({"id": apartment_id}, {"$set": update_data})
    
    updated_apartment = await db.apartments.find_one({"id": apartment_id}, {"_id": 0})
    
    if isinstance(updated_apartment.get('created_at'), str):
        updated_apartment['created_at'] = datetime.fromisoformat(updated_apartment['created_at'])
    
    return Apartment(**updated_apartment)

@api_router.delete("/apartments/{apartment_id}")
async def delete_apartment(apartment_id: str, current_user: User = Depends(get_current_building_admin)):
    result = await db.apartments.delete_one({"id": apartment_id, "building_id": current_user.building_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return {"message": "Apartment deleted successfully"}

# ============ RESIDENT ROUTES (Building Admin) ============

@api_router.get("/residents", response_model=List[Resident])
async def get_residents(current_user: User = Depends(get_current_building_admin)):
    residents = await db.residents.find({"building_id": current_user.building_id}, {"_id": 0, "hashed_password": 0}).to_list(1000)
    for resident in residents:
        if isinstance(resident.get('created_at'), str):
            resident['created_at'] = datetime.fromisoformat(resident['created_at'])
        if isinstance(resident.get('move_in_date'), str):
            resident['move_in_date'] = datetime.fromisoformat(resident['move_in_date'])
        if resident.get('move_out_date') and isinstance(resident.get('move_out_date'), str):
            resident['move_out_date'] = datetime.fromisoformat(resident['move_out_date'])
    return residents

@api_router.post("/residents", response_model=Resident)
async def create_resident(resident_data: ResidentCreate, current_user: User = Depends(get_current_building_admin)):
    if resident_data.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Cannot create resident for another building")
    
    # Check if email already exists (if provided)
    if resident_data.email:
        existing_resident = await db.residents.find_one({"email": resident_data.email})
        if existing_resident:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    resident_id = str(uuid.uuid4())
    new_resident = ResidentInDB(
        id=resident_id,
        building_id=resident_data.building_id,
        apartment_id=resident_data.apartment_id,
        full_name=resident_data.full_name,
        phone=resident_data.phone,
        email=resident_data.email,
        type=resident_data.type,
        tc_number=resident_data.tc_number,
        move_in_date=resident_data.move_in_date,
        move_out_date=resident_data.move_out_date,
        is_active=resident_data.is_active,
        hashed_password=get_password_hash(resident_data.password),
        created_at=datetime.now(timezone.utc)
    )
    
    resident_doc = new_resident.model_dump()
    resident_doc['created_at'] = resident_doc['created_at'].isoformat()
    if resident_doc.get('move_in_date'):
        resident_doc['move_in_date'] = resident_doc['move_in_date'].isoformat()
    if resident_doc.get('move_out_date'):
        resident_doc['move_out_date'] = resident_doc['move_out_date'].isoformat()
    
    await db.residents.insert_one(resident_doc)
    
    # Return without password
    return Resident(**{k: v for k, v in new_resident.model_dump().items() if k != 'hashed_password'})

@api_router.put("/residents/{resident_id}", response_model=Resident)
async def update_resident(resident_id: str, resident_data: ResidentUpdate, current_user: User = Depends(get_current_building_admin)):
    existing_resident = await db.residents.find_one({"id": resident_id, "building_id": current_user.building_id})
    if not existing_resident:
        raise HTTPException(status_code=404, detail="Resident not found")
    
    update_data = {k: v for k, v in resident_data.model_dump().items() if v is not None}
    
    # Hash password if provided
    if 'password' in update_data:
        update_data['hashed_password'] = get_password_hash(update_data['password'])
        del update_data['password']
    
    # Convert datetime fields
    if 'move_in_date' in update_data and update_data['move_in_date']:
        update_data['move_in_date'] = update_data['move_in_date'].isoformat()
    if 'move_out_date' in update_data and update_data['move_out_date']:
        update_data['move_out_date'] = update_data['move_out_date'].isoformat()
    
    if update_data:
        await db.residents.update_one({"id": resident_id}, {"$set": update_data})
    
    updated_resident = await db.residents.find_one({"id": resident_id}, {"_id": 0, "hashed_password": 0})
    
    if isinstance(updated_resident.get('created_at'), str):
        updated_resident['created_at'] = datetime.fromisoformat(updated_resident['created_at'])
    if isinstance(updated_resident.get('move_in_date'), str):
        updated_resident['move_in_date'] = datetime.fromisoformat(updated_resident['move_in_date'])
    if updated_resident.get('move_out_date') and isinstance(updated_resident.get('move_out_date'), str):
        updated_resident['move_out_date'] = datetime.fromisoformat(updated_resident['move_out_date'])
    
    return Resident(**updated_resident)

@api_router.delete("/residents/{resident_id}")
async def delete_resident(resident_id: str, current_user: User = Depends(get_current_building_admin)):
    result = await db.residents.delete_one({"id": resident_id, "building_id": current_user.building_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Resident not found")
    return {"message": "Resident deleted successfully"}

# ============ DUE ROUTES (Building Admin) ============

@api_router.get("/dues", response_model=List[Due])
async def get_dues(current_user: User = Depends(get_current_building_admin)):
    dues = await db.dues.find({"building_id": current_user.building_id}, {"_id": 0}).to_list(1000)
    for due in dues:
        if isinstance(due.get('created_at'), str):
            due['created_at'] = datetime.fromisoformat(due['created_at'])
        if isinstance(due.get('due_date'), str):
            due['due_date'] = datetime.fromisoformat(due['due_date'])
        if due.get('paid_date') and isinstance(due.get('paid_date'), str):
            due['paid_date'] = datetime.fromisoformat(due['paid_date'])
    return dues

@api_router.post("/dues", response_model=Due)
async def create_due(due_data: DueCreate, current_user: User = Depends(get_current_building_admin)):
    if due_data.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Cannot create due for another building")
    
    due_id = str(uuid.uuid4())
    new_due = Due(
        id=due_id,
        building_id=due_data.building_id,
        apartment_id=due_data.apartment_id,
        resident_id=due_data.resident_id,
        month=due_data.month,
        amount=due_data.amount,
        description=due_data.description,
        due_date=due_data.due_date,
        status=due_data.status,
        created_at=datetime.now(timezone.utc)
    )
    
    due_doc = new_due.model_dump()
    due_doc['created_at'] = due_doc['created_at'].isoformat()
    due_doc['due_date'] = due_doc['due_date'].isoformat()
    
    await db.dues.insert_one(due_doc)
    
    return new_due

@api_router.put("/dues/{due_id}", response_model=Due)
async def update_due(due_id: str, due_data: DueUpdate, current_user: User = Depends(get_current_building_admin)):
    existing_due = await db.dues.find_one({"id": due_id, "building_id": current_user.building_id})
    if not existing_due:
        raise HTTPException(status_code=404, detail="Due not found")
    
    update_data = {k: v for k, v in due_data.model_dump().items() if v is not None}
    
    # Convert datetime fields
    if 'due_date' in update_data and update_data['due_date']:
        update_data['due_date'] = update_data['due_date'].isoformat()
    if 'paid_date' in update_data and update_data['paid_date']:
        update_data['paid_date'] = update_data['paid_date'].isoformat()
    
    if update_data:
        await db.dues.update_one({"id": due_id}, {"$set": update_data})
    
    updated_due = await db.dues.find_one({"id": due_id}, {"_id": 0})
    
    if isinstance(updated_due.get('created_at'), str):
        updated_due['created_at'] = datetime.fromisoformat(updated_due['created_at'])
    if isinstance(updated_due.get('due_date'), str):
        updated_due['due_date'] = datetime.fromisoformat(updated_due['due_date'])
    if updated_due.get('paid_date') and isinstance(updated_due.get('paid_date'), str):
        updated_due['paid_date'] = datetime.fromisoformat(updated_due['paid_date'])
    
    return Due(**updated_due)

@api_router.delete("/dues/{due_id}")
async def delete_due(due_id: str, current_user: User = Depends(get_current_building_admin)):
    result = await db.dues.delete_one({"id": due_id, "building_id": current_user.building_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Due not found")
    return {"message": "Due deleted successfully"}

# ============ ANNOUNCEMENT ROUTES (Building Admin) ============

@api_router.get("/announcements", response_model=List[Announcement])
async def get_announcements(current_user: User = Depends(get_current_building_admin)):
    announcements = await db.announcements.find({"building_id": current_user.building_id}, {"_id": 0}).to_list(1000)
    for announcement in announcements:
        if isinstance(announcement.get('created_at'), str):
            announcement['created_at'] = datetime.fromisoformat(announcement['created_at'])
    return announcements

@api_router.post("/announcements", response_model=Announcement)
async def create_announcement(announcement_data: AnnouncementCreate, current_user: User = Depends(get_current_building_admin)):
    if announcement_data.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Cannot create announcement for another building")
    
    announcement_id = str(uuid.uuid4())
    new_announcement = Announcement(
        id=announcement_id,
        building_id=announcement_data.building_id,
        title=announcement_data.title,
        content=announcement_data.content,
        type=announcement_data.type,
        is_active=announcement_data.is_active,
        created_at=datetime.now(timezone.utc)
    )
    
    announcement_doc = new_announcement.model_dump()
    announcement_doc['created_at'] = announcement_doc['created_at'].isoformat()
    await db.announcements.insert_one(announcement_doc)
    
    return new_announcement

@api_router.put("/announcements/{announcement_id}", response_model=Announcement)
async def update_announcement(announcement_id: str, announcement_data: AnnouncementUpdate, current_user: User = Depends(get_current_building_admin)):
    existing_announcement = await db.announcements.find_one({"id": announcement_id, "building_id": current_user.building_id})
    if not existing_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    update_data = {k: v for k, v in announcement_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.announcements.update_one({"id": announcement_id}, {"$set": update_data})
    
    updated_announcement = await db.announcements.find_one({"id": announcement_id}, {"_id": 0})
    
    if isinstance(updated_announcement.get('created_at'), str):
        updated_announcement['created_at'] = datetime.fromisoformat(updated_announcement['created_at'])
    
    return Announcement(**updated_announcement)

@api_router.delete("/announcements/{announcement_id}")
async def delete_announcement(announcement_id: str, current_user: User = Depends(get_current_building_admin)):
    result = await db.announcements.delete_one({"id": announcement_id, "building_id": current_user.building_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"message": "Announcement deleted successfully"}

# ============ REQUEST ROUTES (Building Admin) ============

@api_router.get("/requests", response_model=List[Request])
async def get_requests(current_user: User = Depends(get_current_building_admin)):
    requests = await db.requests.find({"building_id": current_user.building_id}, {"_id": 0}).to_list(1000)
    for request in requests:
        if isinstance(request.get('created_at'), str):
            request['created_at'] = datetime.fromisoformat(request['created_at'])
        if request.get('resolved_at') and isinstance(request.get('resolved_at'), str):
            request['resolved_at'] = datetime.fromisoformat(request['resolved_at'])
    return requests

@api_router.post("/requests", response_model=Request)
async def create_request(request_data: RequestCreate, current_user: User = Depends(get_current_building_admin)):
    if request_data.building_id != current_user.building_id:
        raise HTTPException(status_code=403, detail="Cannot create request for another building")
    
    request_id = str(uuid.uuid4())
    new_request = Request(
        id=request_id,
        building_id=request_data.building_id,
        apartment_id=request_data.apartment_id,
        resident_id=request_data.resident_id,
        type=request_data.type,
        category=request_data.category,
        title=request_data.title,
        description=request_data.description,
        priority=request_data.priority,
        status=request_data.status,
        created_at=datetime.now(timezone.utc)
    )
    
    request_doc = new_request.model_dump()
    request_doc['created_at'] = request_doc['created_at'].isoformat()
    await db.requests.insert_one(request_doc)
    
    return new_request

@api_router.put("/requests/{request_id}", response_model=Request)
async def update_request(request_id: str, request_data: RequestUpdate, current_user: User = Depends(get_current_building_admin)):
    existing_request = await db.requests.find_one({"id": request_id, "building_id": current_user.building_id})
    if not existing_request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    update_data = {k: v for k, v in request_data.model_dump().items() if v is not None}
    
    # If status is being changed to resolved, set resolved_at
    if update_data.get('status') == 'resolved' and not existing_request.get('resolved_at'):
        update_data['resolved_at'] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.requests.update_one({"id": request_id}, {"$set": update_data})
    
    updated_request = await db.requests.find_one({"id": request_id}, {"_id": 0})
    
    if isinstance(updated_request.get('created_at'), str):
        updated_request['created_at'] = datetime.fromisoformat(updated_request['created_at'])
    if updated_request.get('resolved_at') and isinstance(updated_request.get('resolved_at'), str):
        updated_request['resolved_at'] = datetime.fromisoformat(updated_request['resolved_at'])
    
    return Request(**updated_request)

@api_router.delete("/requests/{request_id}")
async def delete_request(request_id: str, current_user: User = Depends(get_current_building_admin)):
    result = await db.requests.delete_one({"id": request_id, "building_id": current_user.building_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Request deleted successfully"}

# ============ BUILDING MANAGER DASHBOARD ============

@api_router.get("/building-manager/dashboard", response_model=BuildingManagerDashboardStats)
async def get_building_manager_dashboard(current_user: User = Depends(get_current_building_admin)):
    building_id = current_user.building_id
    
    # Get apartment stats
    all_apartments = await db.apartments.find({"building_id": building_id}, {"_id": 0}).to_list(1000)
    total_apartments = len(all_apartments)
    occupied_apartments = len([a for a in all_apartments if a.get('status') in ['rented', 'owner_occupied']])
    empty_apartments = total_apartments - occupied_apartments
    
    # Get resident count
    total_residents = await db.residents.count_documents({"building_id": building_id, "is_active": True})
    
    # Get dues stats
    all_dues = await db.dues.find({"building_id": building_id}, {"_id": 0}).to_list(1000)
    pending_dues = len([d for d in all_dues if d.get('status') == 'unpaid'])
    total_due_amount = sum(d.get('amount', 0) for d in all_dues if d.get('status') == 'unpaid')
    collected_amount = sum(d.get('amount', 0) for d in all_dues if d.get('status') == 'paid')
    
    # Get pending requests
    pending_requests = await db.requests.count_documents({
        "building_id": building_id,
        "status": {"$in": ["pending", "in_progress"]}
    })
    
    return BuildingManagerDashboardStats(
        total_apartments=total_apartments,
        occupied_apartments=occupied_apartments,
        empty_apartments=empty_apartments,
        total_residents=total_residents,
        pending_dues=pending_dues,
        pending_requests=pending_requests,
        total_due_amount=total_due_amount,
        collected_amount=collected_amount
    )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.buildings.create_index("id", unique=True)
    await db.subscription_plans.create_index("id", unique=True)
    await db.blocks.create_index("id", unique=True)
    await db.apartments.create_index("id", unique=True)
    await db.residents.create_index("id", unique=True)
    await db.dues.create_index("id", unique=True)
    await db.announcements.create_index("id", unique=True)
    await db.requests.create_index("id", unique=True)

@app.on_event("shutdown")
async def shutdown_db():
    client.close()
