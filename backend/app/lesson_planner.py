import os
from dotenv import load_dotenv
from typing import List, Dict
import json
import openai
from datetime import datetime
import logging
import psycopg2
from psycopg2.extras import Json
import lancedb

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
        self.conn = self._connect_to_db()  # Keep PostgreSQL for lesson plans
        self.db = lancedb.connect("database/vectordb/data/lancedb")  # Add LanceDB connection
        self.curriculum_table = self.db.open_table("bc_curriculum_website")
        self.lesson_templates = self._load_lesson_templates()

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
            logger.info(f"Using previous plan {plan.get('date')}, Subject: {plan.get('subject')}")
            context += f"- Date: {plan.get('date')}, Subject: {plan.get('subject')}, "
            context += f"Previous plan: {json.dumps(plan.get('content', {}), indent=2)}\n"
        
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

    async def _get_curriculum_context(self, query: str, num_results: int = 5) -> str:
        """Search curriculum database for relevant content."""
        # First, create a focused search query using GPT
        search_query = await self._generate_search_query(query)
        
        # Search LanceDB
        results = self.curriculum_table.search(query=search_query).limit(num_results)
        df = results.to_pandas()
        
        # Format results into context
        contexts = []
        for _, row in df.iterrows():
            text = row['text']
            metadata = row['metadata']
            source = f"\nSource: {metadata.get('filename', 'Unknown')}"
            contexts.append(f"{text}{source}")
            
        return "\n\n".join(contexts)

    async def _generate_search_query(self, context: str) -> str:
        """Use GPT to generate a focused search query."""
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are helping to search BC curriculum documents. Convert the context into a focused search query."},
                {"role": "user", "content": f"Generate a search query for: Grade {self.grade_level} {self.subject} curriculum guidance about: {context}"}
            ]
        )
        return response.choices[0].message.content

    async def generate_daily_plan(self) -> Dict:
        logger.info(f"Generating lesson plan for Grade {self.grade_level} {self.subject}")

        """Generate a lesson plan for today, considering previous plans."""
        # Get previous plans for context
        previous_plans = self._get_previous_plans()
        context_prompt = self._create_context_prompt(previous_plans)
        
        # Get curriculum context based on grade and subject
        curriculum_query = f"curriculum objectives for grade {self.grade_level} {self.subject}"
        curriculum_context = await self._get_curriculum_context(curriculum_query)

        # Get specific content
        # TODO: Too many API calls? $$$
        # objectives = await self._get_curriculum_context("learning objectives and assessment criteria")
        # activities = await self._get_curriculum_context("suggested activities and teaching strategies")
        # assessment = await self._get_curriculum_context("assessment methods and success criteria")

        # Objectives:
        # {objectives}

        # Suggested Activities:
        # {activities}

        # Assessment Methods:
        # {assessment}

        # Get lesson plan templates
        templates = self.lesson_templates.get("templates", {})
        
        # Update the prompt to request HTML formatting
        prompt = f"""
        Create a lesson plan for grade {self.grade_level} {self.subject} based on BC curriculum.
        
        Curriculum Context:
        {curriculum_context}

        Format the response in HTML following these rules:
        - Each section should be wrapped in a <div>
        - Main sections should use <h2>
        - Subsections should use <h3>
        - Lists should be properly indented and structured like this:
          <ul>
            <li><strong>Key Point:</strong> Description goes here</li>
            <li><strong>Activity:</strong> <span class="time">20 minutes</span> - Activity description</li>
          </ul>
        - Paragraphs should use <p> tags
        - Important points should be in <strong> tags
        - Time durations should use <span class="time">20 minutes</span>
        - Add a line break <br> after each section
        
        Structure the content with these sections:
        <div class="section">
            <h2>Learning Objectives</h2>
            <ul>
                <li>Objective 1</li>
                <li>Objective 2</li>
            </ul>
        </div>

        <div class="section">
            <h2>Materials Needed</h2>
            <ul>
                <li>Material 1</li>
                <li>Material 2</li>
            </ul>
        </div>

        <div class="section">
            <h2>Lesson Flow</h2>
            <h3>Introduction</h3>
            <ul>
                <li><span class="time">10 minutes</span> - Activity description</li>
            </ul>
            <h3>Main Activity</h3>
            <ul>
                <li><span class="time">30 minutes</span> - Activity description</li>
            </ul>
            <h3>Conclusion</h3>
            <ul>
                <li><span class="time">10 minutes</span> - Activity description</li>
            </ul>
        </div>

        Previous context:
        {context_prompt}

        Use one of these templates to structure your lesson:
        {json.dumps(templates.get('play_based', {}), indent=2)}
        
        Create a plan that builds upon previous lessons while introducing new content.
        Ensure consistent indentation and spacing in the HTML output.
        """

        # Generate the lesson plan
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a curriculum specialist for BC schools. Format your responses in clean HTML that can be directly rendered in a rich text editor."},
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
                "previous_plans_referenced": len(previous_plans) if previous_plans else 0
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