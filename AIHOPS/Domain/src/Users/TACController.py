import os
import re

from Domain.src.Loggs.Response import ResponseSuccessMsg


class TACController:
    def __init__(self, socketio=None, folder_name="Domain/src/Users/terms_and_conditions"):
        self.socketio = socketio
        self.folder = os.path.join(os.getcwd(), folder_name)
        self.current_version = -1
        self.current_text = ""
        os.makedirs(self.folder, exist_ok=True)

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

        # self.socketio.emit("get_terms", {
        #     "version": self.current_version,
        #     "tac_text": self.current_text
        # })

        print(f"Loaded terms v{self.current_version}: {latest_file}")

    def update(self, tac_text):
        """Saves a new version of the terms and conditions and notifies clients"""
        print(f"trying to update tac Controller")
        if self.current_version == -1:
            try:
                self.load()
            except FileNotFoundError:
                self.current_version = -1

        new_version = self.current_version + 1
        filename = f"terms_and_conditions_v{new_version}"
        path = os.path.join(self.folder, filename)

        with open(path, 'w', encoding='utf-8') as f:
            f.write(tac_text)
        print ("written to file")

        self.current_version = new_version
        self.current_text = tac_text

        # Notify clients of the update
        self.socketio.emit("terms_updated", {
            "version": self.current_version,
            "tac_text": self.current_text
        })
        return ResponseSuccessMsg("admin updated terms and conditions")

    def get_current(self):
        """Returns current version and text"""
        return {
            "version": self.current_version,
            "tac_text": self.current_text
        }