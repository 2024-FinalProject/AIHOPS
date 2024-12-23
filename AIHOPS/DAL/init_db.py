from Service.config import Base, engine
from DAL.Objects.DBMember import DBMember
from DAL.Objects.DBProject import DBProject
from DAL.Objects.DBFactors import DBFactors
from DAL.Objects.DBFactorVotes import DBFactorVotes
from DAL.Objects.DBPendingRequests import DBPendingRequests
from DAL.Objects.DBProjectFactors import DBProjectFactors
from DAL.Objects.DBProjectMembers import DBProjectMembers
from DAL.Objects.DBProjectSevrityFactors import DBProjectSeverityFactor
from DAL.Objects.DBSeverityVotes import DBSeverityVotes

def init_database():
    # This will create all tables
    Base.metadata.drop_all(engine)  # Drop all existing tables
    Base.metadata.create_all(engine)  # Create all tables
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_database()