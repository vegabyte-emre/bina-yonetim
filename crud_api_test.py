#!/usr/bin/env python3
"""
Backend API Testing for Building Manager Admin Panel
Tests CRUD APIs for Surveys, Votings, Meetings, and Decisions
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://buildpro-mgmt.preview.emergentagent.com/api"
BUILDING_ADMIN_EMAIL = "ahmet@mavirezidans.com"
BUILDING_ADMIN_PASSWORD = "admin123"

class CRUDAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        self.building_id = None
        # Store created IDs for cleanup
        self.created_survey_id = None
        self.created_voting_id = None
        self.created_meeting_id = None
        self.created_decision_id = None
        
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

    # ============ SURVEYS CRUD TESTS ============
    
    def test_get_surveys_initial(self):
        """Test getting surveys list (initial state)"""
        try:
            response = self.session.get(f"{BASE_URL}/surveys")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Surveys (Initial)", True, f"Retrieved surveys list with {len(data)} items")
                    return True
                else:
                    self.log_test("Get Surveys (Initial)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Surveys (Initial)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Surveys (Initial)", False, f"Get surveys failed: {str(e)}")
            return False
    
    def test_create_survey(self):
        """Test creating a new survey"""
        try:
            survey_data = {
                "title": "Asansör Yenileme",
                "description": "Asansör değişikliği hakkında görüşler",
                "questions": [{"question": "Asansör yenilensin mi?", "options": ["Evet", "Hayır"]}],
                "end_date": "2025-02-28"
            }
            
            response = self.session.post(
                f"{BASE_URL}/surveys",
                json=survey_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("id"):
                    self.created_survey_id = data["id"]
                    self.log_test("Create Survey", True, f"Survey created successfully with ID: {self.created_survey_id}")
                    return True
                else:
                    self.log_test("Create Survey", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Create Survey", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Survey", False, f"Survey creation failed: {str(e)}")
            return False
    
    def test_get_surveys_after_creation(self):
        """Test getting surveys list after creation"""
        try:
            response = self.session.get(f"{BASE_URL}/surveys")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created survey is in the list
                    found_survey = None
                    for survey in data:
                        if survey.get("id") == self.created_survey_id:
                            found_survey = survey
                            break
                    
                    if found_survey:
                        title = found_survey.get("title")
                        questions = found_survey.get("questions", [])
                        self.log_test("Get Surveys (After Creation)", True, f"Found created survey: {title}, Questions: {len(questions)}")
                        return True
                    else:
                        self.log_test("Get Surveys (After Creation)", False, f"Created survey not found in list of {len(data)} items")
                        return False
                else:
                    self.log_test("Get Surveys (After Creation)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Surveys (After Creation)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Surveys (After Creation)", False, f"Get surveys failed: {str(e)}")
            return False
    
    def test_delete_survey(self):
        """Test deleting the created survey"""
        try:
            if not self.created_survey_id:
                self.log_test("Delete Survey", True, "No survey to delete")
                return True
            
            response = self.session.delete(f"{BASE_URL}/surveys/{self.created_survey_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Delete Survey", True, "Survey deleted successfully")
                    return True
                else:
                    self.log_test("Delete Survey", False, "Delete response invalid", data)
                    return False
            else:
                self.log_test("Delete Survey", False, f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Survey", False, f"Delete request failed: {str(e)}")
            return False

    # ============ VOTINGS CRUD TESTS ============
    
    def test_get_votings_initial(self):
        """Test getting votings list (initial state)"""
        try:
            response = self.session.get(f"{BASE_URL}/votings")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Votings (Initial)", True, f"Retrieved votings list with {len(data)} items")
                    return True
                else:
                    self.log_test("Get Votings (Initial)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Votings (Initial)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Votings (Initial)", False, f"Get votings failed: {str(e)}")
            return False
    
    def test_create_voting(self):
        """Test creating a new voting"""
        try:
            voting_data = {
                "title": "Güvenlik Kamerası Yatırımı",
                "description": "Güvenlik kameraları için 50.000 TL bütçe ayrılması",
                "end_date": "2025-01-31"
            }
            
            response = self.session.post(
                f"{BASE_URL}/votings",
                json=voting_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("id"):
                    self.created_voting_id = data["id"]
                    self.log_test("Create Voting", True, f"Voting created successfully with ID: {self.created_voting_id}")
                    return True
                else:
                    self.log_test("Create Voting", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Create Voting", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Voting", False, f"Voting creation failed: {str(e)}")
            return False
    
    def test_get_votings_after_creation(self):
        """Test getting votings list after creation"""
        try:
            response = self.session.get(f"{BASE_URL}/votings")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created voting is in the list
                    found_voting = None
                    for voting in data:
                        if voting.get("id") == self.created_voting_id:
                            found_voting = voting
                            break
                    
                    if found_voting:
                        title = found_voting.get("title")
                        description = found_voting.get("description")
                        self.log_test("Get Votings (After Creation)", True, f"Found created voting: {title}")
                        return True
                    else:
                        self.log_test("Get Votings (After Creation)", False, f"Created voting not found in list of {len(data)} items")
                        return False
                else:
                    self.log_test("Get Votings (After Creation)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Votings (After Creation)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Votings (After Creation)", False, f"Get votings failed: {str(e)}")
            return False
    
    def test_delete_voting(self):
        """Test deleting the created voting"""
        try:
            if not self.created_voting_id:
                self.log_test("Delete Voting", True, "No voting to delete")
                return True
            
            response = self.session.delete(f"{BASE_URL}/votings/{self.created_voting_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Delete Voting", True, "Voting deleted successfully")
                    return True
                else:
                    self.log_test("Delete Voting", False, "Delete response invalid", data)
                    return False
            else:
                self.log_test("Delete Voting", False, f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Voting", False, f"Delete request failed: {str(e)}")
            return False

    # ============ MEETINGS CRUD TESTS ============
    
    def test_get_meetings_initial(self):
        """Test getting meetings list (initial state)"""
        try:
            response = self.session.get(f"{BASE_URL}/meetings")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Meetings (Initial)", True, f"Retrieved meetings list with {len(data)} items")
                    return True
                else:
                    self.log_test("Get Meetings (Initial)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Meetings (Initial)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Meetings (Initial)", False, f"Get meetings failed: {str(e)}")
            return False
    
    def test_create_meeting(self):
        """Test creating a new meeting"""
        try:
            meeting_data = {
                "title": "Olağan Genel Kurul",
                "description": "2025 Yılı bütçe görüşmeleri",
                "date": "2025-02-15",
                "time": "14:00",
                "location": "A Blok Toplantı Salonu"
            }
            
            response = self.session.post(
                f"{BASE_URL}/meetings",
                json=meeting_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("id"):
                    self.created_meeting_id = data["id"]
                    self.log_test("Create Meeting", True, f"Meeting created successfully with ID: {self.created_meeting_id}")
                    return True
                else:
                    self.log_test("Create Meeting", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Create Meeting", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Meeting", False, f"Meeting creation failed: {str(e)}")
            return False
    
    def test_get_meetings_after_creation(self):
        """Test getting meetings list after creation"""
        try:
            response = self.session.get(f"{BASE_URL}/meetings")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created meeting is in the list
                    found_meeting = None
                    for meeting in data:
                        if meeting.get("id") == self.created_meeting_id:
                            found_meeting = meeting
                            break
                    
                    if found_meeting:
                        title = found_meeting.get("title")
                        location = found_meeting.get("location")
                        self.log_test("Get Meetings (After Creation)", True, f"Found created meeting: {title} at {location}")
                        return True
                    else:
                        self.log_test("Get Meetings (After Creation)", False, f"Created meeting not found in list of {len(data)} items")
                        return False
                else:
                    self.log_test("Get Meetings (After Creation)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Meetings (After Creation)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Meetings (After Creation)", False, f"Get meetings failed: {str(e)}")
            return False
    
    def test_delete_meeting(self):
        """Test deleting the created meeting"""
        try:
            if not self.created_meeting_id:
                self.log_test("Delete Meeting", True, "No meeting to delete")
                return True
            
            response = self.session.delete(f"{BASE_URL}/meetings/{self.created_meeting_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Delete Meeting", True, "Meeting deleted successfully")
                    return True
                else:
                    self.log_test("Delete Meeting", False, "Delete response invalid", data)
                    return False
            else:
                self.log_test("Delete Meeting", False, f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Meeting", False, f"Delete request failed: {str(e)}")
            return False

    # ============ DECISIONS CRUD TESTS ============
    
    def test_get_decisions_initial(self):
        """Test getting decisions list (initial state)"""
        try:
            response = self.session.get(f"{BASE_URL}/decisions")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Decisions (Initial)", True, f"Retrieved decisions list with {len(data)} items")
                    return True
                else:
                    self.log_test("Get Decisions (Initial)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Decisions (Initial)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Decisions (Initial)", False, f"Get decisions failed: {str(e)}")
            return False
    
    def test_create_decision(self):
        """Test creating a new decision"""
        try:
            decision_data = {
                "title": "Site Giriş Kapısı Yenileme",
                "description": "Site ana giriş kapısının yenilenmesine karar verildi",
                "decision_type": "management",
                "decision_date": "2025-01-10",
                "decision_number": "2025/001"
            }
            
            response = self.session.post(
                f"{BASE_URL}/decisions",
                json=decision_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("id"):
                    self.created_decision_id = data["id"]
                    self.log_test("Create Decision", True, f"Decision created successfully with ID: {self.created_decision_id}")
                    return True
                else:
                    self.log_test("Create Decision", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Create Decision", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Create Decision", False, f"Decision creation failed: {str(e)}")
            return False
    
    def test_get_decisions_after_creation(self):
        """Test getting decisions list after creation"""
        try:
            response = self.session.get(f"{BASE_URL}/decisions")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check if our created decision is in the list
                    found_decision = None
                    for decision in data:
                        if decision.get("id") == self.created_decision_id:
                            found_decision = decision
                            break
                    
                    if found_decision:
                        title = found_decision.get("title")
                        decision_number = found_decision.get("decision_number")
                        self.log_test("Get Decisions (After Creation)", True, f"Found created decision: {title} ({decision_number})")
                        return True
                    else:
                        self.log_test("Get Decisions (After Creation)", False, f"Created decision not found in list of {len(data)} items")
                        return False
                else:
                    self.log_test("Get Decisions (After Creation)", False, "Response is not a list", data)
                    return False
            else:
                self.log_test("Get Decisions (After Creation)", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Get Decisions (After Creation)", False, f"Get decisions failed: {str(e)}")
            return False
    
    def test_delete_decision(self):
        """Test deleting the created decision"""
        try:
            if not self.created_decision_id:
                self.log_test("Delete Decision", True, "No decision to delete")
                return True
            
            response = self.session.delete(f"{BASE_URL}/decisions/{self.created_decision_id}")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Delete Decision", True, "Decision deleted successfully")
                    return True
                else:
                    self.log_test("Delete Decision", False, "Delete response invalid", data)
                    return False
            else:
                self.log_test("Delete Decision", False, f"Delete failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Delete Decision", False, f"Delete request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all CRUD API tests"""
        print("🚀 Starting CRUD API Tests for Building Manager Admin Panel")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"👤 Building Admin: {BUILDING_ADMIN_EMAIL}")
        print("=" * 70)
        
        # Test sequence
        tests = [
            # Login
            self.test_building_admin_login,
            
            # Surveys CRUD
            self.test_get_surveys_initial,
            self.test_create_survey,
            self.test_get_surveys_after_creation,
            self.test_delete_survey,
            
            # Votings CRUD
            self.test_get_votings_initial,
            self.test_create_voting,
            self.test_get_votings_after_creation,
            self.test_delete_voting,
            
            # Meetings CRUD
            self.test_get_meetings_initial,
            self.test_create_meeting,
            self.test_get_meetings_after_creation,
            self.test_delete_meeting,
            
            # Decisions CRUD
            self.test_get_decisions_initial,
            self.test_create_decision,
            self.test_get_decisions_after_creation,
            self.test_delete_decision
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
            print("🎉 All tests passed! CRUD APIs are working correctly.")
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
    tester = CRUDAPITester()
    
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