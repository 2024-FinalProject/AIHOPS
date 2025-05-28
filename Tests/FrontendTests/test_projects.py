from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from base_test import BaseTest
import pytest
import time

class TestProjects(BaseTest):
    def login(self):
        self.driver.get(f"{self.base_url}/")
        login_link = self.wait_for_clickable((By.LINK_TEXT, "Login"))
        login_link.click()
        time.sleep(1)
        email_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter email']"))
        email_input.send_keys("testuser@example.com")
        password_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter password']"))
        password_input.send_keys("Test123!")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)

    def setup_method(self, method):
        # Ensure driver is initialized and login before each test
        self.login()

    def test_create_project_success(self):
        self.driver.get(f"{self.base_url}/projects/create")
        name_input = self.wait_for_element((By.XPATH, "//input[@placeholder='Enter project name']"))
        name_input.send_keys("Test Project")
        description_input = self.wait_for_element((By.XPATH, "//textarea[@placeholder='Enter project description']"))
        description_input.send_keys("This is a test project description")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        assert "projects" in self.driver.current_url.lower()
        project_list = self.driver.find_elements(By.CLASS_NAME, "project-item")
        assert any("Test Project" in item.text for item in project_list)

    def test_create_project_fail_empty_fields(self):
        self.driver.get(f"{self.base_url}/projects/create")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        error_messages = self.driver.find_elements(By.CLASS_NAME, "error-message")
        assert len(error_messages) > 0

    def test_add_project_factor(self):
        """Test adding a factor to a project"""
        # First create a project
        self.driver.get(f"{self.base_url}/projects/create")
        name_input = self.wait_for_element((By.NAME, "projectName"))
        name_input.send_keys("Factor Test Project")
        description_input = self.driver.find_element(By.NAME, "description")
        description_input.send_keys("Project for testing factors")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        
        # Navigate to project factors page
        project_link = self.wait_for_element((By.XPATH, "//a[contains(text(), 'Factor Test Project')]"))
        project_link.click()
        
        # Add new factor
        add_factor_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Add Factor')]"))
        add_factor_button.click()
        
        # Fill factor details
        factor_name = self.wait_for_element((By.NAME, "factorName"))
        factor_name.send_keys("Test Factor")
        
        factor_desc = self.driver.find_element(By.NAME, "factorDescription")
        factor_desc.send_keys("This is a test factor")
        
        # Submit factor
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        
        # Verify factor was added
        time.sleep(2)
        factor_list = self.driver.find_elements(By.CLASS_NAME, "factor-item")
        assert any("Test Factor" in item.text for item in factor_list)
    
    def test_add_project_member(self):
        """Test adding a member to a project"""
        # First create a project
        self.driver.get(f"{self.base_url}/projects/create")
        name_input = self.wait_for_element((By.NAME, "projectName"))
        name_input.send_keys("Member Test Project")
        description_input = self.driver.find_element(By.NAME, "description")
        description_input.send_keys("Project for testing members")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        
        # Navigate to project members page
        project_link = self.wait_for_element((By.XPATH, "//a[contains(text(), 'Member Test Project')]"))
        project_link.click()
        
        # Add new member
        add_member_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Add Member')]"))
        add_member_button.click()
        
        # Fill member details
        member_username = self.wait_for_element((By.NAME, "username"))
        member_username.send_keys("newmember")
        
        # Submit member
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        
        # Verify member was added
        time.sleep(2)
        member_list = self.driver.find_elements(By.CLASS_NAME, "member-item")
        assert any("newmember" in item.text.lower() for item in member_list)
    
    def test_publish_project(self):
        """Test publishing a project"""
        # First create a project
        self.driver.get(f"{self.base_url}/projects/create")
        name_input = self.wait_for_element((By.NAME, "projectName"))
        name_input.send_keys("Publish Test Project")
        description_input = self.driver.find_element(By.NAME, "description")
        description_input.send_keys("Project for testing publish")
        submit_button = self.wait_for_clickable((By.XPATH, "//button[@type='submit']"))
        submit_button.click()
        time.sleep(2)
        
        # Navigate to project page
        project_link = self.wait_for_element((By.XPATH, "//a[contains(text(), 'Publish Test Project')]"))
        project_link.click()
        
        # Click publish button
        publish_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Publish')]"))
        publish_button.click()
        
        # Confirm publish
        confirm_button = self.wait_for_clickable((By.XPATH, "//button[contains(text(), 'Confirm')]"))
        confirm_button.click()
        
        # Verify project was published
        time.sleep(2)
        status_element = self.wait_for_element((By.CLASS_NAME, "project-status"))
        assert "published" in status_element.text.lower() 