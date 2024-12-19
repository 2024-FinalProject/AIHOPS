from Domain.src.DS import ThreadSafeDict


class ThreadSafeDictWithListValue (ThreadSafeDict):
    def __init__(self):
        super().__init__()

    def insert(self, key, value):
        with self.lock:
            if key not in self.dict:
                self.dict[key] = []
            self.dict[key].append(value)

    def pop(self, key, value):
        with self.lock:
            if key in self.dict:
                self.dict[key].remove(value)

    def get(self, key):
        with self.lock:
            return self.dict.get(key, None)