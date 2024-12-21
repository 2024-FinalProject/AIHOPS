from Domain.src.DS.ThreadSafeDict import ThreadSafeDict


class ThreadSafeDictWithListPairValue(ThreadSafeDict):
    def __init__(self):
        super().__init__()

    def insert(self, key, value):
        with self.lock:
            if key not in self.dict:
                self.dict[key] = ([], [])
            else:
                self.dict[key] = value

    def get(self, key):
        with self.lock:
            return self.dict.get(key, None)
        
    def getKeys(self):
        with self.lock:
            return self.dict.keys()
        
    def getItems(self):
        with self.lock:
            return list(self.dict.items())
        
    def size(self):
        with self.lock:
            return len(self.dict)  # Number of keys
        
    def pop(self, key):
        with self.lock:
            if key in self.dict:
                value = self.dict[key]
                del self.dict[key]
                return value
            else:
                raise KeyError(f"Key '{key}' not found in the dictionary.")