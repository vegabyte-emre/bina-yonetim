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
    
    def test_send_monthly_due_mail(self):
        """Test sending monthly due notification mail to residents"""
        try:
            if not self.monthly_due_id:
                self.log_test("Send Monthly Due Mail", False, "No monthly due ID available")
                return False
            
            response = self.session.post(f"{BASE_URL}/monthly-dues/{self.monthly_due_id}/send-mail")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    sent_count = data.get("sent_count", 0)
                    failed_count = data.get("failed_count", 0)
                    message = data.get("message", "")
                    
                    # Even if no residents have email, the API should work
                    self.log_test("Send Monthly Due Mail", True, f"Mail sending completed: {message} (Sent: {sent_count}, Failed: {failed_count})")
                    return True
                else:
                    self.log_test("Send Monthly Due Mail", False, "Mail sending failed", data)
                    return False
            else:
                self.log_test("Send Monthly Due Mail", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Send Monthly Due Mail", False, f"Send mail request failed: {str(e)}")
            return False
    
    def test_delete_monthly_due(self):
        """Test deleting the created monthly due (cleanup)"""
        try:
            if not self.monthly_due_id:
                self.log_test("Delete Monthly Due (Cleanup)", True, "No monthly due to delete")
                return True
            
            response = self.session.delete(f"{BASE_URL}/monthly-dues/{self.monthly_due_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Delete Monthly Due (Cleanup)", True, "Monthly due deleted successfully")
                    return True
                else:
                    self.log_test("Delete Monthly Due (Cleanup)", False, "Delete response invalid", data)
                    return False
            else:
                self.log_test("Delete Monthly Due (Cleanup)", False, f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Monthly Due (Cleanup)", False, f"Delete request failed: {str(e)}")
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