from threading import RLock


class IdMaker:
    def __init__(self):
        self.queue = [0]
        self.lock = RLock()

    def next_id(self):
        with self.lock:
            next_id = self.queue.pop(0)
            if len(self.queue) == 0:
                self.queue.append(next_id + 1)
        return next_id

    def remove_obj(self, obj_id):
        with self.lock:
            self.queue.insert(0, obj_id)

    def start_from(self, next_id):
        self.queue.pop()
        self.queue.insert(0, next_id)

