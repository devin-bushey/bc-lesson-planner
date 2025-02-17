import os
import psycopg2
from psycopg2.extras import Json
import lancedb
from typing import List, Dict

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

    def get_previous_plans(self, grade_level: str, subject: str, limit: int = 5) -> List[Dict]:
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT date, content, metadata 
                FROM lesson_plans 
                WHERE grade_level = %s AND subject = %s 
                ORDER BY date DESC 
                LIMIT %s
                """,
                (grade_level, subject, limit)
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

    def save_plan(self, plan: Dict):
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO lesson_plans (date, grade_level, subject, content, metadata)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    plan["date"],
                    plan["grade_level"],
                    plan["subject"],
                    Json(plan["content"]),
                    Json(plan["metadata"])
                )
            )
            self.conn.commit()