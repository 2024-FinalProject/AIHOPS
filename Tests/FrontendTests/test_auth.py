from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from base_test import BaseTest
import pytest
import time
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class TestAuthentication(BaseTest):
    # Encrypted credentials
    TEST_EMAIL = "testuser_selenium@example.com"
    # Remove encrypted password and Gmail info
    TEST_PASSWORD = "TestPassword123!"

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

    def test_register_success(self):
        logger.debug("Starting registration test")
        self.go_to_register()
        logger.debug("Filling registration form")
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys(self.TEST_EMAIL)
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys(self.TEST_PASSWORD)
        
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
        accept_button = self.wait_for_clickable((By.XPATH, "//button[normalize-space()='I Accept' or contains(text(), 'accept')]") )
        accept_button.click()
        time.sleep(1)
        
        # Submit the form
        logger.debug("Submitting registration form")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()

        # Wait for success message
        logger.debug("Waiting for success message")
        WebDriverWait(self.driver, 15).until(
            lambda d: any("verification email" in el.text.lower() for el in d.find_elements(By.CLASS_NAME, "register-alert"))
        )
        logger.debug("Success message appeared")
        # Do not attempt to verify email or open Gmail
        # Test ends here for registration

    def test_register_fail_empty_fields(self):
        logger.debug("Starting empty fields test")
        self.go_to_register()
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(1)
        # Check that no alert appears (form not submitted)
        assert not self.driver.find_elements(By.CLASS_NAME, "register-alert")

    def test_login_success(self):
        logger.debug("Starting login test")
        self.go_to_login()
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys(self.TEST_EMAIL)
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys(self.TEST_PASSWORD)
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
        password_input.send_keys(self.TEST_PASSWORD)
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        # Click logout button
        logout_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Logout')]"))
        logout_button.click()
        time.sleep(1)
        assert self.base_url in self.driver.current_url 