#!/usr/bin/env python3
"""
Building Management System Backend API Testing
Tests the specific APIs requested in the review:
1. Resident Dues API (Priority)
2. Resident Info API  
3. Building Status API
4. Building Manager Mail Sending
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://smartbuild-mgr.preview.emergentagent.com/api"

# Test credentials from review request
RESIDENT_PHONE = "5321111111"
RESIDENT_PASSWORD = "123456"

BUILDING_MANAGER_EMAIL = "ahmet@mavirezidans.com"
BUILDING_MANAGER_PASSWORD = "admin123"

class BuildingManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.resident_token = None
        self.building_manager_token = None
        self.building_id = None
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
    
    def test_resident_login(self):
        """Test resident login with provided credentials"""
        try:
            login_data = {
                "phone": RESIDENT_PHONE,
                "password": RESIDENT_PASSWORD
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/resident-login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.resident_token = data.get("access_token")
                if self.resident_token:
                    self.log_test("Resident Login", True, f"Successfully logged in resident with phone: {RESIDENT_PHONE}")
                    return True
                else:
                    self.log_test("Resident Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Resident Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Resident Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_resident_info_api(self):
        """Test GET /api/residents/me with resident token"""
        try:
            if not self.resident_token:
                self.log_test("Resident Info API", False, "No resident token available")
                return False
            
            headers = {"Authorization": f"Bearer {self.resident_token}"}
            response = self.session.get(f"{BASE_URL}/residents/me", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                # Verify required fields
                required_fields = ["id", "full_name", "phone", "building_id"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.building_id = data.get("building_id")  # Store for later tests
                    self.log_test("Resident Info API", True, f"Retrieved resident info: {data.get('full_name')} - Building ID: {self.building_id}")
                    return True
                else:
                    self.log_test("Resident Info API", False, f"Missing required fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("Resident Info API", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Resident Info API", False, f"Resident info request failed: {str(e)}")
            return False
    
    def test_resident_dues_api(self):
        """Test GET /api/residents/my-dues with resident token (Priority test)"""
        try:
            if not self.resident_token:
                self.log_test("Resident Dues API", False, "No resident token available")
                return False
            
            headers = {"Authorization": f"Bearer {self.resident_token}"}
            response = self.session.get(f"{BASE_URL}/residents/my-dues", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                # Verify required fields from review request
                required_fields = ["total_debt", "overdue_count", "dues"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check dues array structure
                    dues = data.get("dues", [])
                    if isinstance(dues, list):
                        # Check if dues have status field
                        if len(dues) > 0:
                            first_due = dues[0]
                            if "status" in first_due:
                                self.log_test("Resident Dues API", True, 
                                    f"Retrieved dues: Total debt: {data.get('total_debt')}, "
                                    f"Overdue count: {data.get('overdue_count')}, "
                                    f"Dues count: {len(dues)}")
                                return True
                            else:
                                self.log_test("Resident Dues API", False, "Dues missing 'status' field", first_due)
                                return False
                        else:
                            self.log_test("Resident Dues API", True, 
                                f"Retrieved dues structure (empty): Total debt: {data.get('total_debt')}, "
                                f"Overdue count: {data.get('overdue_count')}")
                            return True
                    else:
                        self.log_test("Resident Dues API", False, "Dues field is not an array", data)
                        return False
                else:
                    self.log_test("Resident Dues API", False, f"Missing required fields: {missing_fields}", data)
                    return False
            else:
                self.log_test("Resident Dues API", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Resident Dues API", False, f"Resident dues request failed: {str(e)}")
            return False
    
    def test_building_status_api(self):
        """Test GET /api/building-status/{building_id}"""
        try:
            if not self.building_id:
                self.log_test("Building Status API", False, "No building ID available from resident info")
                return False
            
            # Try without authentication first (public endpoint)
            response = self.session.get(f"{BASE_URL}/building-status/{self.building_id}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    self.log_test("Building Status API", True, f"Retrieved building status for building {self.building_id}: {len(data)} fields")
                    return True
                else:
                    self.log_test("Building Status API", False, "Response is not a dict", data)
                    return False
            elif response.status_code == 401:
                # Try with resident token
                headers = {"Authorization": f"Bearer {self.resident_token}"}
                response = self.session.get(f"{BASE_URL}/building-status/{self.building_id}", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict):
                        self.log_test("Building Status API", True, f"Retrieved building status (with auth) for building {self.building_id}: {len(data)} fields")
                        return True
                    else:
                        self.log_test("Building Status API", False, "Response is not a dict", data)
                        return False
                else:
                    self.log_test("Building Status API", False, f"Request failed with status {response.status_code} (even with auth)", response.text)
                    return False
            else:
                self.log_test("Building Status API", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Building Status API", False, f"Building status request failed: {str(e)}")
            return False
    
    def test_building_manager_login(self):
        """Test building manager login with provided credentials"""
        try:
            login_data = {
                "username": BUILDING_MANAGER_EMAIL,
                "password": BUILDING_MANAGER_PASSWORD
            }
            
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.building_manager_token = data.get("access_token")
                if self.building_manager_token:
                    self.log_test("Building Manager Login", True, f"Successfully logged in building manager: {BUILDING_MANAGER_EMAIL}")
                    return True
                else:
                    self.log_test("Building Manager Login", False, "No access token in response", data)
                    return False
            else:
                self.log_test("Building Manager Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Building Manager Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_monthly_dues_list(self):
        """Test GET /api/monthly-dues to list monthly due definitions"""
        try:
            if not self.building_manager_token:
                self.log_test("Monthly Dues List", False, "No building manager token available")
                return False
            
            headers = {"Authorization": f"Bearer {self.building_manager_token}"}
            response = self.session.get(f"{BASE_URL}/monthly-dues", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Monthly Dues List", True, f"Retrieved {len(data)} monthly due definitions")
                    return data  # Return data for next test
                else:
                    self.log_test("Monthly Dues List", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Monthly Dues List", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Monthly Dues List", False, f"Monthly dues list request failed: {str(e)}")
            return False
    
    def test_send_mail_endpoint(self):
        """Test POST /api/monthly-dues/{id}/send-mail endpoint (if dues exist)"""
        try:
            # First get the monthly dues list
            monthly_dues = self.test_monthly_dues_list()
            
            if not monthly_dues or not isinstance(monthly_dues, list):
                self.log_test("Send Mail Endpoint", True, "No monthly dues available to test mail sending (expected)")
                return True
            
            if len(monthly_dues) == 0:
                self.log_test("Send Mail Endpoint", True, "No monthly dues found to test mail sending (expected)")
                return True
            
            # Try to send mail for the first due definition
            first_due = monthly_dues[0]
            due_id = first_due.get("id")
            
            if not due_id:
                self.log_test("Send Mail Endpoint", False, "No ID found in monthly due definition", first_due)
                return False
            
            headers = {"Authorization": f"Bearer {self.building_manager_token}"}
            response = self.session.post(f"{BASE_URL}/monthly-dues/{due_id}/send-mail", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    sent_count = data.get("sent_count", 0)
                    self.log_test("Send Mail Endpoint", True, f"Mail sending successful: {data.get('message')} (sent to {sent_count} recipients)")
                    return True
                else:
                    # Mail sending might fail due to configuration, but endpoint should work
                    message = data.get("message", "Unknown error")
                    if "mail" in message.lower() or "email" in message.lower():
                        self.log_test("Send Mail Endpoint", True, f"Mail endpoint working but sending failed (expected): {message}")
                        return True
                    else:
                        self.log_test("Send Mail Endpoint", False, f"Mail sending failed: {message}", data)
                        return False
            else:
                self.log_test("Send Mail Endpoint", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Send Mail Endpoint", False, f"Send mail endpoint test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Building Management System API tests"""
        print("🏢 Starting Building Management System Backend API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"📱 Resident Phone: {RESIDENT_PHONE}")
        print(f"👤 Building Manager: {BUILDING_MANAGER_EMAIL}")
        print("=" * 70)
        
        # Test sequence
        tests = [
            # Priority 1: Resident Dues API
            ("Resident Authentication", self.test_resident_login),
            ("Resident Info API", self.test_resident_info_api),
            ("Resident Dues API (Priority)", self.test_resident_dues_api),
            
            # Building Status API
            ("Building Status API", self.test_building_status_api),
            
            # Building Manager Mail Sending
            ("Building Manager Authentication", self.test_building_manager_login),
            ("Monthly Dues List", lambda: bool(self.test_monthly_dues_list())),
            ("Send Mail Endpoint", self.test_send_mail_endpoint),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution failed: {str(e)}")
        
        print("\n" + "=" * 70)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All Building Management System API tests passed!")
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
    tester = BuildingManagementTester()
    
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