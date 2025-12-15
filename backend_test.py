#!/usr/bin/env python3
"""
Backend API Testing for Monthly Dues Management (Aidat Yönetimi) System
Tests the complete monthly dues workflow including creation, listing, and mail sending.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://smart-bms.preview.emergentagent.com/api"
BUILDING_ADMIN_EMAIL = "ahmet@mavirezidans.com"
BUILDING_ADMIN_PASSWORD = "admin123"

class RegistrationRequestTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        
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
    
    def test_create_registration_request(self):
        """Test creating a new registration request"""
        try:
            request_data = {
                "building_name": "Test Sitesi",
                "manager_name": "Ahmet Yılmaz", 
                "email": "testmanager@example.com",
                "phone": "05301234567",
                "address": "Istanbul, Kadıköy",
                "apartment_count": "50"
            }
            
            response = self.session.post(
                f"{BASE_URL}/registration-requests",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("request_id"):
                    self.request_id = data["request_id"]
                    self.log_test("Create Registration Request", True, f"Registration request created with ID: {self.request_id}")
                    return True
                else:
                    self.log_test("Create Registration Request", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Create Registration Request", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Registration Request", False, f"Request creation failed: {str(e)}")
            return False
    
    def test_get_registration_requests(self):
        """Test fetching all registration requests as superadmin"""
        try:
            response = self.session.get(f"{BASE_URL}/registration-requests")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our test request is in the list
                    test_request = None
                    for req in data:
                        if req.get("id") == getattr(self, 'request_id', None):
                            test_request = req
                            break
                    
                    if test_request:
                        if test_request.get("status") == "pending":
                            self.log_test("Get Registration Requests", True, f"Found test request with pending status. Total requests: {len(data)}")
                            return True
                        else:
                            self.log_test("Get Registration Requests", False, f"Test request status is {test_request.get('status')}, expected 'pending'")
                            return False
                    else:
                        self.log_test("Get Registration Requests", False, f"Test request not found in list of {len(data)} requests")
                        return False
                else:
                    self.log_test("Get Registration Requests", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Registration Requests", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Registration Requests", False, f"Get requests failed: {str(e)}")
            return False
    
    def test_approve_registration_request(self):
        """Test approving a registration request"""
        try:
            if not hasattr(self, 'request_id'):
                self.log_test("Approve Registration Request", False, "No request ID available for approval test")
                return False
            
            response = self.session.put(f"{BASE_URL}/registration-requests/{self.request_id}/approve")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("building_id") and data.get("user_id"):
                    self.building_id = data["building_id"]
                    self.user_id = data["user_id"]
                    self.temp_password = data.get("temp_password")
                    self.log_test("Approve Registration Request", True, f"Request approved. Building ID: {self.building_id}, User ID: {self.user_id}")
                    return True
                else:
                    self.log_test("Approve Registration Request", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Approve Registration Request", False, f"Approval failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Approve Registration Request", False, f"Approval request failed: {str(e)}")
            return False
    
    def test_create_second_registration_request(self):
        """Test creating a second registration request for rejection test"""
        try:
            request_data = {
                "building_name": "Test Sitesi 2",
                "manager_name": "Mehmet Demir",
                "email": "testmanager2@example.com", 
                "phone": "05309876543",
                "address": "Ankara, Çankaya",
                "apartment_count": "30"
            }
            
            response = self.session.post(
                f"{BASE_URL}/registration-requests",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("request_id"):
                    self.request_id_2 = data["request_id"]
                    self.log_test("Create Second Registration Request", True, f"Second registration request created with ID: {self.request_id_2}")
                    return True
                else:
                    self.log_test("Create Second Registration Request", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Create Second Registration Request", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Second Registration Request", False, f"Second request creation failed: {str(e)}")
            return False
    
    def test_reject_registration_request(self):
        """Test rejecting a registration request"""
        try:
            if not hasattr(self, 'request_id_2'):
                self.log_test("Reject Registration Request", False, "No second request ID available for rejection test")
                return False
            
            response = self.session.put(f"{BASE_URL}/registration-requests/{self.request_id_2}/reject")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Reject Registration Request", True, "Registration request successfully rejected")
                    return True
                else:
                    self.log_test("Reject Registration Request", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Reject Registration Request", False, f"Rejection failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Reject Registration Request", False, f"Rejection request failed: {str(e)}")
            return False
    
    def verify_building_and_user_creation(self):
        """Verify that building and user were created after approval"""
        try:
            if not hasattr(self, 'building_id') or not hasattr(self, 'user_id'):
                self.log_test("Verify Building and User Creation", False, "No building or user ID available for verification")
                return False
            
            # Check if building was created
            building_response = self.session.get(f"{BASE_URL}/buildings/{self.building_id}")
            if building_response.status_code == 200:
                building_data = building_response.json()
                building_name = building_data.get("name")
                
                # Check if user was created
                user_response = self.session.get(f"{BASE_URL}/users/{self.user_id}")
                if user_response.status_code == 200:
                    user_data = user_response.json()
                    user_email = user_data.get("email")
                    user_role = user_data.get("role")
                    
                    if building_name == "Test Sitesi" and user_email == "testmanager@example.com" and user_role == "building_admin":
                        self.log_test("Verify Building and User Creation", True, f"Building '{building_name}' and user '{user_email}' created successfully")
                        return True
                    else:
                        self.log_test("Verify Building and User Creation", False, f"Data mismatch - Building: {building_name}, User: {user_email}, Role: {user_role}")
                        return False
                else:
                    self.log_test("Verify Building and User Creation", False, f"User verification failed with status {user_response.status_code}")
                    return False
            else:
                self.log_test("Verify Building and User Creation", False, f"Building verification failed with status {building_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Verify Building and User Creation", False, f"Verification failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all registration request tests"""
        print("🚀 Starting Registration Request API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_superadmin_login,
            self.test_create_registration_request,
            self.test_get_registration_requests,
            self.test_approve_registration_request,
            self.verify_building_and_user_creation,
            self.test_create_second_registration_request,
            self.test_reject_registration_request
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            print()  # Add spacing between tests
        
        print("=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Registration request flow is working correctly.")
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
    tester = RegistrationRequestTester()
    
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