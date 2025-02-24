from typing import Optional, Dict
import psycopg2
from psycopg2.extras import Json
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self, db_connection):
        self.conn = db_connection

    def get_or_create_user(self, auth0_user: Dict) -> int:
        """
        Get an existing user or create a new one based on Auth0 user data.
        Returns the user ID.
        """
        try:
            with self.conn.cursor() as cursor:
                # Try to find existing user
                cursor.execute(
                    "SELECT id FROM users WHERE auth0_id = %s",
                    (auth0_user['sub'],)
                )
                result = cursor.fetchone()
                
                if result:
                    return result[0]
                
                # Create new user if not found
                cursor.execute(
                    """
                    INSERT INTO users (auth0_id, email, name, picture)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        auth0_user['sub'],
                        auth0_user.get('email'),
                        auth0_user.get('name'),
                        auth0_user.get('picture')
                    )
                )
                self.conn.commit()
                return cursor.fetchone()[0]
                
        except Exception as e:
            logger.error(f"Error in get_or_create_user: {str(e)}")
            self.conn.rollback()
            raise 