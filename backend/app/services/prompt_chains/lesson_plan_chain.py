import asyncio
from typing import Dict, List
import openai
from utils.formatters.video_formatter import VideoFormatter
from utils.formatters.response_formatter import strip_markdown_code_blocks
from utils.logger import setup_logger

logger = setup_logger()

class LessonPlanChain:
    def __init__(self):
        self.conversation_history = []
        self.video_formatter = VideoFormatter()
        logger.info("Initializing LessonPlanChain")

    async def _get_completion(self, prompt: str) -> str:
        """Helper method for GPT-4 completions"""
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a BC curriculum specialist. Format responses in clean HTML only, with no explanations or markdown code blocks. Return only the requested content."},
                *self.conversation_history[-2:],  # Only keep last 2 messages for context
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content

    async def execute_chain(self, 
                          grade_level: str, 
                          subject: str, 
                          curriculum_context: str, 
                          previous_context: str, 
                          templates: Dict,
                          video_resources: List[Dict] = None) -> Dict:  # Add video_resources parameter
        """Execute the lesson planning prompt chain with parallel processing"""
        logger.info(f"Starting chain: Grade {grade_level} {subject}")
        
        try:
            curriculum_analysis = await self._analyze_curriculum_requirements(
                grade_level, subject, curriculum_context
            )
            
            # Parallel execution of steps 2-4
            objectives, activities, assessment = await asyncio.gather(
                self._generate_learning_objectives(grade_level, curriculum_analysis),
                self._create_activities(curriculum_analysis),
                self._design_assessment(curriculum_analysis),
                return_exceptions=True
            )
            
            # Check for exceptions
            for result in [objectives, activities, assessment]:
                if isinstance(result, Exception):
                    logger.error(f"Failed: {str(result)}")
                    raise result

            final_plan = await self._compose_final_plan(
                grade_level=grade_level,
                subject=subject,
                curriculum_analysis=curriculum_analysis,
                objectives=objectives,
                activities=activities,
                assessment=assessment,
                previous_context=previous_context,
                templates=templates,
                video_resources=video_resources or []  # Pass video resources with empty list default
            )
            
            return {
                "content": final_plan,
                "chain_history": self.conversation_history
            }
            
        except Exception as e:
            logger.error(f"Chain error: {str(e)}")
            raise

    async def _analyze_curriculum_requirements(self, grade_level: str, 
                                            subject: str, 
                                            curriculum_context: str) -> str:
        prompt = f"""Grade {grade_level} {subject} curriculum analysis:
            {curriculum_context}

            List only:
            1. Core competencies
            2. Big ideas
            3. Key concepts
            4. Prerequisites"""
        
        response = await self._get_completion(prompt)
        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    async def _generate_learning_objectives(self, grade_level: str, curriculum_analysis: str) -> str:
        prompt = f"""Using analysis:
            {curriculum_analysis}

            Create SMART objectives for grade {grade_level}:
            - Specific outcomes
            - Measurable criteria
            - Curriculum alignment
            - Evidence of learning"""
        
        response = await self._get_completion(prompt)
        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    async def _create_activities(self, curriculum_analysis: str) -> str:
        prompt = f"""Based on:
            {curriculum_analysis}

            Design activities with:
            1. Time/materials
            2. Instructions
            3. Differentiation
            4. Teacher prompts
            5. Grouping
            6. Transitions

            Make: interactive, age-appropriate, multi-modal"""
        
        response = await self._get_completion(prompt)
        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    async def _design_assessment(self, curriculum_analysis: str) -> str:
        prompt = f"""Using:
            {curriculum_analysis}

            Create:
            1. Formative checks
            - Exit tickets
            - Observations
            2. Success criteria
            3. Assessment tools
            - Rubrics
            - Self/peer review"""
        
        response = await self._get_completion(prompt)
        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    async def _compose_final_plan(self, 
                                grade_level: str,
                                subject: str,
                                curriculum_analysis: str,
                                objectives: str,
                                activities: str,
                                assessment: str,
                                previous_context: str,
                                templates: Dict,
                                video_resources: List[Dict]) -> str:
        video_section = self.video_formatter.format_videos_html(video_resources)
        
        # Extract key points from previous context to reduce tokens
        prev_context_summary = f"Previous lessons: {previous_context.split('Previous plan:')[0]}"

        prompt = f"""Grade {grade_level} {subject} lesson plan:

            Analysis: {curriculum_analysis}
            Objectives: {objectives}
            Activities: {activities}
            Assessment: {assessment}
            Context: {prev_context_summary}

            Return ONLY the HTML content for the lesson plan, with NO explanations or comments.
            Use this structure:
            <div class="section">
            <h2>Section Title</h2>
            <h3>Subsection</h3>
            <ul><li>Points</li></ul>
            <span class="time">Duration</span>
            </div>

            Required sections in order:
            1. Overview
            2. Objectives
            3. Materials
            4. Lesson Flow
            5. Assessment
            6. Extensions
            7. Reflection

            Resources:
            {video_section}"""

        response = await self._get_completion(prompt)
        self.conversation_history.append({"role": "assistant", "content": response})
        
        # Clean the response by removing markdown code block markers
        cleaned_response = strip_markdown_code_blocks(response)
        return cleaned_response