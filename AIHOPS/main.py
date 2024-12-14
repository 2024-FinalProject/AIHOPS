from Domain.src.Server import Server
from Service.config import app, Base, engine
import sys

if __name__ == '__main__':
    Base.metadata.create_all(engine)
    server = Server()

