import os
import subprocess
import sys
from pathlib import Path

def start_test_server():
    """Start the ServiceServer with TEST_MODE enabled"""
    
    # Set environment variable for test mode
    os.environ["TEST_MODE"] = "true"
    
    # Get the path to ServiceServer.py
    current_dir = Path(__file__).parent
    service_server_path = current_dir / "ServiceServer.py"

    # Add the project root to sys.path
    project_root = current_dir.parent
    sys.path.insert(0, str(project_root))
    
    if not service_server_path.exists():
        # Try looking in Service directory
        service_server_path = current_dir / "Service" / "ServiceServer.py"
        
    if not service_server_path.exists():
        print("Error: Could not find ServiceServer.py")
        print("Please run this script from the same directory as ServiceServer.py")
        print("Or from the project root directory")
        return False
    
    print("🧪 Starting server in TEST MODE...")
    print("   MockGmailor will be used for email verification")
    print("   Server will run on http://localhost:5555")
    print("-" * 50)
    
    try:
        import runpy
        runpy.run_path(str(service_server_path), run_name="__main__")
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        return False
    
    return True


if __name__ == "__main__":
    start_test_server()