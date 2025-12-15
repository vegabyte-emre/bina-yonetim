#!/usr/bin/env python3
"""
Test Building Manager Payments feature specifically
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://smart-bms.preview.emergentagent.com/api"
BUILDING_ADMIN_EMAIL = "ahmet@mavirezidans.com"
BUILDING_ADMIN_PASSWORD = "admin123"
SUPERADMIN_EMAIL = "admin@test.com"
SUPERADMIN_PASSWORD = "admin123"

class BuildingPaymentsTester:
    def __init__(self):
        self.session = requests.Session()
        self.superadmin_session = requests.Session()
        self.token = None
        self.superadmin_token = None
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def login_superadmin(self):
        """Login as superadmin to disable Paratika"""
        try:
            login_data = {
                "username": SUPERADMIN_EMAIL,
                "password": SUPERADMIN_PASSWORD
            }
            
            response = self.superadmin_session.post(
                f"{BASE_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.superadmin_token = data.get("access_token")
                if self.superadmin_token:
                    self.superadmin_session.headers.update({"Authorization": f"Bearer {self.superadmin_token}"})
                    self.log_test("Superadmin Login", True, "Successfully logged in as superadmin")
                    return True
            
            self.log_test("Superadmin Login", False, f"Login failed with status {response.status_code}")
            return False
                
        except Exception as e:
            self.log_test("Superadmin Login", False, f"Login request failed: {str(e)}")
            return False
    
    def disable_paratika(self):
        """Disable Paratika to force demo mode"""
        try:
            config_data = {
                "is_active": False,
                "is_live": False,
                "merchant": "700000000",
                "merchant_user": "testuser",
                "merchant_password": "testpass",
                "return_url": "https://yonetioo.com/odeme/basarili",
                "cancel_url": "https://yonetioo.com/odeme/iptal"
            }
            
            response = self.superadmin_session.post(
                f"{BASE_URL}/paratika/config",
                json=config_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Disable Paratika", True, "Paratika disabled for demo mode")
                    return True
            
            self.log_test("Disable Paratika", False, f"Failed to disable Paratika: {response.status_code}")
            return False
                
        except Exception as e:
            self.log_test("Disable Paratika", False, f"Failed to disable Paratika: {str(e)}")
            return False
    
    def login_building_admin(self):
        """Login as building admin"""
        try:
            login_data = {
                "username": BUILDING_ADMIN_EMAIL,
                "password": BUILDING_ADMIN_PASSWORD
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                if self.token:
                    self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                    self.log_test("Building Admin Login", True, "Successfully logged in as building admin")
                    return True
            
            self.log_test("Building Admin Login", False, f"Login failed with status {response.status_code}")
            return False
                
        except Exception as e:
            self.log_test("Building Admin Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_get_building_payments(self):
        """Test GET /api/building-payments"""
        try:
            response = self.session.get(f"{BASE_URL}/building-payments")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    payment = data[0]
                    required_fields = ["id", "period", "amount", "status", "due_date"]
                    missing_fields = [field for field in required_fields if field not in payment]
                    
                    if not missing_fields:
                        periods = [p.get("period", "") for p in data]
                        self.log_test("Get Building Payments", True, f"Retrieved {len(data)} payments with periods: {', '.join(periods[:3])}...")
                        return True, data
                    else:
                        self.log_test("Get Building Payments", False, f"Missing required fields: {missing_fields}")
                        return False, None
                else:
                    self.log_test("Get Building Payments", True, "No payments found (empty list)")
                    return True, []
            else:
                self.log_test("Get Building Payments", False, f"Request failed with status {response.status_code}")
                return False, None
                
        except Exception as e:
            self.log_test("Get Building Payments", False, f"Get building payments failed: {str(e)}")
            return False, None
    
    def test_process_building_payment(self, payments):
        """Test POST /api/building-payments/process"""
        try:
            if not payments:
                self.log_test("Process Building Payment", False, "No payments available for testing")
                return False
            
            # Find a pending payment to process
            pending_payment = None
            for payment in payments:
                if payment.get("status") in ["pending", "upcoming"]:
                    pending_payment = payment
                    break
            
            if not pending_payment:
                # Use the first payment for testing
                pending_payment = payments[0]
            
            payment_data = {
                "payment_id": pending_payment.get("id"),
                "amount": pending_payment.get("amount", 299),
                "period": pending_payment.get("period")
            }
            
            print(f"Testing payment with data: {payment_data}")
            
            response = self.session.post(
                f"{BASE_URL}/building-payments/process",
                json=payment_data,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    expected_message = "Demo ödeme başarılı"
                    if data.get("message") == expected_message:
                        self.log_test("Process Building Payment", True, f"Demo payment processed successfully: {data.get('message')}")
                        return True
                    else:
                        self.log_test("Process Building Payment", True, f"Payment processed: {data.get('message', 'Success')}")
                        return True
                else:
                    self.log_test("Process Building Payment", False, f"Payment processing failed: {data.get('error', data.get('message', 'Unknown error'))}", data)
                    return False
            else:
                self.log_test("Process Building Payment", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Process Building Payment", False, f"Process building payment failed: {str(e)}")
            return False
    
    def run_tests(self):
        """Run building payments tests"""
        print("🚀 Testing Building Manager Payments Feature")
        print(f"📍 Base URL: {BASE_URL}")
        print("=" * 70)
        
        # Step 1: Login as superadmin and disable Paratika
        if not self.login_superadmin():
            return False
        
        if not self.disable_paratika():
            return False
        
        # Step 2: Login as building admin
        if not self.login_building_admin():
            return False
        
        # Step 3: Test get building payments
        success, payments = self.test_get_building_payments()
        if not success:
            return False
        
        # Step 4: Test process payment
        if not self.test_process_building_payment(payments):
            return False
        
        print("=" * 70)
        print("🎉 All building payments tests passed!")
        return True

def main():
    """Main test execution"""
    tester = BuildingPaymentsTester()
    
    try:
        success = tester.run_tests()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()