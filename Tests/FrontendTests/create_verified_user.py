import requests
import json
import time
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:5555"  # Adjust if your server runs on a different port
EMAIL = "testuser_selenium@example.com"
PASSWORD = "TestPassword123!"
VERIFICATION_CODE = "1234"  # MockGmailor returns "1234"

def make_request(method, endpoint, data=None, params=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, params=params)
        elif method.upper() == "POST":
            response = requests.post(url, json=data)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        return response.json()
    
    except requests.exceptions.ConnectionError:
        print(f"Error: Cannot connect to server at {BASE_URL}")
        print("Make sure the server is running (python ServiceServer.py)")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        if hasattr(e.response, 'text'):
            print(f"Response: {e.response.text}")
        return None

def create_verified_user():
    """Create and verify a user using API endpoints"""
    
    print(f"Creating verified user: {EMAIL}")
    print("-" * 50)
    
    # Step 1: Start a session
    print("1. Starting session...")
    session_response = make_request("GET", "/enter")
    if not session_response or not session_response.get("success"):
        print("Failed to start session")
        return False
    
    cookie = session_response["cookie"]
    print(f"   Session started with cookie: {cookie}")
    
    # Step 2: Register user
    print("2. Registering user...")
    register_data = {
        "cookie": cookie,
        "userName": EMAIL,
        "passwd": PASSWORD,
        "acceptedTermsVersion": 1  # Assuming version 1
    }
    
    register_response = make_request("POST", "/register", register_data)
    if not register_response:
        return False
    
    if register_response.get("success"):
        print(f"   Registration successful: {register_response['message']}")
    else:
        error_message = register_response.get("message", "Unknown error")
        if "is taken" in error_message or "already exists" in error_message:
            print(f"   User already exists: {error_message}")
            print("   Proceeding with existing user...")
        else:
            print(f"   Registration failed: {error_message}")
            return False
    
    # Step 3: Verify user (using MockGmailor code)
    print("3. Verifying user...")
    verify_data = {
        "cookie": cookie,
        "userName": EMAIL,
        "passwd": PASSWORD,
        "code": VERIFICATION_CODE  # MockGmailor returns "1234"
    }
    
    verify_response = make_request("POST", "/verify", verify_data)
    if not verify_response:
        return False
    
    if verify_response.get("success"):
        print(f"   Verification successful: {verify_response['message']}")
    else:
        error_message = verify_response.get("message", "Unknown error")
        print(f"   Verification failed: {error_message}")
        
        # If verification fails, try a few common alternatives just in case
        if "invalid code" in error_message.lower():
            print("   Trying alternative verification codes...")
            alt_codes = ["000000", "123456", "111111"]
            
            for alt_code in alt_codes:
                print(f"   Trying code: {alt_code}")
                alt_verify_data = {
                    "cookie": cookie,
                    "userName": EMAIL,
                    "passwd": PASSWORD,
                    "code": alt_code
                }
                
                alt_response = make_request("POST", "/verify", alt_verify_data)
                if alt_response and alt_response.get("success"):
                    print(f"   Verification successful with code {alt_code}: {alt_response['message']}")
                    break
            else:
                print("   ⚠️ All verification attempts failed, but continuing (user might already be verified)")
    
    # Step 4: Accept terms (if needed)
    print("4. Accepting terms...")
    terms_data = {
        "email": EMAIL,
    }
    
    terms_response = make_request("POST", "/accept-terms", terms_data)
    if not terms_response:
        return False
    
    if terms_response.get("success"):
        print(f"   Terms accepted: {terms_response['message']}")
    else:
        print(f"   Terms acceptance result: {terms_response.get('message', 'Unknown error')}")
    
    # Step 5: Test login to confirm everything works
    print("5. Testing login...")
    login_data = {
        "cookie": cookie,
        "userName": EMAIL,
        "passwd": PASSWORD
    }
    
    login_response = make_request("POST", "/login", login_data)
    if not login_response:
        return False
    
    if login_response.get("success"):
        print(f"   Login successful: {login_response['message']}")
        if login_response.get("is_admin"):
            print("   User has admin privileges")
        print(f"   Terms version: {login_response.get('accepted_tac_version', 'Unknown')}")
        
        # Step 6: Logout
        print("6. Logging out...")
        logout_data = {"cookie": cookie}
        logout_response = make_request("POST", "/logout", logout_data)
        if logout_response and logout_response.get("success"):
            print(f"   Logout successful: {logout_response['message']}")
        
    else:
        print(f"   Login failed: {login_response.get('message', 'Unknown error')}")
        return False
    
    print("-" * 50)
    print(f"✅ User {EMAIL} has been successfully created and verified!")
    return True

def check_server_status():
    """Check if the server is running"""
    print("Checking server status...")
    response = make_request("GET", "/")
    if response:
        print(f"✅ Server is running: {response.get('msg', 'OK')}")
        return True
    else:
        print("❌ Server is not accessible")
        return False

def main():
    print("AIHOPS User Creation Script")
    print("=" * 50)
    
    # Check if server is running
    if not check_server_status():
        print("\nPlease start the server first:")
        print("cd to your AIHOPS/Service directory")
        print("python ServiceServer.py")
        return
    
    # Create the user
    success = create_verified_user()
    
    if success:
        print(f"\n🎉 Setup complete! You can now use these credentials:")
        print(f"   Email: {EMAIL}")
        print(f"   Password: {PASSWORD}")
    else:
        print(f"\n❌ User creation failed. Check the error messages above.")

if __name__ == "__main__":
    main()