#!/usr/bin/env python3
"""
Backend bağlantı ve login test scripti
"""
import requests
import json
import sys

BACKEND_URL = "http://72.62.58.82:8001"

def test_backend():
    print("=" * 60)
    print("🔧 BACKEND BAĞLANTI TESTİ")
    print("=" * 60)
    
    # Test 1: Health check
    print("\n1️⃣  Backend erişilebilirlik testi...")
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend erişilebilir")
        else:
            print(f"   ⚠️  Beklenmeyen durum: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Backend'e ulaşılamıyor: {e}")
        return False
    
    # Test 2: API endpoint
    print("\n2️⃣  API endpoint testi...")
    try:
        response = requests.get(f"{BACKEND_URL}/api/residents", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ✅ API çalışıyor (401 expected - authentication gerekli)")
        else:
            print(f"   ⚠️  Beklenmeyen status")
    except Exception as e:
        print(f"   ❌ API'ye erişilemiyor: {e}")
        return False
    
    # Test 3: Resident login
    print("\n3️⃣  Resident login testi...")
    test_data = {
        "phone": "5321111111",
        "password": "resident123"
    }
    
    print(f"   Request: {json.dumps(test_data)}")
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/auth/resident-login",
            json=test_data,
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        
        if response.status_code == 200:
            data = response.json()
            if 'access_token' in data:
                print(f"   ✅ LOGIN BAŞARILI!")
                print(f"   Token: {data['access_token'][:50]}...")
                return True
            else:
                print(f"   ❌ Token yok: {data}")
                return False
        else:
            data = response.json()
            print(f"   ❌ Login başarısız: {data.get('detail', 'Bilinmeyen hata')}")
            return False
            
    except Exception as e:
        print(f"   ❌ İstek hatası: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("\n" + "🔍 Test başlatılıyor...\n")
    success = test_backend()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ TÜM TESTLER BAŞARILI - Backend çalışıyor!")
    else:
        print("❌ TESTLER BAŞARISIZ - Backend sorunlu!")
    print("=" * 60 + "\n")
    
    sys.exit(0 if success else 1)
