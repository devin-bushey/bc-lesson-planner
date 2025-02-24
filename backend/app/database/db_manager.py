import os
import psycopg2
from psycopg2.extras import Json
import lancedb
from typing import List, Dict, Optional

class DatabaseManager:
    def __init__(self):
        self.conn = self._connect_to_db()
        self.db = lancedb.connect("database/vectordb/data/lancedb")
        self.curriculum_table = self.db.open_table("bc_curriculum_website")

    def _connect_to_db(self):
        return psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("POSTGRES_HOST"),
            port=os.getenv("POSTGRES_PORT")
        )

    def load_lesson_templates(self) -> List[Dict]:
        with self.conn.cursor() as cursor:
            cursor.execute("SELECT data FROM lesson_templates WHERE id = 1")
            result = cursor.fetchone()
            return result[0] if result else []

    def get_previous_plans(self, grade_level: str, subject: str, user_id: int, limit: int = 5) -> List[Dict]:
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT date, content, metadata 
                FROM lesson_plans 
                WHERE grade_level = %s AND subject = %s AND user_id = %s
                ORDER BY date DESC 
                LIMIT %s
                """,
                (grade_level, subject, user_id, limit)
            )
            results = cursor.fetchall()
            return [
                {
                    "date": result[0],
                    "content": result[1],
                    "metadata": result[2]
                }
                for result in results
            ]

    def get_all_lesson_plans(self, user_id: int) -> List[Dict]:
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, date, grade_level, subject, content, metadata, title
                FROM lesson_plans
                WHERE user_id = %s
                ORDER BY date DESC
                """,
                (user_id,)
            )
            results = cursor.fetchall()
            return [
                {
                    "id": result[0],
                    "date": result[1].strftime("%Y-%m-%d"),
                    "grade_level": result[2],
                    "subject": result[3],
                    "content": result[4],
                    "metadata": result[5],
                    "title": result[6]
                }
                for result in results
            ]

    def get_lesson_plan_by_id(self, plan_id: int, user_id: int) -> Optional[Dict]:
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, date, grade_level, subject, content, metadata, title
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
                "date": result[1].strftime("%Y-%m-%d"),
                "grade_level": result[2],
                "subject": result[3],
                "content": result[4],
                "metadata": result[5],
                "title": result[6]
            }

    def save_plan(self, plan: Dict, user_id: int) -> int:
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO lesson_plans (date, grade_level, subject, content, metadata, title, user_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    plan["date"],
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

    def update_lesson_plan(self, plan_id: int, plan_data: Dict, user_id: int) -> Optional[Dict]:
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
            if "date" in plan_data:
                update_fields.append("date = %s")
                values.append(plan_data["date"])

            if not update_fields:
                return self.get_lesson_plan_by_id(plan_id, user_id)

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