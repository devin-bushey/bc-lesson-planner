import os
import psycopg2
from psycopg2.extras import Json
import lancedb
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database path from environment variable or use default
LANCEDB_PATH = os.getenv("LANCEDB_PATH", "../database/vectordb/data/lancedb")

class DatabaseManager:
    def __init__(self):
        self.conn = self._connect_to_db()
        self._init_vectordb()

    def _init_vectordb(self):
        """Initialize vector database connection."""
        try:
            # Ensure the directory exists
            os.makedirs(os.path.dirname(LANCEDB_PATH), exist_ok=True)
            
            self.db = lancedb.connect(LANCEDB_PATH)
            try:
                self.curriculum_table = self.db.open_table("bc_curriculum_website")
            except Exception as e:
                print(f"Warning: Could not open curriculum table: {str(e)}")
                self.curriculum_table = None
        except Exception as e:
            print(f"Warning: Could not connect to vector database: {str(e)}")
            self.db = None
            self.curriculum_table = None

    def _connect_to_db(self):
        """Connect to PostgreSQL database."""
        try:
            return psycopg2.connect(
                dbname=os.getenv("POSTGRES_DB"),
                user=os.getenv("POSTGRES_USER"),
                password=os.getenv("POSTGRES_PASSWORD"),
                host=os.getenv("POSTGRES_HOST"),
                port=os.getenv("POSTGRES_PORT")
            )
        except Exception as e:
            print(f"Warning: Could not connect to PostgreSQL database: {str(e)}")
            return None

    def load_lesson_templates(self) -> List[Dict]:
        if self.conn is None:
            return []
            
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("SELECT data FROM lesson_templates WHERE id = 1")
                result = cursor.fetchone()
                return result[0] if result else []
        except Exception as e:
            print(f"Error loading lesson templates: {str(e)}")
            return []

    def get_previous_plans(self, grade_level: str, subject: str, user_id: int, limit: int = 5) -> List[Dict]:
        if self.conn is None:
            return []
            
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT created_at, content, metadata 
                    FROM lesson_plans 
                    WHERE grade_level = %s AND subject = %s AND user_id = %s
                    ORDER BY created_at DESC 
                    LIMIT %s
                    """,
                    (grade_level, subject, user_id, limit)
                )
                results = cursor.fetchall()
                return [
                    {
                        "created_at": result[0],
                        "content": result[1],
                        "metadata": result[2]
                    }
                    for result in results
                ]
        except Exception as e:
            print(f"Error getting previous plans: {str(e)}")
            return []

    def get_all_lesson_plans(self, user_id: int) -> List[Dict]:
        if self.conn is None:
            return []
            
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, created_at, updated_at, grade_level, subject, content, metadata, title
                    FROM lesson_plans
                    WHERE user_id = %s
                    ORDER BY updated_at DESC
                    """,
                    (user_id,)
                )
                results = cursor.fetchall()
                return [
                    {
                        "id": result[0],
                        "created_at": result[1].isoformat(),
                        "updated_at": result[2].isoformat(),
                        "grade_level": result[3],
                        "subject": result[4],
                        "content": result[5],
                        "metadata": result[6],
                        "title": result[7]
                    }
                    for result in results
                ]
        except Exception as e:
            print(f"Error getting all lesson plans: {str(e)}")
            return []

    def get_lesson_plan_by_id(self, plan_id: int, user_id: int) -> Optional[Dict]:
        if self.conn is None:
            return None
            
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, created_at, updated_at, grade_level, subject, content, metadata, title
                    FROM lesson_plans
                    WHERE id = %s AND user_id = %s
                    """,
                    (plan_id, user_id)
                )
                result = cursor.fetchone()
                if result is None:
                    return None
                return {
                    "id": result[0],
                    "created_at": result[1].isoformat(),
                    "updated_at": result[2].isoformat(),
                    "grade_level": result[3],
                    "subject": result[4],
                    "content": result[5],
                    "metadata": result[6],
                    "title": result[7]
                }
        except Exception as e:
            print(f"Error getting lesson plan by ID: {str(e)}")
            return None

    def save_plan(self, plan: Dict, user_id: int) -> int:
        if self.conn is None:
            raise Exception("Database connection is not available")
            
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO lesson_plans (grade_level, subject, content, metadata, title, user_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        plan["grade_level"],
                        plan["subject"],
                        Json(plan["content"]),
                        Json(plan["metadata"]),
                        plan.get("title", f"{plan['subject']} Lesson"),
                        user_id
                    )
                )
                plan_id = cursor.fetchone()[0]
                self.conn.commit()
                return plan_id
        except Exception as e:
            if self.conn:
                self.conn.rollback()
            print(f"Error saving plan: {str(e)}")
            raise

    def update_lesson_plan(self, plan_id: int, plan_data: Dict, user_id: int) -> Optional[Dict]:
        if self.conn is None:
            return None
            
        try:
            with self.conn.cursor() as cursor:
                # First check if the plan exists and belongs to the user
                cursor.execute(
                    "SELECT id FROM lesson_plans WHERE id = %s AND user_id = %s",
                    (plan_id, user_id)
                )
                if cursor.fetchone() is None:
                    return None

                # Build the update query dynamically based on what fields are provided
                update_fields = []
                values = []
                if "title" in plan_data:
                    update_fields.append("title = %s")
                    values.append(plan_data["title"])
                if "content" in plan_data:
                    update_fields.append("content = %s")
                    values.append(Json(plan_data["content"]))
                if "metadata" in plan_data:
                    update_fields.append("metadata = %s")
                    values.append(Json(plan_data["metadata"]))
                if "grade_level" in plan_data:
                    update_fields.append("grade_level = %s")
                    values.append(plan_data["grade_level"])
                if "subject" in plan_data:
                    update_fields.append("subject = %s")
                    values.append(plan_data["subject"])

                if not update_fields:
                    return self.get_lesson_plan_by_id(plan_id, user_id)

                # Add updated_at timestamp
                update_fields.append("updated_at = CURRENT_TIMESTAMP")

                # Add the plan_id to the values list
                values.append(plan_id)
                values.append(user_id)

                # Execute the update
                cursor.execute(
                    f"""
                    UPDATE lesson_plans
                    SET {", ".join(update_fields)}
                    WHERE id = %s AND user_id = %s
                    """,
                    tuple(values)
                )
                self.conn.commit()

                # Return the updated plan
                return self.get_lesson_plan_by_id(plan_id, user_id)
        except Exception as e:
            if self.conn:
                self.conn.rollback()
            print(f"Error updating lesson plan: {str(e)}")
            return None