import subprocess
import os
from typing import List, Dict
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def run_embedding_command(url: str, subject: str) -> bool:
    """Run embedding command for a PDF URL."""
    command = [
        sys.executable, 
        "./vectordb/embedding.py",
        url,
        "--subject", subject
    ]
    
    try:
        print(f"\nProcessing: {url}")
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"\nError processing PDF:")
        print(f"Exit code: {e.returncode}")
        print(f"Output: {e.stdout}")
        print(f"Error: {e.stderr}")
        return False
    except Exception as e:
        print(f"\nUnexpected error:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        return False

def get_core_subject_pdfs() -> List[Dict[str, str]]:
    """Return list of URLs and their types to process."""
    return [
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca//files/curriculum/arts-education/en_arts-education_k-9_elab.pdf",
            "subject": "arts-education"
        },
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca//files/curriculum/mathematics/en_mathematics_k-9.pdf",
            "subject": "mathematics" 
        },
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca/files/curriculum/social-studies/en_social-studies_k-9_elab.pdf",
            "subject": "social-studies"
        },
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca/files/curriculum/science/en_science_k-9_elab.pdf",
            "subject": "science"
        },
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca/files/curriculum/english-language-arts/en_english-language-arts_k-9_elab.pdf",
            "subject": "english-language-arts"
        },
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca/files/curriculum/physical-health-education/en_physical-health-education_k-9_elab.pdf",
            "subject": "physical-health-education"
        }
    ]

def main():
    urls = get_core_subject_pdfs()
    
    total = len(urls)
    successful = 0
    failed = 0

    print(f"Processing {total} URLs")
    
    for item in urls:
        if run_embedding_command(item["url"], item["subject"]):
            successful += 1
        else:
            failed += 1

    print(f"\nFinal Results:")
    print(f"Successfully processed: {successful}")
    print(f"Failed to process: {failed}")
    print(f"Total URLs: {total}")

if __name__ == "__main__":
    main()