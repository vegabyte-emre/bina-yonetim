import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import uuid
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_database():
    # MongoDB connection
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Veritabanı temizleniyor...")
    await db.users.delete_many({})
    await db.buildings.delete_many({})
    await db.subscription_plans.delete_many({})
    await db.system_settings.delete_many({})
    await db.blocks.delete_many({})
    await db.apartments.delete_many({})
    await db.residents.delete_many({})
    await db.dues.delete_many({})
    await db.announcements.delete_many({})
    await db.requests.delete_many({})
    
    print("👤 Süperadmin oluşturuluyor...")
    # Create superadmin
    superadmin_id = str(uuid.uuid4())
    superadmin = {
        "id": superadmin_id,
        "email": "admin@test.com",
        "full_name": "Süper Admin",
        "role": "superadmin",
        "is_active": True,
        "building_id": None,
        "hashed_password": pwd_context.hash("admin123"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(superadmin)
    print("✅ Süperadmin oluşturuldu: admin@test.com / admin123")
    
    print("\n🏢 Binalar oluşturuluyor...")
    # Create sample buildings
    buildings_data = [
        {
            "name": "Mavi Rezidans",
            "address": "Atatürk Bulvarı No:123",
            "city": "İstanbul",
            "district": "Kadıköy",
            "block_count": 2,
            "apartment_count": 48,
            "currency": "TRY",
            "aidat_amount": 750.0,
            "admin_name": "Ahmet Yılmaz",
            "admin_email": "ahmet@mavirezidans.com",
            "admin_phone": "+90 532 111 2233",
            "admin_password": "admin123"
        },
        {
            "name": "Yeşil Park Sitesi",
            "address": "Bağdat Caddesi No:456",
            "city": "İstanbul",
            "district": "Maltepe",
            "block_count": 4,
            "apartment_count": 96,
            "currency": "TRY",
            "aidat_amount": 850.0,
            "admin_name": "Mehmet Demir",
            "admin_email": "mehmet@yesilpark.com",
            "admin_phone": "+90 533 444 5566",
            "admin_password": "admin123"
        },
        {
            "name": "Sarı Bahçe",
            "address": "İnönü Caddesi No:789",
            "city": "Ankara",
            "district": "Çankaya",
            "block_count": 1,
            "apartment_count": 24,
            "currency": "TRY",
            "aidat_amount": 600.0,
            "admin_name": "Ayşe Kaya",
            "admin_email": "ayse@saribahce.com",
            "admin_phone": "+90 534 777 8899",
            "admin_password": "admin123"
        }
    ]
    
    for building_data in buildings_data:
        building_id = str(uuid.uuid4())
        admin_password = building_data.pop("admin_password")
        
        building = {
            "id": building_id,
            **building_data,
            "is_active": True,
            "subscription_status": "active",
            "subscription_end_date": (datetime.now(timezone.utc) + timedelta(days=365)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.buildings.insert_one(building)
        
        # Create admin user for building
        admin_id = str(uuid.uuid4())
        admin = {
            "id": admin_id,
            "email": building_data["admin_email"],
            "full_name": building_data["admin_name"],
            "role": "building_admin",
            "is_active": True,
            "building_id": building_id,
            "hashed_password": pwd_context.hash(admin_password),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin)
        print(f"✅ {building_data['name']} oluşturuldu - Admin: {building_data['admin_email']} / admin123")
    
    print("\n💳 Abonelik planları oluşturuluyor...")
    # Create subscription plans
    plans_data = [
        {
            "name": "Temel Plan",
            "description": "Küçük siteler için ideal başlangıç paketi",
            "price_monthly": 299.0,
            "price_yearly": 2990.0,
            "max_apartments": 50,
            "features": [
                "Aidat takibi",
                "Duyuru sistemi",
                "Temel raporlama",
                "E-posta desteği"
            ]
        },
        {
            "name": "Profesyonel Plan",
            "description": "Orta ölçekli siteler için tam özellikli paket",
            "price_monthly": 599.0,
            "price_yearly": 5990.0,
            "max_apartments": 150,
            "features": [
                "Tüm Temel Plan özellikleri",
                "Gelişmiş raporlama",
                "SMS entegrasyonu",
                "Ödeme sistemi",
                "Talep yönetimi",
                "Öncelikli destek"
            ]
        },
        {
            "name": "Kurumsal Plan",
            "description": "Büyük siteler ve yönetim şirketleri için",
            "price_monthly": 999.0,
            "price_yearly": 9990.0,
            "max_apartments": 500,
            "features": [
                "Tüm Profesyonel Plan özellikleri",
                "Çoklu bina yönetimi",
                "API erişimi",
                "Özel entegrasyonlar",
                "Hukuki süreç takibi",
                "7/24 destek",
                "Özel eğitim"
            ]
        }
    ]
    
    for plan_data in plans_data:
        plan_id = str(uuid.uuid4())
        plan = {
            "id": plan_id,
            **plan_data,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.subscription_plans.insert_one(plan)
        print(f"✅ {plan_data['name']} oluşturuldu - {plan_data['price_monthly']} TL/ay")
    
    print("\n⚙️  Sistem ayarları oluşturuluyor...")
    # Create default system settings
    settings = {
        "id": "system_settings",
        "sms_provider": None,
        "sms_api_key": None,
        "sms_username": None,
        "payment_provider": None,
        "payment_api_key": None,
        "payment_secret_key": None,
        "email_from": "noreply@binayonetim.com",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.system_settings.insert_one(settings)
    print("✅ Sistem ayarları oluşturuldu")
    
    print("\n✨ Veritabanı başarıyla dolduruldu!")
    print("\n📝 Giriş Bilgileri:")
    print("=" * 50)
    print("Süperadmin:")
    print("  E-posta: admin@test.com")
    print("  Şifre: admin123")
    print("\nBina Yöneticileri:")
    for building in buildings_data:
        print(f"  {building['admin_email']} / admin123")
    print("=" * 50)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
