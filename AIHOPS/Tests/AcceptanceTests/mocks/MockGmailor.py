from Domain.src.Loggs.Response import ResponseSuccessMsg

class MockGmailor:
    def register(self, email, length=6):
        return "000000"  # Always return a test code
    def verify(self, email, code):
        return ResponseSuccessMsg("")  # Always return successful verification
    def verify_automatic(self, code):
        return True  # Always return successful verification
    def is_member_verifiable(self, email):
        return True  # Always return True