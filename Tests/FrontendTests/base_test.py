from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import pytest
import time
import os
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class BaseTest:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup method to initialize the WebDriver"""
        # Setup Chrome options
        chrome_options = Options()
        chrome_options.add_argument("--start-maximized")
        # chrome_options.add_argument("--headless")  # Uncomment to run tests in headless mode
        
        try:
            # Use manually downloaded ChromeDriver
            driver_path = "C:\\WebDriver\\bin\\chromedriver.exe"
            logger.debug(f"ChromeDriver path: {driver_path}")
            service = Service(executable_path=driver_path)
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            logger.debug("ChromeDriver initialized successfully")
            
            # Base URL for the application
            self.base_url = "http://localhost:5173"  # Updated frontend URL
            
            self.wait = WebDriverWait(self.driver, 10)
            
            yield
            
        except Exception as e:
            logger.error(f"Error initializing ChromeDriver: {str(e)}")
            raise
        finally:
            if hasattr(self, 'driver'):
                self.driver.quit()
    
    def wait_for_element(self, locator, timeout=10):
        """Wait for an element to be present and visible"""
        return WebDriverWait(self.driver, timeout).until(
            EC.presence_of_element_located(locator)
        )
    
    def wait_for_clickable(self, locator, timeout=10):
        """Wait for an element to be clickable"""
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable(locator)
        )
    
    def take_screenshot(self, name):
        """Take a screenshot and save it with the given name"""
        timestamp = time.strftime("%Y%m%d-%H%M%S")
        screenshot_dir = "screenshots"
        if not os.path.exists(screenshot_dir):
            os.makedirs(screenshot_dir)
        self.driver.save_screenshot(f"{screenshot_dir}/{name}_{timestamp}.png")

    def teardown_method(self):
        """Teardown method to quit the WebDriver"""
        if hasattr(self, 'driver'):
            self.driver.quit() 