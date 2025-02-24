import os
from dotenv import load_dotenv
from datetime import datetime, timezone
import json
from typing import Dict, List
from database.db_manager import DatabaseManager
from utils.logger import setup_logger
import openai
from .prompt_chains.lesson_plan_chain import LessonPlanChain
from .integrations.educational_apis import YouTubeEducationalAPI

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
        self.prompt_chain = LessonPlanChain()
        self.youtube_api = YouTubeEducationalAPI()

    def _create_context_prompt(self, previous_plans: List[Dict]) -> str:
        if not previous_plans:
            return "No previous lesson plans available for context."
        
        context = "Previous lesson plans:\n"
        for i, plan in enumerate(previous_plans, 1):
            context += f"\nPlan {i}:\n"
            context += f"Created: {plan['created_at']}\n"
            if isinstance(plan['content'], str):
                context += f"Content: {plan['content'][:500]}...\n"
            else:
                context += f"Content: {json.dumps(plan['content'], indent=2)[:500]}...\n"
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

    async def generate_daily_plan(self, user_id: int) -> Dict:
        logger.info(f"Generating lesson plan for Grade {self.grade_level} {self.subject}")

        # Get previous plans for context
        previous_plans = self.db_manager.get_previous_plans(self.grade_level, self.subject, user_id)
        context_prompt = self._create_context_prompt(previous_plans)
        
        # Get curriculum context based on grade and subject
        curriculum_query = f"curriculum objectives for grade {self.grade_level} {self.subject}"
        curriculum_context = await self._get_curriculum_context(curriculum_query)

        # Get lesson plan templates - ensure it's a dictionary
        templates = {"templates": self.lesson_templates} if isinstance(self.lesson_templates, list) else self.lesson_templates
        
        # Get educational videos for the lesson
        educational_videos = await self.youtube_api.search_videos(
            topic=self.subject,
            grade_level=f"grade {self.grade_level}"
        )

        # Execute prompt chain with video resources
        chain_result = await self.prompt_chain.execute_chain(
            grade_level=self.grade_level,
            subject=self.subject,
            curriculum_context=curriculum_context,
            previous_context=context_prompt,
            templates=templates,
            video_resources=educational_videos
        )
        
        # Create structured plan
        plan = {
            "grade_level": self.grade_level,
            "subject": self.subject,
            "content": chain_result["content"],
            "metadata": {
                "previous_plans_referenced": len(previous_plans) if previous_plans else 0,
                "chain_history": chain_result["chain_history"],
                "video_resources": educational_videos
            }
        }

        # Save the plan and get its ID
        plan_id = self.db_manager.save_plan(plan, user_id)
        plan["id"] = plan_id
        
        return plan