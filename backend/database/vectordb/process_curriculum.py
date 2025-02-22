import subprocess
from typing import List, Dict
import sys

def run_embedding_command(url: str, doc_type: str, table: str, chunk_size: int = 1000) -> bool:
    """Run a single embedding command with chunking support."""
    command = [
        sys.executable, 
        "embedding.py",
        url,
        "--type", doc_type,
        "--table", table,
        "--chunk-size", str(chunk_size)
    ]
    
    try:
        print(f"\nProcessing: {url}")
        # Increased timeout to 20 minutes for large PDFs
        result = subprocess.run(command, check=True, capture_output=True, text=True, timeout=1200)
        print(result.stdout)
        return True
    except subprocess.TimeoutExpired:
        print(f"Processing timed out for {url}. Try reducing chunk size or increasing timeout.")
        return False
    except Exception as e:
        print(f"Unexpected error processing {url}: {str(e)}")
        return False

def get_core_subject_pdfs() -> List[Dict[str, str]]:
    """Return list of URLs and their types to process."""
    return [
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca//files/curriculum/adst/en_adst_k-9_elab.pdf",
            "type": "pdf"
        },
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca//files/curriculum/arts-education/en_arts-education_k-9_elab.pdf",
            "type": "pdf"
        },
        {
            "url": "https://curriculum.gov.bc.ca/sites/curriculum.gov.bc.ca//files/curriculum/mathematics/en_mathematics_k-9_elab.pdf",
            "type": "pdf" 
        }
    ]

def main():
    table_name = "bc_curriculum_website"
    urls = get_core_subject_pdfs()
    
    total = len(urls)
    successful = 0
    failed = 0
    
    for url_info in urls:
        # Reduced chunk size further for very large PDFs
        chunk_size = 250 if url_info["url"].endswith('.pdf') else 1000
        success = run_embedding_command(
            url_info["url"], 
            url_info["type"], 
            table_name,
            chunk_size
        )
        if success:
            successful += 1
        else:
            failed += 1
        
    
    print(f"Successfully processed: {successful}")
    print(f"Failed to process: {failed}")
    print(f"Total URLs: {total}")

if __name__ == "__main__":
    main()