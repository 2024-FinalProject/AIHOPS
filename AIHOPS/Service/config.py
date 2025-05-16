from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from flask_socketio import SocketIO
import os


# init server
app = Flask(__name__)
# wrap our app with CORS
CORS(app, supports_credentials=True)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins='*')


# ----------- later for db -----------
Base = declarative_base()

from DAL.Objects import DBProject
from DAL.Objects import DBPendingRequests

DATABASE_URL = "sqlite:///mydatabase.db"
# PostgreSQL: 'postgresql://user:password@localhost/dbname'
# MySQL:' mysql+pymysql://user:password@localhost/dbname'

engine = create_engine(DATABASE_URL, echo=True)

from sqlalchemy.orm import sessionmaker

# Create a configured "Session" class
Session = sessionmaker(bind=engine)

# Create a session instance
session = Session()

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Define paths for uploads and static files
UPLOAD_FOLDER = os.path.join(PROJECT_ROOT, 'uploads', 'profile_pictures')
STATIC_FOLDER = os.path.join(PROJECT_ROOT, 'static')

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)

# Define allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "dsqosyj2t")
CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "845561785672887")
CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "P1MWRMY7UTGumBmFlc4bbpjO9Ms")
