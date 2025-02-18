import aiohttp
import os
from typing import Dict, List
from utils.logger import setup_logger

logger = setup_logger()

class YouTubeEducationalAPI:
    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        if not self.api_key:
            logger.warning("YouTube API key not found in environment variables")

    async def search_videos(self, topic: str, grade_level: str, max_results: int = 5) -> List[Dict]:
        """
        Search YouTube for educational videos related to the topic and grade level.
        
        Args:
            topic: The lesson topic to search for
            grade_level: The grade level (e.g., "grade 7")
            max_results: Maximum number of videos to return
        
        Returns:
            List of video details including title, description, and URL
        """
        async with aiohttp.ClientSession() as session:
            try:
                params = {
                    'part': 'snippet',
                    'q': f'education grade {grade_level} {topic}',
                    'videoCategoryId': '27',  # Education category
                    'type': 'video',
                    'maxResults': max_results,
                    'key': self.api_key,
                    'relevanceLanguage': 'en',
                    'safeSearch': 'strict'
                }
                
                async with session.get(
                    'https://www.googleapis.com/youtube/v3/search', 
                    params=params
                ) as response:
                    if response.status != 200:
                        logger.error(f"YouTube API error: {response.status}")
                        return []
                        
                    data = await response.json()
                    videos = [
                        {
                            'title': item['snippet']['title'],
                            'description': item['snippet']['description'],
                            'thumbnail': item['snippet']['thumbnails']['default']['url'],
                            'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                            'published_at': item['snippet']['publishedAt']
                        }
                        for item in data.get('items', [])
                    ]
                    
                    logger.info(f"Found {len(videos)} educational videos for {topic}")
                    return videos
                    
            except Exception as e:
                logger.error(f"Error fetching YouTube videos: {str(e)}")
                return []

