from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from base_test import BaseTest
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

import pytest
import time

import logging
import uuid
import sys

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

if logger.hasHandlers():
    logger.handlers.clear()

console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s [%(levelname)s] %(message)s')
console_handler.setFormatter(formatter)

logger.addHandler(console_handler)

TEST_PASSWORD = "TestPassword123!"
TEST_EMAIL_SUCCESS = "testuser_selenium@example.com"

class TestProjects(BaseTest):
    
    def login(self):
        logger.debug("Logging in with test user credentials")
        self.driver.get(self.base_url)
        login_link = self.wait_for_clickable((By.LINK_TEXT, "Login"))
        login_link.click()
        time.sleep(1)
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys(TEST_EMAIL_SUCCESS)
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys(TEST_PASSWORD)
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)

    # # def setup(self, method):
    # #     super().setup(method)

    # #     # Ensure driver is initialized and login before each test
    # #     self.login()

    # def test_create_project_success(self):
    #     self.login()
    #     logger.debug("Testing project creation with valid data")
    #     self.driver.get(f"{self.base_url}/projectsmanagement")
    #     create_porject_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Create New Project')]"))
    #     create_porject_button.click()
    #     name_input = self.wait_for_element((By.XPATH, "//input[@class='create-project-name-input']"))
    #     name_input.send_keys("Test Project")
    #     description_input = self.wait_for_element((By.XPATH, "//textarea[@class='create-project-description-input']"))
    #     description_input.send_keys("This is a test project description")
    #     checkbox_default_factors = self.wait_for_clickable((By.XPATH, "//input[@type='checkbox' and @id='useDefaultFactors']"))
    #     checkbox_default_factors.click()
    #     time.sleep(1)  # Wait for checkbox to be clickable
    #     submit_button = self.wait_for_clickable((By.XPATH, "//button[@class='action-btn create-btn']"))
    #     submit_button.click()
    #     time.sleep(2)
    #     assert "projects" in self.driver.current_url.lower()
    #     page_text = self.driver.find_element(By.TAG_NAME, "body").text
    #     assert "Test Project" in page_text


    # def test_create_project_fail_empty_fields(self):
    #     logger.debug("Testing project creation with empty fields")
    #     self.login()
    #     self.driver.get(f"{self.base_url}/projectsmanagement")
    #     create_porject_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Create New Project')]"))
    #     create_porject_button.click()
    #     submit_button = self.wait_for_clickable((By.XPATH, "//button[@class='action-btn create-btn']"))
    #     submit_button.click()
    #     page_text = self.driver.find_element(By.TAG_NAME, "body").text
    #     assert "Error" in page_text


    # def test_confirm_factors_project(self):
    #     logger.debug("Testing project confirm factors")
    #     self.login()
    #     self.driver.get(f"{self.base_url}/projectsmanagement")
    #     view_edit_project = self.wait_for_clickable((By.XPATH, "//button[@class='action-btn view-edit-btn']"))
    #     view_edit_project.click()  
    #     edit_factors_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Assessment')]]")))
    #     edit_factors_button.click()
    #     time.sleep(2)
    #     confirm_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='action-btn confirm-btn']")))
    #     confirm_button.click()
    #     time.sleep(2)
    #     confirm_button_in_popup = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Confirm']")))
    #     confirm_button_in_popup.click()
    #     time.sleep(2)
    #     # Verify that the factors were confirmed
    #     edit_factors_button_locator = (By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Assessment')]]")
    #     edit_factors_button = self.wait_for_element(edit_factors_button_locator) # Using your wait_for_element
    #     badge_locator = (By.XPATH, f"{edit_factors_button_locator[1]}//*[contains(@class, 'badge')]")
    #     badge_elements = self.driver.find_elements(By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Assessment')]]//*[contains(@class, 'badge')]")
    #     badge_elements_for_assert = self.driver.find_elements(By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Assessment')]]//*[contains(@class, 'badge')]")
    #     assert len(badge_elements_for_assert) == 0, "Reminder badge is unexpectedly present for 'Edit & Confirm Assessment Dimensions' button"



    # def test_confirm_severites_project(self):
    #     logger.debug("Testing project confirm severities")
    #     self.login()
    #     self.driver.get(f"{self.base_url}/projectsmanagement")
    #     view_edit_project = self.wait_for_clickable((By.XPATH, "//button[@class='action-btn view-edit-btn']"))
    #     view_edit_project.click()  
    #     edit_severity_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Severity')]]")))
    #     edit_severity_button.click()
    #     time.sleep(2)
    #     confirm_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='action-btn confirm-btn']")))
    #     confirm_button.click()
    #     time.sleep(2)
    #     got_it_button_in_popup = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='confirmation-button']")))
    #     got_it_button_in_popup.click()
    #     time.sleep(2)
    #     # Verify that the factors were confirmed
    #     edit_serverities_button_locator = (By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Severity')]]")
    #     edit_serverities_button = self.wait_for_element(edit_serverities_button_locator) # Using your wait_for_element
    #     badge_locator = (By.XPATH, f"{edit_serverities_button_locator[1]}//*[contains(@class, 'badge')]")
    #     badge_elements = self.driver.find_elements(By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Severity')]]//*[contains(@class, 'badge')]")
    #     badge_elements_for_assert = self.driver.find_elements(By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Severity')]]//*[contains(@class, 'badge')]")
    #     assert len(badge_elements_for_assert) == 0, "Reminder badge is unexpectedly present for 'Edit & Confirm Severity Factors' button"

    # def test_add_assessors_project(self):
    #     logger.debug("Testing project confirm severities")
    #     self.login()
    #     self.driver.get(f"{self.base_url}/projectsmanagement")
    #     view_edit_project = self.wait_for_clickable((By.XPATH, "//button[@class='action-btn view-edit-btn']"))
    #     view_edit_project.click()  
    #     edit_severity_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Assessors')]]")))
    #     edit_severity_button.click()
    #     time.sleep(2)
    #     add_assessor_input = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@class='add-member-input']")))
    #     add_assessor_input.send_keys("test@bgu.ac.il")
    #     add_assessor_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='action-btn add-member-btn']")))
    #     add_assessor_button.click()
    #     time.sleep(2)

    #     page_text = self.driver.find_element(By.TAG_NAME, "body").text
    #     assert "test@bgu.ac.il" in page_text
 
    
    # def test_publish_project(self):
    #     logger.debug("Test publishing a project")
    #     self.login()
    #     self.driver.get(f"{self.base_url}/projectsmanagement")
    #     view_edit_project = self.wait_for_clickable((By.XPATH, "//button[@class='action-btn view-edit-btn']"))
    #     view_edit_project.click() 
    #     publish_button = self.wait_for_clickable((By.XPATH, "//button[@class='publish-btn']"))
    #     publish_button.click()
    #     time.sleep(2)
    #     confirm_button_in_popup = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='OK']")))
    #     confirm_button_in_popup.click()
    #     time.sleep(5)
    #     page_text = self.driver.find_element(By.TAG_NAME, "body").text
    #     assert "Published Successfully!" in page_text

   
    def test_full_project_flow(self):
        logger.debug("Starting full end-to-end project flow test")
        self.login()

        # Step 1: Create new project with unique name
        unique_project_name = "FullFlowProject"
        self.driver.get(f"{self.base_url}/projectsmanagement")
        create_project_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Create New Project')]"))
        create_project_button.click()
        name_input = self.wait_for_element((By.XPATH, "//input[@class='create-project-name-input']"))
        name_input.send_keys(unique_project_name)
        description_input = self.wait_for_element((By.XPATH, "//textarea[@class='create-project-description-input']"))
        description_input.send_keys("This is an end-to-end test project")
        checkbox_default_factors = self.wait_for_clickable((By.XPATH, "//input[@type='checkbox' and @id='useDefaultFactors']"))
        checkbox_default_factors.click()
        time.sleep(1)
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@class='action-btn create-btn']"))
        submit_button.click()
        got_it_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='confirmation-button']")))
        got_it_button.click()
        time.sleep(4)

        # Step 2: View/Edit project
        view_edit_project = self.wait_for_clickable((By.XPATH, "//button[@class='action-btn view-edit-btn']"))
        view_edit_project.click()

        # Step 3: Confirm Factors
        edit_factors_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Assessment')]]")))
        edit_factors_button.click()
        time.sleep(2)
        confirm_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='action-btn confirm-btn']")))
        confirm_button.click()
        confirm_button_in_popup = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Confirm']")))
        confirm_button_in_popup.click()
        time.sleep(2)

        # Step 4: Confirm Severities
        edit_severity_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Severity')]]")))
        edit_severity_button.click()
        time.sleep(2)
        confirm_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='action-btn confirm-btn']")))
        confirm_button.click()
        got_it_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='confirmation-button']")))
        got_it_button.click()
        time.sleep(2)

        # # Step 5: Add Assessor
        # edit_assessors_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[./span[@class='btn-text' and contains(., 'Assessors')]]")))
        # edit_assessors_button.click()
        # time.sleep(2)
        # add_assessor_input = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//input[@class='add-member-input']")))
        # add_assessor_input.send_keys("test@bgu.ac.il")
        # add_assessor_button = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@class='action-btn add-member-btn']")))
        # add_assessor_button.click()
        # time.sleep(2)

        # Step 6: Publish Project
        publish_button = self.wait_for_clickable((By.XPATH, "//button[@class='publish-btn']"))
        publish_button.click()
        confirm_button_in_popup_no_assesors = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='OK']")))
        confirm_button_in_popup_no_assesors.click()
        time.sleep(5)

    


        continue_button = WebDriverWait(self.driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(@class, 'success-btn') and text()='Continue']")))
        continue_button.click()


        # refresh the page
        self.driver.refresh()
        time.sleep(2)

        page_text = self.driver.find_element(By.TAG_NAME, "body").text
        assert "Published" in page_text, "Project was not published successfully"





