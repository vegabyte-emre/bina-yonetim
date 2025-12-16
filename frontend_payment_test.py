#!/usr/bin/env python3
"""
Frontend E2E Test for Building Manager Payment Flow
Tests the payment page functionality at port 3001
"""

import time
import sys
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class BuildingManagerPaymentTest:
    def __init__(self):
        self.driver = None
        self.base_url = "http://localhost:3001"
        self.test_results = []
        
    def setup_driver(self):
        """Setup Chrome driver with headless options"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(10)
            return True
        except Exception as e:
            print(f"❌ Failed to setup Chrome driver: {e}")
            return False
    
    def log_test(self, test_name, success, message):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
    
    def test_login(self):
        """Test login to Building Manager panel"""
        try:
            self.driver.get(f"{self.base_url}/login")
            
            # Wait for login form
            email_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.NAME, "email"))
            )
            password_input = self.driver.find_element(By.NAME, "password")
            login_button = self.driver.find_element(By.TYPE, "submit")
            
            # Fill in credentials
            email_input.send_keys("ahmet@mavirezidans.com")
            password_input.send_keys("admin123")
            
            # Click login
            login_button.click()
            
            # Wait for redirect to dashboard
            WebDriverWait(self.driver, 10).until(
                EC.url_contains("/dashboard")
            )
            
            self.log_test("Building Manager Login", True, "Successfully logged in")
            return True
            
        except TimeoutException:
            self.log_test("Building Manager Login", False, "Login timeout - page did not load or redirect")
            return False
        except Exception as e:
            self.log_test("Building Manager Login", False, f"Login failed: {str(e)}")
            return False
    
    def test_navigate_to_payments(self):
        """Test navigation to Payments page"""
        try:
            # Look for payments link in sidebar
            payments_link = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'Ödemeler') or contains(@href, 'payments')]"))
            )
            
            payments_link.click()
            
            # Wait for payments page to load
            WebDriverWait(self.driver, 10).until(
                EC.url_contains("payments")
            )
            
            self.log_test("Navigate to Payments", True, "Successfully navigated to payments page")
            return True
            
        except TimeoutException:
            self.log_test("Navigate to Payments", False, "Could not find or click payments link")
            return False
        except Exception as e:
            self.log_test("Navigate to Payments", False, f"Navigation failed: {str(e)}")
            return False
    
    def test_payments_page_content(self):
        """Test that payments page loads with expected content"""
        try:
            # Check for summary cards
            summary_cards = self.driver.find_elements(By.CLASS_NAME, "card")
            if len(summary_cards) == 0:
                summary_cards = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'bg-white') or contains(@class, 'shadow')]")
            
            # Check for payment schedule table
            payment_table = None
            try:
                payment_table = self.driver.find_element(By.TAG_NAME, "table")
            except:
                payment_table = self.driver.find_element(By.XPATH, "//div[contains(@class, 'table') or contains(text(), 'Aralık') or contains(text(), 'Ocak')]")
            
            # Check for Turkish Lira amounts (₺ symbol)
            page_text = self.driver.page_source
            has_turkish_lira = "₺" in page_text or "TL" in page_text
            
            # Check for Turkish month names
            turkish_months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
                            "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
            has_turkish_months = any(month in page_text for month in turkish_months)
            
            message = f"Found {len(summary_cards)} summary cards"
            if payment_table:
                message += ", payment table"
            if has_turkish_lira:
                message += ", Turkish Lira amounts"
            if has_turkish_months:
                message += ", Turkish months"
            
            success = len(summary_cards) > 0 and payment_table is not None
            self.log_test("Payments Page Content", success, message)
            return success
            
        except Exception as e:
            self.log_test("Payments Page Content", False, f"Content check failed: {str(e)}")
            return False
    
    def test_payment_dialog(self):
        """Test clicking pay button and payment dialog"""
        try:
            # Look for pay button (Öde)
            pay_buttons = self.driver.find_elements(By.XPATH, "//button[contains(text(), 'Öde') or contains(text(), 'Pay')]")
            
            if not pay_buttons:
                self.log_test("Payment Dialog", False, "No pay buttons found")
                return False
            
            # Click the first pay button
            pay_buttons[0].click()
            
            # Wait for dialog to appear
            time.sleep(2)
            
            # Check for dialog elements
            dialog_elements = self.driver.find_elements(By.XPATH, "//div[contains(@class, 'modal') or contains(@class, 'dialog')]")
            
            # Check for card input fields
            card_inputs = self.driver.find_elements(By.XPATH, "//input[@placeholder*='kart' or @placeholder*='card' or @type='text']")
            
            # Check for test card info display
            page_text = self.driver.page_source
            has_test_card_info = "4355" in page_text or "test" in page_text.lower()
            
            message = f"Found {len(dialog_elements)} dialog elements, {len(card_inputs)} card inputs"
            if has_test_card_info:
                message += ", test card info displayed"
            
            success = len(dialog_elements) > 0 or len(card_inputs) > 0
            self.log_test("Payment Dialog", success, message)
            return success
            
        except Exception as e:
            self.log_test("Payment Dialog", False, f"Dialog test failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all frontend tests"""
        print("🚀 Starting Building Manager Payment Frontend Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 70)
        
        if not self.setup_driver():
            return False
        
        try:
            tests = [
                self.test_login,
                self.test_navigate_to_payments,
                self.test_payments_page_content,
                self.test_payment_dialog
            ]
            
            passed = 0
            total = len(tests)
            
            for test in tests:
                if test():
                    passed += 1
                print()
            
            print("=" * 70)
            print(f"📊 Frontend Test Results: {passed}/{total} tests passed")
            
            return passed == total
            
        finally:
            if self.driver:
                self.driver.quit()
    
    def print_summary(self):
        """Print detailed test summary"""
        print("\n" + "=" * 60)
        print("📋 FRONTEND TEST SUMMARY")
        print("=" * 60)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            print(f"   Message: {result['message']}")
            print()

def main():
    """Main test execution"""
    tester = BuildingManagerPaymentTest()
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()