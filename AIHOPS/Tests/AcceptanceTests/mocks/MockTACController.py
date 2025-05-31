"""
Mock implementation of TACController for testing
"""

from Domain.src.Loggs.Response import ResponseSuccessMsg


class MockTACController:
    """Mock Terms and Conditions controller for testing"""

    def __init__(self, socketio=None, folder_name=None):
        self.socketio = socketio
        self.current_version = 1
        self.current_text = "Mock Terms and Conditions - Test Version"
        print("🔧 MockTACController initialized")

    def load(self):
        """Mock load - always succeeds"""
        print(f"🔧 MockTACController: Loaded terms v{self.current_version}")
        return ResponseSuccessMsg("Mock terms loaded successfully")

    def update(self, tac_text):
        """Mock update - always succeeds"""
        self.current_version += 1
        self.current_text = tac_text
        print(f"🔧 MockTACController: Updated to v{self.current_version}")

        # Mock socket emission
        if self.socketio:
            try:
                self.socketio.emit(
                    "terms_updated",
                    {"version": self.current_version, "tac_text": self.current_text},
                )
            except Exception as e:
                print(f"🔧 MockTACController: Could not emit socket event: {e}")

        return ResponseSuccessMsg("Mock terms updated successfully")

    def get_current(self):
        """Return current mock terms"""
        return {"version": self.current_version, "tac_text": self.current_text}
