from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

# init server
app = Flask(__name__)
# wrap our app with CORS
CORS(app)


# ----------- later for db -----------
Base = declarative_base()
DATABASE_URL = "sqlite:///mydatabase.db"

# PostgreSQL: 'postgresql://user:password@localhost/dbname'
# MySQL:' mysql+pymysql://user:password@localhost/dbname'

engine = create_engine(DATABASE_URL, echo=True)

from sqlalchemy.orm import sessionmaker

# Create a configured "Session" class
Session = sessionmaker(bind=engine)

# Create a session instance
session = Session()