import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
from utils.logger import setup_logger
from typing import Dict, Any, List, Optional

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Set up logging
logger = setup_logger()

class ReportFeedbackService:
    def __init__(self):
        self.model = "gpt-4.5-preview"  # Using GPT-4 for better quality refinement
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def refine_feedback(self, feedback: str, options: Optional[Dict[str, Any]] = None) -> str:
        """
        Refines the report card feedback using OpenAI's GPT model.
        
        Args:
            feedback (str): The original feedback text
            options (Dict[str, Any], optional): Customization options for the feedback
                - gradeLevel: The grade level (kindergarten, elementary, middle, high, general)
                - tone: The tone of the feedback (professional, supportive, encouraging, etc.)
                - responseLength: The desired length of the response (short, medium, long)
                - focusAreas: List of areas to focus on (strengths, improvements, growth, etc.)
                - customInstructions: Custom instructions provided by the user
            
        Returns:
            str: The refined feedback text
        """
        try:
            logger.info("Refining report card feedback")
            
            # Default options if none provided
            if options is None:
                options = {}
            
            grade_level = options.get('gradeLevel', 'general')
            tone = options.get('tone', 'professional')
            response_length = options.get('responseLength', 'medium')
            focus_areas = options.get('focusAreas', ['strengths', 'improvements', 'growth'])
            custom_instructions = options.get('customInstructions', '')
            
            # Create the prompt for the OpenAI API
            prompt = f"""
            You are an expert educator helping teachers write more effective report card feedback for their students.
            
            Please refine the following report card feedback to make it:
            """
            
            # Add focus areas to the prompt if no custom instructions are provided
            if not custom_instructions:
                if 'strengths' in focus_areas:
                    prompt += "\nHighlight student strengths and achievements"
                if 'improvements' in focus_areas:
                    prompt += "\nAddress areas for improvement constructively"
                if 'growth' in focus_areas:
                    prompt += "\nUse growth mindset language"
                if 'specific' in focus_areas:
                    prompt += "\nInclude specific examples and observations"
                if 'next-steps' in focus_areas:
                    prompt += "\nSuggest clear next steps or goals"
                
                # Add grade level context
                prompt += f"\n\nTarget audience: {grade_level.replace('-', ' ').title()} school level"
                
                # Add tone guidance
                prompt += f"\nTone: {tone.replace('-', ' ').title()}"
                
                # Add length guidance
                length_guidance = {
                    'short': 'Keep the response concise (1-2 sentences)',
                    'medium': 'Provide a moderate length response (3-5 sentences)',
                    'long': 'Provide a detailed response (6+ sentences)'
                }
                prompt += f"\nLength: {length_guidance.get(response_length, 'Provide a moderate length response')}"
            else:
                # Use custom instructions if provided
                prompt += f"\n{custom_instructions}"
                
                # Still include grade level, tone, and length as context even with custom instructions
                prompt += f"\n\nTarget audience: {grade_level.replace('-', ' ').title()} school level"
                
                length_guidance = {
                    'short': 'Keep the response concise (1-2 sentences)',
                    'medium': 'Provide a moderate length response (3-5 sentences)',
                    'long': 'Provide a detailed response (6+ sentences)'
                }
                prompt += f"\nLength: {length_guidance.get(response_length, 'Provide a moderate length response')}"
            
            # Add the original feedback
            prompt += f"""
            
            Original feedback:
            {feedback}
            
            Refined feedback:
            """
            
            # Call the OpenAI API with the newer client format
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert educator assistant that helps teachers write effective report card feedback."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Extract and return the refined feedback
            refined_feedback = response.choices[0].message.content.strip()
            logger.info("Successfully refined report card feedback")
            
            return refined_feedback
            
        except Exception as e:
            logger.error(f"Error refining report card feedback: {str(e)}")
            raise Exception(f"Failed to refine report card feedback: {str(e)}") 