from Domain.src.Users.IUser import IUser

class User(IUser):

    def __init__(self, role):
        self.role = role

    def update_role(self, new_roll):
        self.role = new_roll

    def __getattr__(self, attr):
        # Forward method calls to the role if not found in User
        return getattr(self.role, attr)