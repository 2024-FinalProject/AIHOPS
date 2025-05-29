
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

from base_test import BaseTest
import pytest
import time
import logging
import sys
import uuid

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
handler.setFormatter(logging.Formatter('%(asctime)s [%(levelname)s] %(message)s'))

if logger.hasHandlers():
    logger.handlers.clear()

logger.addHandler(handler)

class TestAuthentication(BaseTest):
    TEST_EMAIL = f"test_{uuid.uuid4().hex[:6]}@example.com"
    TEST_PASSWORD = "TestPassword123!"
    TEST_EMAIL_SUCCESS = "testuser_selenium@example.com"

    def go_to_register(self):
        logger.debug("Navigating to register page")
        self.driver.get(self.base_url)
        register_button = self.wait_for_clickable((By.XPATH, "//a[contains(text(), 'Register')]"))
        register_button.click()
        WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Enter email']"))
        )

    def go_to_login(self):
        logger.debug("Navigating to login page")
        self.driver.get(self.base_url)
        login_button = self.wait_for_clickable((By.XPATH, "//a[contains(text(), 'Login')]"))
        login_button.click()
        WebDriverWait(self.driver, 10).until(
            EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Enter email']"))
        )

    def scroll_and_accept_terms(self):
        try:
            tac_modal_content = WebDriverWait(self.driver, 5).until(
                EC.visibility_of_element_located((By.CLASS_NAME, "tac-modal-content"))
            )
            logger.debug("Scrolling Terms & Conditions content")
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

            tac_modal_content.click()
            for _ in range(10):
                tac_modal_content.send_keys(Keys.PAGE_DOWN)
                time.sleep(0.1)

            accept_button = self.wait_for_clickable(
                (By.XPATH, "//button[normalize-space()='I Accept' or contains(text(), 'accept')]")
            )
            accept_button.click()
        except TimeoutException:
            logger.debug("No Terms modal appeared — skipping acceptance.")
        except Exception as e:
            logger.error(f"Unexpected error while handling terms modal: {str(e)}", exc_info=True)

    
    # def test_register_success(self):
    #     logger.debug("Starting registration test")
    #     self.go_to_register()
    #     email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        # email_input.send_keys(self.TEST_EMAIL)
        # password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        # password_input.send_keys(self.TEST_PASSWORD)
        # terms_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Terms and Conditions')]"))
        # terms_button.click()
        # self.scroll_and_accept_terms()
        # submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        # submit_button.click()
        # WebDriverWait(self.driver, 15).until(
        #     EC.text_to_be_present_in_element((By.CLASS_NAME, "register-alert"), "verification email")
        # )

    # def test_register_fail_empty_fields(self):
    #     logger.debug("Starting empty fields test")
    #     self.go_to_register()
    #     submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
    #     submit_button.click()
    #     assert not self.driver.find_elements(By.CLASS_NAME, "register-alert")

    def test_login_success(self):
        logger.debug("Starting login test")
        self.go_to_login()
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys(self.TEST_EMAIL_SUCCESS)
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys(self.TEST_PASSWORD)
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        self.scroll_and_accept_terms()
        logout_button = self.wait_for_element((By.XPATH, "//button[contains(text(), 'Logout')]"))
        assert logout_button.is_displayed()

    # def test_login_fail_invalid_credentials(self):
    #     logger.debug("Starting invalid credentials test")
    #     self.go_to_login()
    #     email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
    #     email_input.send_keys("wronguser@example.com")
    #     password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
    #     password_input.send_keys("WrongPass123!")
    #     submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
    #     submit_button.click()
    #     WebDriverWait(self.driver, 10).until(
    #         EC.visibility_of_element_located((By.CLASS_NAME, "login-alert"))
    #     )

    def test_logout(self):
        logger.debug("Starting logout test")
        self.go_to_login()
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys(self.TEST_EMAIL_SUCCESS)
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys(self.TEST_PASSWORD)
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        self.scroll_and_accept_terms()
        logout_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Logout')]"))
        logout_button.click()
        WebDriverWait(self.driver, 10).until(
            EC.url_contains("localhost:5173")
        )
