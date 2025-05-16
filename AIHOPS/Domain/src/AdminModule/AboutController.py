import os
import re
from Domain.src.Loggs.Response import ResponseSuccessMsg, ResponseSuccessObj


class AboutController:
    def __init__(self, folder_path="Domain/src/AdminModule/about_aihops.txt"):
        self.folder = os.path.join(os.getcwd(), folder_path)
    
    def load(self):
        print("Looking for about file in:", self.folder)
        if not os.path.exists(self.folder):
            raise FileNotFoundError("No about file found.")
        
        with open(self.folder, 'r', encoding='utf-8') as f:
            self.current_text = f.read()

        self.socketio.emit("get_terms", {
            "version": self.current_version,
            "tac_text": self.current_text
        })

    def update(self, tac_text):
        print("Updating about file in:", self.folder)

        if not os.path.exists(self.folder):
            # create the file if it doesn't exist
            with open(self.folder, 'w', encoding='utf-8') as f:
                f.write(tac_text)
                print("File created and text written.")
            return

        # Overwrite the existing file with new text
        with open(self.folder, 'w', encoding='utf-8') as f:
            f.write(tac_text)

        self.current_text = tac_text

        return ResponseSuccessMsg("admin updated about file")


    def fetch(self):
        if not os.path.exists(self.folder):
            raise FileNotFoundError("No about file found.")
        
        with open(self.folder, 'r', encoding='utf-8') as f:
            self.current_text = f.read()

        return ResponseSuccessObj("success to fetch about file", self.current_text)

    

