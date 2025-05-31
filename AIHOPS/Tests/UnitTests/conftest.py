class _BaseResp:
    def __init__(self, ok: bool, msg: str = "", obj=None):
        self.success = ok
        self.msg = msg
        self.obj = obj

class FakeSuccess(_BaseResp):
    def __init__(self, msg=""): super().__init__(True, msg)

class FakeFail(_BaseResp):
    def __init__(self, msg=""): super().__init__(False, msg)

class FakeObj(_BaseResp):
    def __init__(self, msg, obj): super().__init__(True, msg, obj)


class StubDB:
    def insert(self, *_):             return FakeSuccess("insert")
    def update(self, *_):             return FakeSuccess("update")
    def delete(self, *_):             return FakeSuccess("delete")
    def delete_obj_by_query(self,*_): return FakeSuccess("delete_q")
    def update_by_query(self,*_):     return FakeSuccess("update_q")
    def load_all(self,*_):            return []
    def load_by_query(self,*_):       return []

