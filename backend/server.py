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

# ============ AUTH ROUTES ============

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

@app.on_event("shutdown")
async def shutdown_db():
    client.close()
