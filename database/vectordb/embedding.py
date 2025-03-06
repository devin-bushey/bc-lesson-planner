import argparse
import os
import sys
import traceback
from typing import List

import lancedb
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv
from lancedb.embeddings import get_registry
from lancedb.pydantic import LanceModel, Vector
from openai import OpenAI
from utils.tokenizer import OpenAITokenizerWrapper

load_dotenv()

client = OpenAI()

tokenizer = OpenAITokenizerWrapper()
MAX_TOKENS = 8191

embedding_func = get_registry().get("openai").create(name="text-embedding-3-large")

# Get database path from environment variable or use default
LANCEDB_PATH = "vectordb/data/lancedb"

class ChunkMetadata(LanceModel):
    """Metadata schema for curriculum chunks"""
    filename: str | None
    grade: str | None    # Grade level (e.g. "Kindergarten", "Grade 3")
    page_numbers: List[int] | None
    parent_section: str | None  # For hierarchical relationships in elaborations
    section_type: str | None  # e.g. "Big Ideas", "Curricular Competencies", "Content", "Elaborations"
    subject: str | None  # Area of Learning (e.g. "ARTS EDUCATION")
    title: str | None

class CurriculumChunks(LanceModel):
    """Schema for curriculum chunks with embeddings"""
    text: str = embedding_func.SourceField()
    vector: Vector(embedding_func.ndims()) = embedding_func.VectorField()  # type: ignore
    metadata: ChunkMetadata

def extract_grade_and_subject(text: str) -> tuple[str | None, str | None]:
    """Extract grade level and subject from text using common patterns."""
    grade = None
    subject = None
    
    # Look for grade level patterns
    if "Kindergarten" in text:
        grade = "Kindergarten"
    elif "Grade" in text:
        # Extract grade number (handles "Grade 1" through "Grade 12")
        import re
        grade_match = re.search(r"Grade (\d+)", text)
        if grade_match:
            grade = f"Grade {grade_match.group(1)}"
    
    # Look for subject/area of learning
    common_subjects = [
        "ARTS EDUCATION", "SCIENCE", "MATHEMATICS",
        "ENGLISH LANGUAGE ARTS", "SOCIAL STUDIES",
        "PHYSICAL AND HEALTH EDUCATION"
    ]
    for subj in common_subjects:
        if subj in text.upper():
            subject = subj
            break
    
    return grade, subject

def identify_section_type(text: str, headings: List[str]) -> str:
    """Identify the type of curriculum section based on content and headings."""
    text_upper = text.upper()
    if "BIG IDEAS" in text_upper:
        return "Big Ideas"
    elif "CURRICULAR COMPETENCIES" in text_upper:
        return "Curricular Competencies"
    elif "CONTENT" in text_upper:
        return "Content"
    elif "ELABORATIONS" in text_upper:
        return "Elaborations"
    
    # Check headings if no clear section type found
    if headings:
        heading_upper = headings[0].upper()
        if "ELABORATIONS" in heading_upper:
            return "Elaborations"
    
    return "General"

def process_pdf(url: str, subject_name: str, table_name: str) -> bool:
    try:
        print(f"\nStarting to process PDF from {url}")
        
        # Initialize document converter and process PDF
        print("Converting PDF...")
        converter = DocumentConverter()
        result = converter.convert(url)
        print("PDF conversion completed")

        # Initialize chunker with smaller max tokens to better preserve curriculum structure
        print("Chunking document...")
        chunker = HybridChunker(
            tokenizer=tokenizer,
            max_tokens=MAX_TOKENS // 2,  # Smaller chunks for more precise retrieval
            merge_peers=True,
        )

        # Chunk the document
        chunks = list(chunker.chunk(dl_doc=result.document))
        print(f"Document chunked into {len(chunks)} parts")

        if len(chunks) > 0:
            print("Processing chunks for embedding...")
        else:
            print("No chunks to add to database")
            return False
        
        # Connect to LanceDB using environment variable
        print(f"Connecting to LanceDB at {LANCEDB_PATH}...")
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(LANCEDB_PATH), exist_ok=True)
        
        db = lancedb.connect(LANCEDB_PATH)

        # Create or get table
        print(f"Creating/accessing table {table_name}...")
        try:
            table = db.create_table(table_name, schema=CurriculumChunks)
            print("Created new table")
        except Exception:
            table = db.open_table(table_name)
            print("Using existing table")

        # Process chunks for embedding with enhanced metadata
        print("Processing chunks for embedding...")
        processed_chunks = []
        current_section = None
        
        for chunk in chunks:
            # Extract grade and subject if not already known
            extracted_grade, extracted_subject = extract_grade_and_subject(chunk.text)
            
            # Identify section type
            section_type = identify_section_type(chunk.text, chunk.meta.headings)
            
            # Update current section if this is a major section
            if section_type in ["Big Ideas", "Curricular Competencies", "Content"]:
                current_section = section_type
            
            processed_chunks.append({
                "text": chunk.text,
                "metadata": {
                    "filename": subject_name,
                    "grade": extracted_grade,
                    "page_numbers": [
                        page_no
                        for page_no in sorted(
                            set(
                                prov.page_no
                                for item in chunk.meta.doc_items
                                for prov in item.prov
                            )
                        )
                    ] or None,
                    "parent_section": current_section if section_type == "Elaborations" else None,
                    "section_type": section_type,
                    "subject": extracted_subject or subject_name,
                    "title": chunk.meta.headings[0] if chunk.meta.headings else None,
                },
            })

        # Add chunks to table (this will automatically create embeddings)
        print(f"Adding {len(processed_chunks)} chunks to database...")
        table.add(processed_chunks)
        print("Successfully added chunks to database")

        return True


    except Exception as e:
        print(f"\nError details:")
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        return False

def main():
    parser = argparse.ArgumentParser(description="Process PDF and create embeddings")
    parser.add_argument("url", help="URL of the PDF to process")
    parser.add_argument("--name", help="Subject name", required=True)
    parser.add_argument("--table", help="Table name in LanceDB", required=True)
    
    args = parser.parse_args()

    print(f"Processing {args.url} for {args.name} in table {args.table}")
    
    success = process_pdf(args.url, args.name, args.table)
    if success:
        print(f"Successfully processed {args.url}")
        sys.exit(0)
    else:
        print(f"Failed to process {args.url}")
        sys.exit(1)

if __name__ == "__main__":
    main()
