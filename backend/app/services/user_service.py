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
                    "SELECT id, email, name, picture FROM users WHERE auth0_id = %s",
                    (auth0_user['sub'],)
                )
                result = cursor.fetchone()
                
                if result:
                    user_id = result[0]
                    # Check if we need to update user information
                    email = result[1]
                    name = result[2]
                    picture = result[3]
                    
                    # If we have new information that was previously missing, update the user
                    if (auth0_user.get('email') and not email) or \
                       (auth0_user.get('name') and not name) or \
                       (auth0_user.get('picture') and not picture):
                        self.update_user_info(user_id, auth0_user)
                        
                    return user_id
                
                print(f"Creating new user: {auth0_user}")
                
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
            
    def update_user_info(self, user_id: int, auth0_user: Dict) -> None:
        """
        Update user information if new data is available.
        """
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE users 
                    SET 
                        email = COALESCE(%s, email),
                        name = COALESCE(%s, name),
                        picture = COALESCE(%s, picture),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (
                        auth0_user.get('email'),
                        auth0_user.get('name'),
                        auth0_user.get('picture'),
                        user_id
                    )
                )
                self.conn.commit()
                logger.info(f"Updated user information for user ID: {user_id}")
        except Exception as e:
            logger.error(f"Error updating user information: {str(e)}")
            self.conn.rollback()
            raise 