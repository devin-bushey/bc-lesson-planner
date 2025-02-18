import asyncio
from typing import Dict, List, Tuple
import openai
from utils.logger import setup_logger
import json

logger = setup_logger()

class LessonPlanChain:
    def __init__(self):
        self.conversation_history = []
        logger.info("Initializing LessonPlanChain")

    async def _get_completion(self, prompt: str) -> str:
        """Helper method for GPT-4 completions"""
        logger.info(f"Sending prompt to GPT-4 (length: {len(prompt)} chars)")
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a curriculum specialist for BC schools."},
                *self.conversation_history,
                {"role": "user", "content": prompt}
            ]
        )
        logger.info(f"Received response from GPT-4 (length: {len(response.choices[0].message.content)} chars)")
        return response.choices[0].message.content

    async def execute_chain(self, grade_level: str, subject: str, 
                          curriculum_context: str, previous_context: str, 
                          templates: Dict) -> Dict:
        """Execute the lesson planning prompt chain with parallel processing"""
        logger.info(f"Generating lesson plan: Grade {grade_level} {subject}")
        
        try:
            # Step 1: Curriculum analysis
            logger.info("Step 1/5: Analyzing curriculum...")
            curriculum_analysis = await self._analyze_curriculum_requirements(
                grade_level, subject, curriculum_context
            )
            
            # Steps 2-4 in parallel
            logger.info("Steps 2-4/5: Generating objectives, activities, and assessments...")
            objectives, activities, assessment = await asyncio.gather(
                self._generate_learning_objectives(grade_level, curriculum_analysis),
                self._create_activities(curriculum_analysis),
                self._design_assessment(curriculum_analysis),
                return_exceptions=True
            )
            
            # Check for exceptions
            for result in [objectives, activities, assessment]:
                if isinstance(result, Exception):
                    logger.error(f"Chain step failed: {str(result)}")
                    raise result

            # Final composition
            logger.info("Step 5/5: Composing final plan...")
            final_plan = await self._compose_final_plan(
                grade_level, subject, curriculum_analysis,
                objectives, activities, assessment,
                previous_context, templates
            )
            
            logger.info("✅ Lesson plan completed successfully")
            return {
                "content": final_plan,
                "chain_history": self.conversation_history
            }
            
        except Exception as e:
            logger.error(f"Error generating lesson plan: {str(e)}")
            raise

    async def _analyze_curriculum_requirements(self, grade_level: str, 
                                            subject: str, 
                                            curriculum_context: str) -> str:
        logger.info(f"Analyzing curriculum for Grade {grade_level} {subject}")
        prompt = f"""
        Analyze the BC curriculum requirements for grade {grade_level} {subject}.
        
        Curriculum Context:
        {curriculum_context}
        
        Provide a structured analysis including:
        1. Core competencies
        2. Big ideas
        3. Key concepts
        4. Prerequisites
        """
        response = await self._get_completion(prompt)
        logger.info("Completed curriculum analysis")
        logger.info(f"Analysis length: {len(response)} chars")
        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    async def _generate_learning_objectives(self, grade_level: str, curriculum_analysis: str) -> str:
        logger.info(f"Generating objectives based on curriculum analysis")
        prompt = f"""
        Based on this curriculum analysis:
        {curriculum_analysis}
        
        Generate specific, measurable learning objectives that:
        1. Align with BC curriculum standards
        2. Are appropriate for grade {grade_level}
        3. Can be completed in one lesson
        4. Follow SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
        
        Format each objective with:
        - Clear success criteria
        - Connection to curriculum competencies
        - Expected evidence of learning
        """
        
        response = await self._get_completion(prompt)
        logger.info("Generated learning objectives")
        logger.info(f"Number of objectives generated: {response.count('- ')}")
        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    async def _create_activities(self, curriculum_analysis: str) -> str:
        logger.info("Creating learning activities")
        prompt = f"""
        Based on this curriculum analysis:
        {curriculum_analysis}
        
        Create engaging learning activities that align with the curriculum.
        
        For each activity include:
        1. Duration and timing
        2. Required materials and resources
        3. Step-by-step instructions
        4. Differentiation strategies for diverse learners
        5. Teacher prompts and questions
        6. Student grouping strategies
        7. Transitions between activities
        
        Ensure activities are:
        - Age-appropriate
        - Interactive and engaging
        - Scaffold learning progressively
        - Include multiple modalities (visual, auditory, kinesthetic)
        """
        
        response = await self._get_completion(prompt)
        logger.info("Created learning activities")
        logger.info(f"Activities section length: {len(response)} chars")
        self.conversation_history.append({"role": "assistant", "content": response})
        return response

    async def _design_assessment(self, curriculum_analysis: str) -> str:
        logger.info("Designing assessment strategy")
        prompt = f"""
        Based on this curriculum analysis:
        {curriculum_analysis}
        
        Design assessment strategies that align with the curriculum.
        
        Include:
        1. Formative assessment methods
            - Check for understanding strategies
            - Exit tickets
            - Observation checklists
        
        2. Success criteria
            - Clear indicators of achievement
            - Learning progressions
            - Expected outcomes
        
        3. Assessment tools
            - Rubrics
            - Checklists
            - Self-assessment prompts
            - Peer assessment guidelines
        """
        
        response = await self._get_completion(prompt)
        logger.info("Designed assessment strategy")
        logger.info(f"Assessment strategy length: {len(response)} chars")
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
                                templates: Dict) -> str:
        logger.info(f"Composing final plan for Grade {grade_level} {subject}")
        prompt = f"""
        Create a complete lesson plan using these components:
        
        Grade Level: {grade_level}
        Subject: {subject}
        
        Curriculum Analysis:
        {curriculum_analysis}
        
        Learning Objectives:
        {objectives}
        
        Learning Activities:
        {activities}
        
        Assessment Strategy:
        {assessment}
        
        Previous Context:
        {previous_context}
        
        Format the response in clean HTML following these rules:
        - Each section should be wrapped in a <div class="section">
        - Main sections should use <h2>
        - Subsections should use <h3>
        - Lists should use proper <ul> and <li> tags
        - Time durations should use <span class="time">
        - Important points should use <strong>
        - Include clear transitions between activities
        - Add metadata for tracking and assessment
        
        Follow this structure:
        1. Lesson Overview
        2. Learning Objectives
        3. Materials and Resources
        4. Lesson Flow
           - Hook/Introduction
           - Main Activities
           - Closure
        5. Assessment and Evaluation
        6. Extensions and Modifications
        7. Reflection and Notes
        
        Template Reference:
        {templates}
        """
        
        response = await self._get_completion(prompt)
        logger.info("Composed final lesson plan")
        logger.info(f"Final plan sections: {response.count('<div class=\"section\">')}")
        logger.info(f"Final plan HTML length: {len(response)} chars")
        self.conversation_history.append({"role": "assistant", "content": response})
        return response