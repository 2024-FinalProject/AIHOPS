class Response:
    def __init__(self, success, msg, result, isErr):
        self.success = success
        self.msg = msg
        self.result = result
        self.isErr = isErr
        print(msg)


class ResponseFailMsg(Response):
    def __init__(self, msg):
        super().__init__(False, msg, None, False)


class ResponseSuccessMsg(Response):
    def __init__(self, msg):
        super().__init__(True, msg, None, False)


class ResponseSuccessObj(Response):
    def __init__(self, msg, result):
        super().__init__(True, msg, result, False)

class ResponseLogin(Response):
    def __init__(self, success, msg, is_admin=False, accepted_tac_version=-1, need_to_accept_new_terms=False):
        super().__init__(success, msg, None, False)
        self.is_admin = is_admin
        self.accepted_tac_version = accepted_tac_version
        self.need_to_accept_new_terms = need_to_accept_new_terms
