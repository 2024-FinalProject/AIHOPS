from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from base_test import BaseTest
import pytest
import time
import imaplib
import email
import re
import base64
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class TestAuthentication(BaseTest):
    # Encrypted credentials
    TEST_EMAIL = "testsemailaihops@gmail.com"

    _ENCRYPTED_PASSWORD = "QGlob3BTMTIh"
    
    @property
    def test_password(self):
        return base64.b64decode(self._ENCRYPTED_PASSWORD).decode('utf-8')

    def go_to_register(self):
        logger.debug("Navigating to register page")
        self.driver.get(self.base_url)
        time.sleep(2)  # Wait for the page to load
        logger.debug("Looking for register button")
        register_button = self.wait_for_clickable((By.XPATH, "//a[contains(text(), 'Register')]"))
        logger.debug("Clicking register button")
        register_button.click()
        time.sleep(2)  # Wait for register page to load

    def go_to_login(self):
        logger.debug("Navigating to login page")
        self.driver.get(self.base_url)
        time.sleep(2)  # Wait for the page to load
        logger.debug("Looking for login button")
        login_button = self.wait_for_clickable((By.XPATH, "//a[contains(text(), 'Login')]"))
        logger.debug("Clicking login button")
        login_button.click()
        time.sleep(2)  # Wait for login page to load

    def verify_email(self, email_address, email_password):
        logger.debug("Starting email verification process")
        # Open a new tab for email verification
        self.driver.execute_script("window.open('');")
        self.driver.switch_to.window(self.driver.window_handles[1])
        
        # Go to Gmail
        logger.debug("Navigating to Gmail")
        self.driver.get("https://gmail.com")
        time.sleep(2)
        
        # Login to Gmail
        logger.debug("Logging into Gmail")
        email_input = self.wait_for_element((By.NAME, "identifier"))
        email_input.send_keys(email_address)
        email_input.send_keys(Keys.RETURN)
        time.sleep(2)
        
        password_input = self.wait_for_element((By.NAME, "password"))
        password_input.send_keys(email_password)
        password_input.send_keys(Keys.RETURN)
        time.sleep(5)
        
        # First check inbox for verification email
        logger.debug("Looking for verification email")
        try:
            verification_email = self.wait_for_element((By.XPATH, "//span[contains(text(), 'AIHOPS verification email')]"), timeout=10)
        except:
            logger.debug("Email not found in inbox, checking spam folder")
            # If not found in inbox, check spam folder
            spam_button = self.wait_for_clickable((By.XPATH, "//a[contains(text(), 'Spam')]"))
            spam_button.click()
            time.sleep(2)
            verification_email = self.wait_for_element((By.XPATH, "//span[contains(text(), 'AIHOPS verification email')]"))
        
        logger.debug("Clicking verification email")
        verification_email.click()
        time.sleep(2)
        
        # Find and click the verification link
        logger.debug("Looking for verification link")
        verification_link = self.wait_for_element((By.XPATH, "//a[contains(@href, '/verifyautomatic?token=')]"))
        logger.debug("Clicking verification link")
        verification_link.click()
        time.sleep(2)
        
        # Switch back to the main window
        logger.debug("Switching back to main window")
        self.driver.switch_to.window(self.driver.window_handles[0])

    def test_register_success(self):
        logger.debug("Starting registration test")
        self.go_to_register()
        logger.debug("Filling registration form")
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys(self.TEST_EMAIL)
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys(self.test_password)
        
        # Open terms and conditions
        logger.debug("Opening terms and conditions")
        terms_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Terms and Conditions')]"))
        terms_button.click()
        time.sleep(1)
        
        # Scroll down in the terms modal
        logger.debug("Scrolling terms modal")
        tac_modal_content = self.wait_for_element((By.CLASS_NAME, "tac-modal-content"))

        # Scroll in small increments to simulate user scroll
        self.driver.execute_script("""
            var element = arguments[0];
            var step = 50;
            function scrollStep() {
                if (element.scrollTop + element.clientHeight < element.scrollHeight) {
                    element.scrollTop += step;
                    setTimeout(scrollStep, 50);
                }
            }
            scrollStep();
        """, tac_modal_content)
        time.sleep(2)  # Wait for the scroll to finish

        # As a fallback, try sending PAGE_DOWN keys
        try:
            tac_modal_content.click()
            for _ in range(10):
                tac_modal_content.send_keys(Keys.PAGE_DOWN)
                time.sleep(0.1)
        except Exception as e:
            logger.debug(f"Could not send PAGE_DOWN to tac_modal_content: {e}")
        
        # Click 'I accept'
        logger.debug("Accepting terms")
        accept_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'I accept')]"))
        accept_button.click()
        time.sleep(1)
        
        # Submit the form
        logger.debug("Submitting registration form")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        
        # Check for success message
        logger.debug("Checking for success message")
        assert any("verification email" in el.text.lower() for el in self.driver.find_elements(By.CLASS_NAME, "register-alert"))
        
        # Verify email
        logger.debug("Starting email verification")
        self.verify_email(self.TEST_EMAIL, self.test_password)
        time.sleep(2)

    def test_register_fail_empty_fields(self):
        logger.debug("Starting empty fields test")
        self.go_to_register()
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(1)
        # Check for error message
        assert any(el.is_displayed() for el in self.driver.find_elements(By.CLASS_NAME, "register-alert"))

    def test_login_success(self):
        logger.debug("Starting login test")
        self.go_to_login()
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys(self.TEST_EMAIL)
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys(self.test_password)
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        # Check for redirect or success (e.g., home page or dashboard)
        assert self.base_url in self.driver.current_url

    def test_login_fail_invalid_credentials(self):
        logger.debug("Starting invalid credentials test")
        self.go_to_login()
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys("wronguser@example.com")
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys("WrongPass123!")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        # Check for error message
        assert any(el.is_displayed() for el in self.driver.find_elements(By.CLASS_NAME, "login-alert"))

    def test_logout(self):
        logger.debug("Starting logout test")
        self.go_to_login()
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys(self.TEST_EMAIL)
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys(self.test_password)
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        # Click logout button
        logout_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Logout')]"))
        logout_button.click()
        time.sleep(1)
        assert self.base_url in self.driver.current_url 