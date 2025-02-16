import os
from dotenv import load_dotenv
from typing import List, Dict
import json
from pathlib import Path
import openai
from datetime import datetime, timedelta
import glob
import logging
import psycopg2
from psycopg2.extras import Json

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
openai.api_key = os.getenv("OPENAI_API_KEY")

# Set up logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

class LessonPlannerAgent:
    def __init__(self, grade_level: str, subject: str):
        self.grade_level = grade_level
        self.subject = subject
        self.conn = self._connect_to_db()
        self.curriculum_db = self._load_curriculum()
        self.lesson_templates = self._load_lesson_templates()


    def _load_curriculum(self) -> Dict:
        """Load BC curriculum data from database."""
        with self.conn.cursor() as cursor:
            cursor.execute("SELECT data FROM curriculum WHERE id = 1")
            result = cursor.fetchone()
            return result[0] if result else {}

    def _load_lesson_templates(self) -> List[Dict]:
        """Load lesson plan templates from database."""
        with self.conn.cursor() as cursor:
            cursor.execute("SELECT data FROM lesson_templates WHERE id = 1")
            result = cursor.fetchone()
            return result[0] if result else []

    def _get_previous_plans(self, limit: int = 5) -> List[Dict]:
        """Get the most recent lesson plans for this grade and subject."""
        with self.conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT date, content, metadata 
                FROM lesson_plans 
                WHERE grade_level = %s AND subject = %s 
                ORDER BY date DESC 
                LIMIT %s
                """,
                (self.grade_level, self.subject, limit)
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

    def _create_context_prompt(self, previous_plans: List[Dict]) -> str:
        """Create a prompt that includes context from previous plans."""
        context = "Previous lesson plans covered:\n"
        for plan in previous_plans:
            context += f"- Date: {plan.get('date')}, Topic: {plan.get('topic')}, "
            context += f"Main objectives: {', '.join(plan.get('objectives', []))}\n"
        
        return context

    def _connect_to_db(self):
        """Connect to the PostgreSQL database."""
        conn = psycopg2.connect(
            dbname=os.getenv("POSTGRES_DB"),
            user=os.getenv("POSTGRES_USER"),
            password=os.getenv("POSTGRES_PASSWORD"),
            host=os.getenv("POSTGRES_HOST"),
            port=os.getenv("POSTGRES_PORT")
        )
        return conn

    async def generate_daily_plan(self) -> Dict:

        logger.info(f"Generating lesson plan for Grade {self.grade_level} {self.subject}")

        """Generate a lesson plan for today, considering previous plans."""
        # Get previous plans for context
        previous_plans = self._get_previous_plans()
        context_prompt = self._create_context_prompt(previous_plans)
        
        # Get curriculum objectives for this grade and subject
        curriculum = self.curriculum_db.get("elementary", {}).get(f"grade_{self.grade_level}", {}).get(self.subject, {})
        
        # Create the main prompt
        prompt = f"""
        Create a lesson plan for grade {self.grade_level} {self.subject} based on BC curriculum.
        
        Previous context:
        {context_prompt}
        
        Curriculum objectives:
        {json.dumps(curriculum.get('content', {}), indent=2)}
        
        Create a plan that builds upon previous lessons while introducing new content.
        Include specific activities, materials needed, and assessment strategies.
        Do not format text in markdown. 
        """

        # Generate the lesson plan
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a curriculum specialist for BC schools."},
                {"role": "user", "content": prompt}
            ]
        )

        # Process the response into a structured plan
        plan_content = response.choices[0].message.content
        
        # Create structured plan
        plan = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "grade_level": self.grade_level,
            "subject": self.subject,
            "content": plan_content,
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "curriculum_version": self.curriculum_db.get("metadata", {}).get("version"),
                "previous_plans_referenced": len(previous_plans)
            }
        }

        # Save the plan
        self._save_plan(plan)
        
        return plan

    def _save_plan(self, plan: Dict):
        """Save the lesson plan to the PostgreSQL database."""
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