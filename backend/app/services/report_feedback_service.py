import os
from dotenv import load_dotenv
from openai import AsyncOpenAI
from utils.logger import setup_logger

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Set up logging
logger = setup_logger()

class ReportFeedbackService:
    def __init__(self):
        self.model = "gpt-4"  # Using GPT-4 for better quality refinement
        self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def refine_feedback(self, feedback: str) -> str:
        """
        Refines the report card feedback using OpenAI's GPT model.
        
        Args:
            feedback (str): The original feedback text
            
        Returns:
            str: The refined feedback text
        """
        try:
            logger.info("Refining report card feedback")
            
            # Create the prompt for the OpenAI API
            prompt = f"""
            You are an expert educator helping teachers write more effective report card feedback for their students.
            
            Please refine the following report card feedback to make it:
            1. More specific and actionable
            2. Balanced with both strengths and areas for improvement
            3. Personalized and encouraging
            4. Clear and concise with proper grammar
            5. Focused on growth mindset language
            
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