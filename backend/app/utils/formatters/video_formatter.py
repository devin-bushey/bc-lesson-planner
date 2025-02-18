from typing import Dict, List

class VideoFormatter:
    @staticmethod
    def format_videos_html(video_resources: List[Dict], max_videos: int = 3) -> str:
        """
        Format video resources into HTML section.
        
        Args:
            video_resources: List of video dictionaries
            max_videos: Maximum number of videos to include
        """
        if not video_resources:
            return ""

        videos_html = '\n'.join([
            f"""
            <div class="video-resource">
                <h3>{video['title']}</h3>
                <p>{video['description']}</p>
                <a href="{video['url']}" 
                   class="video-link" 
                   target="_blank" 
                   rel="noopener noreferrer">
                    Watch Video
                </a>
            </div>
            """ for video in video_resources[:max_videos]  # Limit to max_videos
        ])

        return f"""
        <div class="section">
            <h2>Educational Resources</h2>
            <div class="video-resources">
                {videos_html}
            </div>
        </div>
        """