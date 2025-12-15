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

class MonthlyDuesTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        self.building_id = None
        self.monthly_due_id = None
        
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
    
    def test_building_admin_login(self):
        """Test building admin login and get token"""
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
                else:
                    self.log_test("Building Admin Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Building Admin Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Building Admin Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_get_building_info(self):
        """Test getting building manager's building info"""
        try:
            response = self.session.get(f"{BASE_URL}/building-manager/my-building")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") and data.get("name"):
                    self.building_id = data["id"]
                    building_name = data["name"]
                    apartment_count = data.get("apartment_count", 0)
                    self.log_test("Get Building Info", True, f"Building info retrieved: {building_name} (ID: {self.building_id}, Apartments: {apartment_count})")
                    return True
                else:
                    self.log_test("Get Building Info", False, "Invalid building data format", data)
                    return False
            else:
                self.log_test("Get Building Info", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Building Info", False, f"Building info request failed: {str(e)}")
            return False
    
    def test_get_monthly_dues_initial(self):
        """Test getting monthly dues list (should be empty or have existing items)"""
        try:
            response = self.session.get(f"{BASE_URL}/monthly-dues")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.initial_dues_count = len(data)
                    self.log_test("Get Monthly Dues (Initial)", True, f"Retrieved monthly dues list with {len(data)} items")
                    return True
                else:
                    self.log_test("Get Monthly Dues (Initial)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Monthly Dues (Initial)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Monthly Dues (Initial)", False, f"Get monthly dues failed: {str(e)}")
            return False
    
    def test_create_monthly_due(self):
        """Test creating a new monthly due with expense items"""
        try:
            if not self.building_id:
                self.log_test("Create Monthly Due", False, "No building ID available")
                return False
            
            monthly_due_data = {
                "building_id": self.building_id,
                "month": "Şubat 2025",
                "expense_items": [
                    {"name": "Elektrik", "amount": 10000},
                    {"name": "Su", "amount": 5000},
                    {"name": "Temizlik", "amount": 3000}
                ],
                "total_amount": 18000,
                "per_apartment_amount": 367.35,
                "due_date": "2025-02-28T00:00:00Z",
                "is_sent": False
            }
            
            response = self.session.post(
                f"{BASE_URL}/monthly-dues",
                json=monthly_due_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("id"):
                    self.monthly_due_id = data["id"]
                    self.log_test("Create Monthly Due", True, f"Monthly due created successfully with ID: {self.monthly_due_id}")
                    return True
                else:
                    self.log_test("Create Monthly Due", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Create Monthly Due", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Monthly Due", False, f"Monthly due creation failed: {str(e)}")
            return False
    
    def test_get_monthly_dues_after_creation(self):
        """Test getting monthly dues list after creation to verify the new due is included"""
        try:
            response = self.session.get(f"{BASE_URL}/monthly-dues")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created monthly due is in the list
                    found_due = None
                    for due in data:
                        if due.get("id") == self.monthly_due_id:
                            found_due = due
                            break
                    
                    if found_due:
                        month = found_due.get("month")
                        total_amount = found_due.get("total_amount")
                        expense_items = found_due.get("expense_items", [])
                        
                        if month == "Şubat 2025" and total_amount == 18000 and len(expense_items) == 3:
                            self.log_test("Get Monthly Dues (After Creation)", True, f"Found created monthly due: {month}, Total: ₺{total_amount:,.2f}, Items: {len(expense_items)}")
                            return True
                        else:
                            self.log_test("Get Monthly Dues (After Creation)", False, f"Monthly due data mismatch - Month: {month}, Total: {total_amount}, Items: {len(expense_items)}")
                            return False
                    else:
                        self.log_test("Get Monthly Dues (After Creation)", False, f"Created monthly due not found in list of {len(data)} items")
                        return False
                else:
                    self.log_test("Get Monthly Dues (After Creation)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Monthly Dues (After Creation)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Monthly Dues (After Creation)", False, f"Get monthly dues failed: {str(e)}")
            return False
    
    def test_get_specific_monthly_due(self):
        """Test getting a specific monthly due by ID"""
        try:
            if not self.monthly_due_id:
                self.log_test("Get Specific Monthly Due", False, "No monthly due ID available")
                return False
            
            response = self.session.get(f"{BASE_URL}/monthly-dues/{self.monthly_due_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("id") == self.monthly_due_id:
                    month = data.get("month")
                    total_amount = data.get("total_amount")
                    per_apartment_amount = data.get("per_apartment_amount")
                    expense_items = data.get("expense_items", [])
                    
                    # Verify expense items
                    expected_items = ["Elektrik", "Su", "Temizlik"]
                    actual_items = [item.get("name") for item in expense_items]
                    
                    if all(item in actual_items for item in expected_items):
                        self.log_test("Get Specific Monthly Due", True, f"Retrieved monthly due: {month}, Total: ₺{total_amount:,.2f}, Per Apt: ₺{per_apartment_amount:.2f}")
                        return True
                    else:
                        self.log_test("Get Specific Monthly Due", False, f"Expense items mismatch - Expected: {expected_items}, Got: {actual_items}")
                        return False
                else:
                    self.log_test("Get Specific Monthly Due", False, "Monthly due ID mismatch", data)
                    return False
            else:
                self.log_test("Get Specific Monthly Due", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Specific Monthly Due", False, f"Get specific monthly due failed: {str(e)}")
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