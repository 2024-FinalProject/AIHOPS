from threading import RLock

from sqlalchemy import MetaData, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
# from DAL.Objects import DBProjectMembers
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj
from Service.config import engine  # Make sure you have your SQLAlchemy engine defined


# Create a session factory
Session = sessionmaker(bind=engine)


def singleton(cls):
    instances = {}

    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance


@singleton
class DBAccess:
    def __init__(self):
        self.lock = RLock()

    def clear_db(self):
        session = Session()
        metadata = MetaData()

        # Reflect the tables from the database using the engine
        metadata.reflect(bind=engine)

        try:
            # Execute a raw SQL TRUNCATE command
            # For PostgreSQL, we use TRUNCATE with CASCADE
            for table in reversed(metadata.sorted_tables):
                print(f"Truncating {table.name}...")
                session.execute(text(f'DELETE FROM {table.name}'))
            session.commit()  # Commit the changes
        except Exception as e:
            session.rollback()  # Rollback in case of error
            print(f"An error occurred: {e}")
        finally:
            session.close()  # Close the session

    def insert(self, obj, closeSession = True):
        with self.lock:
            session = Session()  # Create a new session
            try:
                session.add(obj)
                if closeSession:
                    session.commit()
                return ResponseSuccessMsg("Successfully added to the database.")
            except SQLAlchemyError as e:
                session.rollback()  # Rollback the session if there's an error
                return ResponseFailMsg(f"Rolled back, failed to add to the database: {str(e)}")
            finally:
                if closeSession:
                    session.close()  # Close the session

    def update(self, obj):
        with self.lock:
            session = Session()  # Create a new session
            try:
                session.merge(obj)
                session.commit()  # Assuming you're updating within the session
                return ResponseSuccessMsg("Successfully updated the database.")
            except SQLAlchemyError as e:
                session.rollback()  # Rollback the session if there's an error
                return ResponseFailMsg(f"Rolled back, failed to update the database: {str(e)}")
            finally:
                session.close()  # Close the session

    def load_all(self, Obj):
        session = Session()  # Create a new session
        try:
            return session.query(Obj).all()  # Use the session to query all objects
        finally:
            session.close()  # Close the session

    def delete_obj_by_query(self, table, query_obj):
        with self.lock:
            session = Session()  # Create a new session
            try:
                obj = session.query(table).filter_by(**query_obj).first()
                if obj:
                    session.delete(obj)
                    session.commit()
                    return ResponseSuccessMsg("Successfully deleted from the database.")
                else:
                    return ResponseFailMsg("Object not found.")
            except SQLAlchemyError as e:
                session.rollback()  # Rollback the session if there's an error
                return ResponseFailMsg(f"Rolled back, failed to delete from the database: {str(e)}")
            finally:
                session.close()  # Close the session

    def load_by_query(self, Obj, query_obj):
        session = Session()  # Create a new session
        try:
            return session.query(Obj).filter_by(**query_obj).all()
        except SQLAlchemyError as e:
            return ResponseFailMsg(f"Failed to load data from the database: {str(e)}")
        finally:
            session.close()  # Close the session

    def load_by_join_query(self, primary_obj, join_obj, join_condition, filter_obj=None):
        session = Session()  # Create a new session
        try:
            query = session.query(primary_obj, join_obj).join(join_obj, join_condition)
            if filter_obj:
                query = query.filter_by(**filter_obj)
            return query.all()
        except SQLAlchemyError as e:
            return ResponseFailMsg(f"Failed to load data from the database: {str(e)}")
        finally:
            session.close()  # Close the session