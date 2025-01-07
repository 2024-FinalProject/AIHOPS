from Domain.src.DS.ThreadSafeDict import ThreadSafeDict


class ThreadSafeDictWithListValue(ThreadSafeDict):
    def __init__(self):
        super().__init__()

    def insert(self, key, value):
        with self.lock:
            if key not in self.dict:
                self.dict[key] = []
            if value not in self.dict[key]:
                self.dict[key].append(value)

    def pop(self, key, value):
        with self.lock:
            if key in self.dict:
                self.dict[key].remove(value)

    def remove(self, key, value):
        with self.lock:
            if key not in self.dict:
                raise KeyError(f"Key {key} not found")
            self.dict[key].remove(value)



    def get(self, key):
        with self.lock:
            return self.dict.get(key, [])

    def size(self):
        return len(self.dict.keys())
    
    def to_list(self):
        with self.lock:
            return [{"key": key, "value": value} for key, value in self.dict.items()]