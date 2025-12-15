#!/usr/bin/env python3
"""
Backend API Testing for Superadmin Panel Improvements
Tests the 4 key improvements:
1. Public Subscription Plans (No Auth Required)
2. Delete Registration Request
3. Login functionality
4. Registration requests management
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://smart-bms.preview.emergentagent.com/api"
SUPERADMIN_EMAIL = "admin@test.com"
SUPERADMIN_PASSWORD = "admin123"

class SuperadminPanelTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
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
    
    def run_all_tests(self):
        """Run all monthly dues management tests"""
        print("🚀 Starting Monthly Dues Management (Aidat Yönetimi) API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"👤 Building Admin: {BUILDING_ADMIN_EMAIL}")
        print("=" * 70)
        
        # Test sequence
        tests = [
            self.test_building_admin_login,
            self.test_get_building_info,
            self.test_get_monthly_dues_initial,
            self.test_create_monthly_due,
            self.test_get_monthly_dues_after_creation,
            self.test_get_specific_monthly_due,
            self.test_send_monthly_due_mail,
            self.test_delete_monthly_due
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
            print("🎉 All tests passed! Monthly Dues Management system is working correctly.")
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
    tester = MonthlyDuesTester()
    
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