#!/usr/bin/env python3
"""
Backend API Testing for Superadmin Panel New Integrations + Building Manager Payments
Tests the new integrations:
1. Netgsm Config APIs (GET/POST config, POST test)
2. Paratika Config APIs (GET/POST config, POST test)
3. Subscription-payments endpoint verification
4. Building Manager Payments (GET /api/building-payments, POST /api/building-payments/process)
5. Previous functionality verification
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://propertyflow-8.preview.emergentagent.com/api"
SUPERADMIN_EMAIL = "admin@test.com"
SUPERADMIN_PASSWORD = "admin123"

# Building Admin credentials for building-payments testing
BUILDING_ADMIN_EMAIL = "ahmet@mavirezidans.com"
BUILDING_ADMIN_PASSWORD = "admin123"

class SuperadminPanelTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.building_admin_session = requests.Session()
        self.building_admin_token = None
        self.test_results = []
        # Store created IDs for cleanup
        self.created_registration_request_id = None
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_superadmin_login(self):
        """Test superadmin login and get token"""
        try:
            login_data = {
                "username": SUPERADMIN_EMAIL,
                "password": SUPERADMIN_PASSWORD
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
                    self.log_test("Superadmin Login", True, "Successfully logged in as superadmin")
                    return True
                else:
                    self.log_test("Superadmin Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Superadmin Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Superadmin Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_public_subscription_plans(self):
        """Test public subscription plans endpoint (no auth required)"""
        try:
            # Create a new session without auth headers for this test
            public_session = requests.Session()
            
            response = public_session.get(f"{BASE_URL}/subscriptions/public")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if plans have required fields
                        plan = data[0]
                        required_fields = ["name", "price_monthly", "features"]
                        missing_fields = [field for field in required_fields if field not in plan]
                        
                        if not missing_fields:
                            plan_names = [p.get("name", "Unknown") for p in data]
                            self.log_test("Public Subscription Plans", True, f"Retrieved {len(data)} subscription plans: {', '.join(plan_names)}")
                            return True
                        else:
                            self.log_test("Public Subscription Plans", False, f"Missing required fields: {missing_fields}", plan)
                            return False
                    else:
                        self.log_test("Public Subscription Plans", True, "No subscription plans found (empty list)")
                        return True
                else:
                    self.log_test("Public Subscription Plans", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Public Subscription Plans", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Public Subscription Plans", False, f"Public subscription plans request failed: {str(e)}")
            return False
    
    def test_get_registration_requests(self):
        """Test getting registration requests list"""
        try:
            response = self.session.get(f"{BASE_URL}/registration-requests")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Registration Requests", True, f"Retrieved registration requests list with {len(data)} items")
                    return True
                else:
                    self.log_test("Get Registration Requests", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Registration Requests", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Registration Requests", False, f"Get registration requests failed: {str(e)}")
            return False
    
    def test_create_registration_request(self):
        """Test creating a new registration request (public endpoint)"""
        try:
            # Create a new session without auth headers for this test
            public_session = requests.Session()
            
            registration_data = {
                "building_name": "Test Building for API Testing",
                "manager_name": "Test Manager",
                "email": f"test.manager.{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
                "phone": "+90 555 123 4567",
                "address": "Test Address, Test District, Test City",
                "apartment_count": "50"
            }
            
            response = public_session.post(
                f"{BASE_URL}/registration-requests",
                json=registration_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("request_id"):
                    self.created_registration_request_id = data["request_id"]
                    self.log_test("Create Registration Request", True, f"Registration request created successfully with ID: {self.created_registration_request_id}")
                    return True
                else:
                    self.log_test("Create Registration Request", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Create Registration Request", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Registration Request", False, f"Registration request creation failed: {str(e)}")
            return False
    
    def test_get_registration_requests_after_creation(self):
        """Test getting registration requests list after creation to verify the new request is included"""
        try:
            response = self.session.get(f"{BASE_URL}/registration-requests")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created registration request is in the list
                    found_request = None
                    for request in data:
                        if request.get("id") == self.created_registration_request_id:
                            found_request = request
                            break
                    
                    if found_request:
                        building_name = found_request.get("building_name")
                        manager_name = found_request.get("manager_name")
                        status = found_request.get("status")
                        
                        if building_name == "Test Building for API Testing" and manager_name == "Test Manager" and status == "pending":
                            self.log_test("Get Registration Requests (After Creation)", True, f"Found created registration request: {building_name}, Manager: {manager_name}, Status: {status}")
                            return True
                        else:
                            self.log_test("Get Registration Requests (After Creation)", False, f"Registration request data mismatch - Building: {building_name}, Manager: {manager_name}, Status: {status}")
                            return False
                    else:
                        self.log_test("Get Registration Requests (After Creation)", False, f"Created registration request not found in list of {len(data)} items")
                        return False
                else:
                    self.log_test("Get Registration Requests (After Creation)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Registration Requests (After Creation)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Registration Requests (After Creation)", False, f"Get registration requests failed: {str(e)}")
            return False
    
    def test_delete_registration_request(self):
        """Test deleting a registration request"""
        try:
            if not self.created_registration_request_id:
                self.log_test("Delete Registration Request", False, "No registration request ID available")
                return False
            
            response = self.session.delete(f"{BASE_URL}/registration-requests/{self.created_registration_request_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("message") == "Başvuru silindi":
                    self.log_test("Delete Registration Request", True, f"Registration request deleted successfully: {data.get('message')}")
                    return True
                else:
                    self.log_test("Delete Registration Request", False, "Invalid delete response", data)
                    return False
            else:
                self.log_test("Delete Registration Request", False, f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Registration Request", False, f"Delete registration request failed: {str(e)}")
            return False
    
    def test_verify_deletion(self):
        """Test verifying that the deleted registration request is no longer in the list"""
        try:
            if not self.created_registration_request_id:
                self.log_test("Verify Deletion", True, "No registration request to verify deletion")
                return True
            
            response = self.session.get(f"{BASE_URL}/registration-requests")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our deleted registration request is NOT in the list
                    found_request = None
                    for request in data:
                        if request.get("id") == self.created_registration_request_id:
                            found_request = request
                            break
                    
                    if not found_request:
                        self.log_test("Verify Deletion", True, f"Registration request successfully deleted and not found in list of {len(data)} items")
                        return True
                    else:
                        self.log_test("Verify Deletion", False, f"Registration request still exists after deletion: {found_request}")
                        return False
                else:
                    self.log_test("Verify Deletion", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Verify Deletion", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Verify Deletion", False, f"Verify deletion failed: {str(e)}")
            return False
    
    def test_subscription_plans_with_auth(self):
        """Test subscription plans endpoint with authentication (superadmin access)"""
        try:
            response = self.session.get(f"{BASE_URL}/subscriptions")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Subscription Plans (With Auth)", True, f"Retrieved {len(data)} subscription plans with authentication")
                    return True
                else:
                    self.log_test("Subscription Plans (With Auth)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Subscription Plans (With Auth)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Subscription Plans (With Auth)", False, f"Subscription plans with auth failed: {str(e)}")
            return False
    
    def test_netgsm_get_config(self):
        """Test GET /api/netgsm/config - Should return config (may be empty)"""
        try:
            response = self.session.get(f"{BASE_URL}/netgsm/config")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    self.log_test("Netgsm Get Config", True, f"Retrieved Netgsm config: {len(data)} fields")
                    return True
                else:
                    self.log_test("Netgsm Get Config", False, "Response is not a dict", data)
                    return False
            else:
                self.log_test("Netgsm Get Config", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Netgsm Get Config", False, f"Netgsm get config failed: {str(e)}")
            return False
    
    def test_netgsm_save_config(self):
        """Test POST /api/netgsm/config - Save config"""
        try:
            config_data = {
                "is_active": True,
                "username": "850XXXXXXX",
                "password": "testpass",
                "default_sender": "YONETIOO"
            }
            
            response = self.session.post(
                f"{BASE_URL}/netgsm/config",
                json=config_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Netgsm Save Config", True, f"Netgsm config saved successfully: {data.get('message', 'OK')}")
                    return True
                else:
                    self.log_test("Netgsm Save Config", False, "Save failed", data)
                    return False
            else:
                self.log_test("Netgsm Save Config", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Netgsm Save Config", False, f"Netgsm save config failed: {str(e)}")
            return False
    
    def test_netgsm_test_connection(self):
        """Test POST /api/netgsm/test - Test connection (may fail without real credentials)"""
        try:
            response = self.session.post(f"{BASE_URL}/netgsm/test")
            
            if response.status_code == 200:
                data = response.json()
                if "success" in data:
                    if data.get("success"):
                        self.log_test("Netgsm Test Connection", True, f"Netgsm connection test successful: {data.get('message', 'OK')}")
                    else:
                        # Expected to fail with test credentials
                        self.log_test("Netgsm Test Connection", True, f"Netgsm connection test failed as expected: {data.get('error', 'Connection failed')}")
                    return True
                else:
                    self.log_test("Netgsm Test Connection", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Netgsm Test Connection", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Netgsm Test Connection", False, f"Netgsm test connection failed: {str(e)}")
            return False
    
    def test_paratika_get_config(self):
        """Test GET /api/paratika/config - Should return config (may be empty)"""
        try:
            response = self.session.get(f"{BASE_URL}/paratika/config")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    # Check for password masking
                    password_masked = False
                    if "password" in data and data["password"] == "••••••••":
                        password_masked = True
                    elif "merchant_password" in data and data["merchant_password"] == "••••••••":
                        password_masked = True
                    
                    message = f"Retrieved Paratika config: {len(data)} fields"
                    if password_masked:
                        message += " (password properly masked)"
                    
                    self.log_test("Paratika Get Config", True, message)
                    return True
                else:
                    self.log_test("Paratika Get Config", False, "Response is not a dict", data)
                    return False
            else:
                self.log_test("Paratika Get Config", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Paratika Get Config", False, f"Paratika get config failed: {str(e)}")
            return False
    
    def test_paratika_save_config(self):
        """Test POST /api/paratika/config - Save config"""
        try:
            config_data = {
                "is_active": True,
                "is_live": False,
                "merchant": "700000000",
                "merchant_user": "testuser",
                "merchant_password": "testpass",
                "return_url": "https://yonetioo.com/odeme/basarili",
                "cancel_url": "https://yonetioo.com/odeme/iptal"
            }
            
            response = self.session.post(
                f"{BASE_URL}/paratika/config",
                json=config_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Paratika Save Config", True, f"Paratika config saved successfully: {data.get('message', 'OK')}")
                    return True
                else:
                    self.log_test("Paratika Save Config", False, "Save failed", data)
                    return False
            else:
                self.log_test("Paratika Save Config", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Paratika Save Config", False, f"Paratika save config failed: {str(e)}")
            return False
    
    def test_paratika_test_connection(self):
        """Test POST /api/paratika/test - Test connection (may fail without real credentials)"""
        try:
            response = self.session.post(f"{BASE_URL}/paratika/test")
            
            if response.status_code == 200:
                data = response.json()
                if "success" in data:
                    if data.get("success"):
                        self.log_test("Paratika Test Connection", True, f"Paratika connection test successful: {data.get('message', 'OK')}")
                    else:
                        # Expected to fail with test credentials
                        self.log_test("Paratika Test Connection", True, f"Paratika connection test failed as expected: {data.get('error', 'Connection failed')}")
                    return True
                else:
                    self.log_test("Paratika Test Connection", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Paratika Test Connection", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Paratika Test Connection", False, f"Paratika test connection failed: {str(e)}")
            return False
    
    def test_subscription_payments_endpoint(self):
        """Test GET /api/subscription-payments endpoint exists (for Finance page)"""
        try:
            response = self.session.get(f"{BASE_URL}/subscription-payments")
            
            # We expect this endpoint to exist, even if it returns empty data or 404
            if response.status_code in [200, 404]:
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("Subscription Payments Endpoint", True, f"Endpoint exists and returned data: {type(data)}")
                else:
                    self.log_test("Subscription Payments Endpoint", False, "Endpoint returns 404 - not implemented yet")
                return response.status_code == 200
            else:
                self.log_test("Subscription Payments Endpoint", False, f"Unexpected status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Subscription Payments Endpoint", False, f"Subscription payments endpoint test failed: {str(e)}")
            return False
    
    def test_building_admin_login(self):
        """Test building admin login and get token"""
        try:
            login_data = {
                "username": BUILDING_ADMIN_EMAIL,
                "password": BUILDING_ADMIN_PASSWORD
            }
            
            response = self.building_admin_session.post(
                f"{BASE_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.building_admin_token = data.get("access_token")
                if self.building_admin_token:
                    self.building_admin_session.headers.update({"Authorization": f"Bearer {self.building_admin_token}"})
                    self.log_test("Building Admin Login", True, "Successfully logged in as building admin")
                    return True
                else:
                    self.log_test("Building Admin Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Building Admin Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Building Admin Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_get_building_payments(self):
        """Test GET /api/building-payments - Should return payment schedule"""
        try:
            response = self.building_admin_session.get(f"{BASE_URL}/building-payments")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if payments have required fields
                        payment = data[0]
                        required_fields = ["id", "period", "amount", "status", "due_date"]
                        missing_fields = [field for field in required_fields if field not in payment]
                        
                        if not missing_fields:
                            # Check for expected periods (months) and Turkish Lira amounts
                            periods = [p.get("period", "") for p in data]
                            amounts = [p.get("amount", 0) for p in data]
                            statuses = [p.get("status", "") for p in data]
                            
                            # Verify we have different payment statuses
                            expected_statuses = ["paid", "pending", "upcoming"]
                            found_statuses = list(set(statuses))
                            
                            # Check for Turkish month names
                            turkish_months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                                            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
                            has_turkish_months = any(any(month in period for month in turkish_months) for period in periods)
                            
                            message = f"Retrieved {len(data)} payments with periods: {', '.join(periods[:3])}..."
                            if has_turkish_months:
                                message += " (Turkish months ✓)"
                            if len(found_statuses) > 1:
                                message += f" Statuses: {', '.join(found_statuses)}"
                            
                            self.log_test("Get Building Payments", True, message)
                            return True
                        else:
                            self.log_test("Get Building Payments", False, f"Missing required fields: {missing_fields}", payment)
                            return False
                    else:
                        self.log_test("Get Building Payments", True, "No payments found (empty list)")
                        return True
                else:
                    self.log_test("Get Building Payments", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Building Payments", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Building Payments", False, f"Get building payments failed: {str(e)}")
            return False
    
    def test_process_building_payment(self):
        """Test POST /api/building-payments/process - Payment processing (demo or Paratika)"""
        try:
            # First get the payment schedule to get a valid payment_id
            response = self.building_admin_session.get(f"{BASE_URL}/building-payments")
            
            if response.status_code != 200:
                self.log_test("Process Building Payment", False, "Could not get payment schedule for testing")
                return False
            
            payments = response.json()
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
            
            response = self.building_admin_session.post(
                f"{BASE_URL}/building-payments/process",
                json=payment_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    # Check for different success scenarios
                    if data.get("message") == "Demo ödeme başarılı":
                        self.log_test("Process Building Payment", True, f"Demo payment processed successfully: {data.get('message')}")
                        return True
                    elif data.get("payment_url"):
                        self.log_test("Process Building Payment", True, f"Paratika payment session created: {data.get('payment_url')[:50]}...")
                        return True
                    else:
                        self.log_test("Process Building Payment", True, f"Payment processed: {data.get('message', 'Success')}")
                        return True
                else:
                    # Handle expected failures (like Paratika test credentials being declined)
                    error = data.get('error', data.get('message', 'Unknown error'))
                    if error == "Declined":
                        self.log_test("Process Building Payment", True, f"Paratika payment declined as expected with test credentials: {error}")
                        return True
                    else:
                        self.log_test("Process Building Payment", False, f"Payment processing failed: {error}", data)
                        return False
            else:
                self.log_test("Process Building Payment", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Process Building Payment", False, f"Process building payment failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Superadmin Panel new integrations tests"""
        print("🚀 Starting Superadmin Panel New Integrations API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"👤 Superadmin: {SUPERADMIN_EMAIL}")
        print("=" * 70)
        
        # Test sequence
        tests = [
            # Test 1: Superadmin Authentication (Required for other tests)
            self.test_superadmin_login,
            
            # Test 2: Netgsm Config APIs
            self.test_netgsm_get_config,
            self.test_netgsm_save_config,
            self.test_netgsm_test_connection,
            
            # Test 3: Paratika Config APIs
            self.test_paratika_get_config,
            self.test_paratika_save_config,
            self.test_paratika_test_connection,
            
            # Test 4: Subscription Payments Endpoint
            self.test_subscription_payments_endpoint,
            
            # Test 5: Building Admin Authentication & Building Payments
            self.test_building_admin_login,
            self.test_get_building_payments,
            self.test_process_building_payment,
            
            # Test 6: Previous functionality verification
            self.test_public_subscription_plans,
            self.test_get_registration_requests,
            self.test_subscription_plans_with_auth
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            print()  # Add spacing between tests
        
        print("=" * 70)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Superadmin Panel new integrations are working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return False
    
    def print_summary(self):
        """Print detailed test summary"""
        print("\n" + "=" * 60)
        print("📋 DETAILED TEST SUMMARY")
        print("=" * 60)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            print(f"   Message: {result['message']}")
            if result.get("details") and not result["success"]:
                print(f"   Details: {result['details']}")
            print()

def main():
    """Main test execution"""
    tester = SuperadminPanelTester()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()