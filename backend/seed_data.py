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
    
    print("\n🏗️  İlk bina için blok ve daireler oluşturuluyor...")
    # Add blocks, apartments, and residents for first building only (for demo)
    first_building = await db.buildings.find_one({"name": "Mavi Rezidans"}, {"_id": 0})
    if first_building:
        building_id = first_building["id"]
        
        # Create blocks
        blocks = []
        for block_name in ["A", "B"]:
            block_id = str(uuid.uuid4())
            block = {
                "id": block_id,
                "building_id": building_id,
                "name": f"{block_name} Blok",
                "floor_count": 12,
                "apartment_per_floor": 2,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.blocks.insert_one(block)
            blocks.append(block)
            print(f"  ✅ {block_name} Blok oluşturuldu")
        
        # Create apartments
        apartment_statuses = ["owner_occupied", "rented", "empty"]
        apartment_counter = 0
        for block in blocks:
            for floor in range(1, 13):  # 12 floors
                for door in range(1, 3):  # 2 apartments per floor
                    apartment_id = str(uuid.uuid4())
                    apartment_number = f"{block['name'][0]}-{floor}{door}"
                    status = apartment_statuses[apartment_counter % 3]
                    
                    apartment = {
                        "id": apartment_id,
                        "building_id": building_id,
                        "block_id": block["id"],
                        "floor": floor,
                        "door_number": str(door),
                        "apartment_number": apartment_number,
                        "square_meters": 120.0 if door == 1 else 95.0,
                        "room_count": "3+1" if door == 1 else "2+1",
                        "status": status,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.apartments.insert_one(apartment)
                    apartment_counter += 1
        
        print(f"  ✅ {apartment_counter} daire oluşturuldu")
        
        # Create sample residents for occupied apartments
        occupied_apartments = await db.apartments.find({
            "building_id": building_id,
            "status": {"$in": ["owner_occupied", "rented"]}
        }, {"_id": 0}).to_list(20)  # First 20 occupied apartments
        
        resident_names = [
            ("Ali Yılmaz", "+90 532 111 1111", "ali.yilmaz@email.com"),
            ("Ayşe Demir", "+90 533 222 2222", "ayse.demir@email.com"),
            ("Mehmet Kaya", "+90 534 333 3333", "mehmet.kaya@email.com"),
            ("Fatma Şahin", "+90 535 444 4444", "fatma.sahin@email.com"),
            ("Hasan Çelik", "+90 536 555 5555", "hasan.celik@email.com"),
            ("Zeynep Arslan", "+90 537 666 6666", "zeynep.arslan@email.com"),
            ("Mustafa Koç", "+90 538 777 7777", "mustafa.koc@email.com"),
            ("Elif Öztürk", "+90 539 888 8888", "elif.ozturk@email.com"),
        ]
        
        for idx, apartment in enumerate(occupied_apartments):
            if idx >= len(resident_names):
                break
            
            name, phone, email = resident_names[idx]
            resident_id = str(uuid.uuid4())
            resident_type = "owner" if apartment["status"] == "owner_occupied" else "tenant"
            
            resident = {
                "id": resident_id,
                "building_id": building_id,
                "apartment_id": apartment["id"],
                "full_name": name,
                "phone": phone,
                "email": email,
                "type": resident_type,
                "tc_number": f"{10000000000 + idx}",
                "move_in_date": (datetime.now(timezone.utc) - timedelta(days=180)).isoformat(),
                "move_out_date": None,
                "is_active": True,
                "hashed_password": pwd_context.hash("resident123"),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.residents.insert_one(resident)
            
            # Create dues for this resident (last 3 months)
            for month_offset in range(3):
                month_date = datetime.now(timezone.utc) - timedelta(days=30 * month_offset)
                month_str = month_date.strftime("%Y-%m")
                due_id = str(uuid.uuid4())
                
                due_status = "paid" if month_offset > 0 else "unpaid"
                
                due = {
                    "id": due_id,
                    "building_id": building_id,
                    "apartment_id": apartment["id"],
                    "resident_id": resident_id,
                    "month": month_str,
                    "amount": 750.0,
                    "description": f"{month_str} Aidat",
                    "due_date": (month_date.replace(day=1) + timedelta(days=10)).isoformat(),
                    "status": due_status,
                    "paid_date": (month_date + timedelta(days=5)).isoformat() if due_status == "paid" else None,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.dues.insert_one(due)
        
        print(f"  ✅ {len(occupied_apartments)} sakin ve aidatları oluşturuldu")
        
        # Create sample announcements
        announcements_data = [
            {
                "title": "Genel Kurul Toplantısı",
                "content": "Site genel kurulu 15 Ocak 2025 tarihinde saat 19:00'da yapılacaktır. Tüm site sakinlerinin katılımı beklenmektedir.",
                "type": "event"
            },
            {
                "title": "Su Kesintisi",
                "content": "Yarın saat 10:00-14:00 arası bakım çalışması nedeniyle su kesintisi olacaktır.",
                "type": "urgent"
            },
            {
                "title": "Yeni Güvenlik Görevlisi",
                "content": "Gece vardiyasına yeni güvenlik görevlimiz Ali Bey göreve başlamıştır.",
                "type": "general"
            }
        ]
        
        for announcement_data in announcements_data:
            announcement_id = str(uuid.uuid4())
            announcement = {
                "id": announcement_id,
                "building_id": building_id,
                "title": announcement_data["title"],
                "content": announcement_data["content"],
                "type": announcement_data["type"],
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.announcements.insert_one(announcement)
        
        print(f"  ✅ {len(announcements_data)} duyuru oluşturuldu")
        
        # Create sample requests
        sample_residents = await db.residents.find({"building_id": building_id}, {"_id": 0}).to_list(5)
        requests_data = [
            {
                "type": "complaint",
                "category": "cleaning",
                "title": "Asansör Temizliği",
                "description": "3. kattaki asansör temizliği yapılmamış, lütfen dikkat edilmesini rica ediyorum.",
                "priority": "normal",
                "status": "pending"
            },
            {
                "type": "maintenance",
                "category": "plumbing",
                "title": "Musluk Tamiri",
                "description": "Mutfak musluğu damlatıyor, tamir edilmesi gerekiyor.",
                "priority": "high",
                "status": "in_progress"
            },
            {
                "type": "request",
                "category": "other",
                "title": "Park Yeri Talebi",
                "description": "Misafir park yeri için B blok önünde yer ayrılabilir mi?",
                "priority": "low",
                "status": "pending"
            }
        ]
        
        for idx, request_data in enumerate(requests_data):
            if idx >= len(sample_residents):
                break
            
            resident = sample_residents[idx]
            request_id = str(uuid.uuid4())
            request = {
                "id": request_id,
                "building_id": building_id,
                "apartment_id": resident["apartment_id"],
                "resident_id": resident["id"],
                "type": request_data["type"],
                "category": request_data["category"],
                "title": request_data["title"],
                "description": request_data["description"],
                "priority": request_data["priority"],
                "status": request_data["status"],
                "response": "İnceleniyor..." if request_data["status"] == "in_progress" else None,
                "resolved_at": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.requests.insert_one(request)
        
        print(f"  ✅ {len(requests_data)} talep/şikayet oluşturuldu")
    
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
