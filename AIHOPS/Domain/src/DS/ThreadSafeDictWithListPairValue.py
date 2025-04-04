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

    def to_list(self):
        with self.lock:
            try:
                result = []
                for key, value in self.dict.items():
                    if value is None or not isinstance(value, tuple) or len(value) != 2:
                        continue
                    result.append({
                        "key": key,
                        "value": {"list1": value[0], "list2": value[1]}
                    })
                return result
            except Exception as e:
                return []