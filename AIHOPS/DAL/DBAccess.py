from threading import RLock

from sqlalchemy import MetaData, text, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from DAL.Objects.DBFactors import DBFactors
# from DAL.Objects import DBProjectMembers
from Domain.src.Loggs.Response import ResponseFailMsg, ResponseSuccessMsg, ResponseSuccessObj
from Service.config import engine  # Make sure you have your SQLAlchemy engine defined

from sqlalchemy.orm import Session as SASession  # alias so we don’t shadow your Session factory
from DAL.Objects.DBProjectFactors import DBProjectFactors
from DAL.Objects.DBPendingRequests import DBPendingRequests
from DAL.Objects.DBProjectSeverityFactor import DBProjectSeverityFactor
from DAL.Objects.DBFactorVotes import DBFactorVotes
from DAL.Objects.DBSeverityVotes import DBSeverityVotes
from DAL.Objects.DBProjectMembers import DBProjectMembers
from DAL.Objects.DBProject import DBProject

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
                return ResponseFailMsg(f"Rolled back, failed to add to the database")
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
                return ResponseFailMsg(f"Rolled back, failed to update the database")
            finally:
                session.close()  # Close the session

    def update_by_query(self, table, query_obj, update_data):
        with self.lock:
            session = Session()  # Create a new session
            try:
                obj = session.query(table).filter_by(**query_obj).first()
                if obj is None:
                    return ResponseFailMsg("No matching record found to update.")

                for key, value in update_data.items():
                    setattr(obj, key, value)  # Update object attributes

                session.commit()  # Commit the changes
                return ResponseSuccessMsg("Successfully updated the database.")
            except SQLAlchemyError as e:
                session.rollback()  # Rollback in case of an error
                return ResponseFailMsg(f"Rolled back, failed to update the database")
            finally:
                session.close()  # Close the session

    def delete(self, obj):
        with self.lock:  # Ensure thread safety if applicable
            session = Session()  # Create a new session
            try:
                session.delete(obj)  # Mark the object for deletion
                session.commit()  # Commit the deletion
                return ResponseSuccessMsg("Successfully deleted the object from the database.")
            except SQLAlchemyError as e:
                session.rollback()  # Rollback the session in case of an error
                return ResponseFailMsg(f"Rolled back, failed to delete the object")
            finally:
                session.close()  # Ensure the session is closed


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
                return ResponseFailMsg(f"Rolled back, failed to delete from the database")
            finally:
                session.close()  # Close the session

    def load_by_query(self, Obj, query_obj):
        session = Session()  # Create a new session
        try:
            return session.query(Obj).filter_by(**query_obj).all()
        except SQLAlchemyError as e:
            return ResponseFailMsg(f"Failed to load data from the database")
        finally:
            session.close()  # Close the session

    def load_by_join_query(self, primary_obj, join_obj, select_attrs, join_condition, filter_obj=None):
        session = Session()  # Create a new session
        try:
            # Explicitly specify the primary table using select_from
            query = session.query(*select_attrs).select_from(primary_obj).join(join_obj, join_condition)

            if filter_obj:
                # Dynamically build filter conditions
                for key, value in filter_obj.items():
                    query = query.filter(getattr(primary_obj, key) == value)

            return query.all()
        except SQLAlchemyError as e:
            return ResponseFailMsg(f"Failed to load data from the database")
        finally:
            session.close()  # Close the session

    def get_highest_factor_id(self):
        session = Session()  # Create a new session
        try:
            # Retrieve the maximum ID from the Factor table
            highest_id = session.query(func.max(DBFactors.id)).scalar()
            return highest_id
        except SQLAlchemyError as e:
            return ResponseFailMsg(f"Failed to retrieve the highest Factor ID")
        finally:
            session.close()  # Close the session

    def delete_all_by_query(self, table, query_obj):
        with self.lock:
            session = Session()
            try:
                session.query(table).filter_by(**query_obj).delete(synchronize_session=False)
                session.commit()
                return ResponseSuccessMsg(f"Deleted rows from {table.__tablename__}.")
            except SQLAlchemyError as e:
                session.rollback()
                return ResponseFailMsg(f"Failed to delete from {table.__tablename__}: {e}")
            finally:
                session.close()

    def delete_project(self, pid):
        """Atomically delete project + all its child rows, or roll back on any failure."""
        with self.lock:
            session = Session()  # your sessionmaker
            try:
                # begin a transaction
                with session.begin():
                    # delete each child table by project_id
                    session.query(DBProjectFactors).filter_by(project_id=pid).delete(synchronize_session=False)
                    session.query(DBPendingRequests).filter_by(project_id=pid).delete(synchronize_session=False)
                    session.query(DBProjectSeverityFactor).filter_by(project_id=pid).delete(synchronize_session=False)
                    session.query(DBFactorVotes).filter_by(project_id=pid).delete(synchronize_session=False)
                    session.query(DBSeverityVotes).filter_by(project_id=pid).delete(synchronize_session=False)
                    session.query(DBProjectMembers).filter_by(project_id=pid).delete(synchronize_session=False)

                    # finally delete the project row itself
                    session.query(DBProject).filter_by(id=pid).delete(synchronize_session=False)
                # if we reach here, all deletes ran without exception, and session.begin() committed
                return ResponseSuccessMsg(f"Project {pid} and all its dependents deleted.")
            except SQLAlchemyError as e:
                # any error rolls back the entire transaction
                session.rollback()
                return ResponseFailMsg(f"delete_project transaction failed: {e}")
            finally:
                session.close()