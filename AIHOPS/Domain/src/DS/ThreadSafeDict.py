
from threading import RLock


class ThreadSafeDict:
    def __init__(self):
        self.dict = {}
        self.lock = RLock()

    def insert(self, key, value):
        with self.lock:
            self.dict[key] = value

    def pop(self, key):
        with self.lock:
            return self.dict.pop(key, None)

    def get(self, key, def_val=None):
        with self.lock:
            return self.dict.get(key, def_val)
        
    def getKeys(self):
        with self.lock:
            return self.dict.keys()

    def size(self):
        return self.dict.__len__()


