# Frontend Tests

This directory contains Selenium-based end-to-end tests for the AIHOPS frontend.

## Prerequisites

1. Python 3.8 or higher
2. Chrome browser installed
3. Frontend application running (default: http://localhost:3000)

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Make sure your frontend application is running

3. Update the `base_url` in `base_test.py` if your frontend is running on a different URL

## Running Tests

To run all tests:
```bash
pytest
```

To run specific test files:
```bash
pytest test_auth.py
pytest test_projects.py
```

To run tests with HTML report:
```bash
pytest --html=report.html
```

## Test Structure

- `base_test.py`: Contains the base test class with common setup and utility methods
- `test_auth.py`: Tests for authentication (register, login, logout)
- `test_projects.py`: Tests for project-related functionality

## Adding New Tests

1. Create a new test file or add to existing ones
2. Inherit from `BaseTest` class
3. Use the provided utility methods from `BaseTest`:
   - `wait_for_element`: Wait for an element to be present
   - `wait_for_clickable`: Wait for an element to be clickable
   - `take_screenshot`: Take a screenshot for debugging

## Notes

- Tests use Chrome WebDriver by default
- Screenshots are saved in the `screenshots` directory when tests fail
- Some tests include small delays (time.sleep) to handle asynchronous operations
- Make sure to update selectors (XPath, class names, etc.) if the frontend structure changes 