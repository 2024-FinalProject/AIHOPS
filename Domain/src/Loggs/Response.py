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
