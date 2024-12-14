from abc import ABC, abstractmethod


class IService(ABC):
    @abstractmethod
    def register(self, name, passwd):
        ...

    @abstractmethod
    def login(self, name, passwd):
        ...

    @abstractmethod
    def logout(self):
        ...

    @abstractmethod
    def createOrg(self, org):
        ...

    @abstractmethod
    def addMemberToOrg(self, org, name):
        ...

    @abstractmethod
    def removeMemberFromOrg(sel, org, name):
        ...
