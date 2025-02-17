import subprocess
import time
from typing import List, Dict
import sys

def run_embedding_command(url: str, doc_type: str, table: str) -> bool:
    """Run a single embedding command and return success status."""
    command = [
        sys.executable,  # Use the current Python interpreter
        "embedding.py",
        url,
        "--type", doc_type,
        "--table", table
    ]
    
    try:
        print(f"\nProcessing: {url}")
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error processing {url}:")
        print(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        print(f"Unexpected error processing {url}: {str(e)}")
        return False

def get_curriculum_urls() -> List[Dict[str, str]]:
    """Return list of URLs and their types to process."""
    return [
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca/files/curriculum/career-education/en_career-education_k-9.pdf",
            "type": "pdf"
        },
        {
            "url": "https://curriculum.gov.bc.ca/curriculum/overview",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/communication",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/collaborating",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/thinking",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/thinking/creative-thinking",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/thinking/critical-and-reflective-thinking",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/personal-and-social",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/personal-and-social/personal-awareness-and-responsibility",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/personal-and-social/positive-personal-and-cultural-identity",
            "type": "webpage"
        },
        {
            "url": "https://curriculum.gov.bc.ca/competencies/personal-and-social/social-awareness-and-responsibility",
            "type": "webpage"
        }
    ]

def main():
    table_name = "bc_curriculum_website"
    urls = get_curriculum_urls()
    
    total = len(urls)
    successful = 0
    failed = 0
    
    print(f"Starting to process {total} URLs...")
    
    for i, url_info in enumerate(urls, 1):
        print(f"\nProgress: {i}/{total}")
        success = run_embedding_command(url_info["url"], url_info["type"], table_name)
        
        if success:
            successful += 1
        else:
            failed += 1
            
        # Add a small delay between requests to avoid overwhelming the server
        if i < total:
            time.sleep(2)
    
    print("\nProcessing complete!")
    print(f"Successfully processed: {successful}")
    print(f"Failed to process: {failed}")
    print(f"Total URLs: {total}")

if __name__ == "__main__":
    main()