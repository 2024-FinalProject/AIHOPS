from threading import RLock


class ThreadSafeList:
    def __init__(self):
        self.list = []
        self.lock = RLock()

    def append(self, value):
        """Append an item to the list."""
        with self.lock:
            self.list.append(value)

    def pop(self, index=-1):
        """Remove and return an item at the specified index. Defaults to the last item."""
        with self.lock:
            if -len(self.list) <= index < len(self.list):
                return self.list.pop(index)
            else:
                raise IndexError("Index out of range")

    def get(self, index):
        """Get the item at the specified index."""
        with self.lock:
            if -len(self.list) <= index < len(self.list):
                return self.list[index]
            else:
                raise IndexError("Index out of range")

    def remove(self, value):
        """Remove the first occurrence of a value."""
        with self.lock:
            self.list.remove(value)

    def clear(self):
        """Clear all items from the list."""
        with self.lock:
            self.list.clear()

    def size(self):
        """Return the number of items in the list."""
        with self.lock:
            return len(self.list)

    def contains(self, value):
        """Check if the list contains a value."""
        with self.lock:
            return value in self.list

    def to_list(self):
        """Return a shallow copy of the list."""
        with self.lock:
            try:
                return self.list[:] if self.list else []
            except Exception as e:
                return []
            
    def __setitem__(self, index, value):
        """Set the item at the specified index."""
        with self.lock:
            if -len(self.list) <= index < len(self.list):
                self.list[index] = value
            else:
                raise IndexError("Index out of range")
        