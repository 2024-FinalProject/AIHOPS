from Domain.src.Users.IUser import IUser

class User(IUser):

    def __init__(self, role):
        self.role = role

    def update_role(self, new_roll):
        self.role = new_roll
        
    def is_google_user(self):
        """Check if the user authenticated through Google"""
        if hasattr(self.role, 'is_google_user'):
            return self.role.is_google_user
        return False

    def __getattr__(self, attr):
        # Forward method calls to the role if not found in User
        return getattr(self.role, attr)