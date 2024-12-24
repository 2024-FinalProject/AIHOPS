from abc import abstractmethod


class IUser:

    @abstractmethod
    def login(self, name, passd):
        ...

    @abstractmethod
    def logout(self):
        ...

    @abstractmethod
    def register(self, name, passd):
        ...

    @abstractmethod
    def getUserName(self):
        ...