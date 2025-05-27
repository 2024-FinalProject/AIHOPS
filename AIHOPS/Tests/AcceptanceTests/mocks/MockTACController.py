from Domain.src.Users.TACController import TACController
import os
import re

class MockTACController(TACController):
    def __init__(self, socketio=None, folder_name="Domain/src/Users/terms_and_conditions"):
        super().__init__(socketio, folder_name)
        self.socketio = self  # Replace socketio with self to handle emit calls
        
    def emit(self, event, data):
        # Mock implementation of emit that does nothing
        pass
        
    def load(self):
        print("Looking for T&C files in:", self.folder)
        files = [f for f in os.listdir(self.folder) if f.startswith("terms_and_conditions_v")]
        if not files:
            raise FileNotFoundError("No terms and conditions file found.")

        versioned_files = []
        for f in files:
            match = re.search(r'_v(\d+)$', f)  # stricter: ends with _v{n}
            if match:
                versioned_files.append((f, int(match.group(1))))
            else:
                print(f"Skipping invalid filename: {f}")

        if not versioned_files:
            raise ValueError("No valid terms file with version suffix found.")

        latest_file, self.current_version = max(versioned_files, key=lambda x: x[1])
        path = os.path.join(self.folder, latest_file)

        with open(path, 'r', encoding='utf-8') as f:
            self.current_text = f.read()

        # Call emit on self instead of socketio
        self.emit("get_terms", {
            "version": self.current_version,
            "tac_text": self.current_text
        })

        print(f"Loaded terms v{self.current_version}: {latest_file}") 