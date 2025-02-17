import os
from dotenv import load_dotenv
from datetime import datetime
import json
from typing import Dict
from database.db_manager import DatabaseManager
from utils.logger import setup_logger
import openai

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
openai.api_key = os.getenv("OPENAI_API_KEY")

# Set up logging
logger = setup_logger()

class LessonPlannerAgent:
    def __init__(self, grade_level: str, subject: str):
        self.grade_level = grade_level
        self.subject = subject
        self.db_manager = DatabaseManager()
        self.lesson_templates = self.db_manager.load_lesson_templates()

    def _create_context_prompt(self, previous_plans):
        context = "Previous lesson plans covered:\n"
        for plan in previous_plans:
            logger.info(f"Using previous plan {plan.get('date')}, Subject: {plan.get('subject')}")
            context += f"- Date: {plan.get('date')}, Subject: {plan.get('subject')}, "
            context += f"Previous plan: {json.dumps(plan.get('content', {}), indent=2)}\n"
        return context

    async def _get_curriculum_context(self, query: str, num_results: int = 5) -> str:
        search_query = await self.generate_search_query(query)
        results = self.db_manager.curriculum_table.search(query=search_query).limit(num_results)
        df = results.to_pandas()
        
        contexts = []
        for _, row in df.iterrows():
            text = row['text']
            metadata = row['metadata']
            source = f"\nSource: {metadata.get('filename', 'Unknown')}"
            contexts.append(f"{text}{source}")
            
        return "\n\n".join(contexts)
    
    async def generate_search_query(self, context: str) -> str:
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are helping to search BC curriculum documents. Convert the context into a focused search query."},
                {"role": "user", "content": f"Generate a search query for: Grade {self.grade_level} {self.subject} curriculum guidance about: {context}"}
            ]
        )
        return response.choices[0].message.content

    
    async def generate_lesson_plan(prompt: str) -> Dict:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a curriculum specialist for BC schools. Format your responses in clean HTML that can be directly rendered in a rich text editor."},
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content

    async def generate_daily_plan(self) -> Dict:
        logger.info(f"Generating lesson plan for Grade {self.grade_level} {self.subject}")

        """Generate a lesson plan for today, considering previous plans."""
        # Get previous plans for context
        previous_plans = self.db_manager.get_previous_plans(self.grade_level, self.subject)
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

        # print(curriculum_context)

        # print("****")

        # print(context_prompt)

        # print("****")

        # print(json.dumps(templates.get('play_based', {}), indent=2))


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
        self.db_manager.save_plan(plan)
        
        return plan