from Domain.src.DS.ThreadSafeDict import ThreadSafeDict


class ThreadSafeDictWithListValue(ThreadSafeDict):
    def __init__(self):
        super().__init__()

    def insert(self, key, value):
        with self.lock:
            if key not in self.dict:
                self.dict[key] = []
            if value not in self.dict[key]:  # Prevent duplicates
                self.dict[key].append(value)

    def pop(self, key, value):
        with self.lock:
            if key in self.dict:
                self.dict[key].remove(value)

    def get(self, key):
        with self.lock:
            return self.dict.get(key, None)

    def size(self):
        return len(self.dict.keys())