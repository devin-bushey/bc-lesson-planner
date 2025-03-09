import argparse
import os
from pathlib import Path
import re
import sys
import traceback
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass

import lancedb
from dotenv import load_dotenv
from lancedb.embeddings import get_registry
from lancedb.pydantic import LanceModel, Vector
from openai import OpenAI
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter
from utils.tokenizer import OpenAITokenizerWrapper

# Configuration Constants
MAX_TOKENS = 8191
CURRENT_DIR = Path(__file__).parent
LANCEDB_PATH = "vectordb/data/lancedb"
TABLE_NAME = "bc_curriculum_website"

# Initialize global services
load_dotenv()
client = OpenAI()
tokenizer = OpenAITokenizerWrapper()
embedding_func = get_registry().get("openai").create(name="text-embedding-3-small")

# Data Models
@dataclass
class Section:
    content: str
    metadata: Dict[str, str]

class ChunkMetadata(LanceModel):
    """
    You must order the fields in alphabetical order.
    This is a requirement of the Pydantic implementation.
    """
    grade_level: str | None
    section_type: str | None
    subject_area: str | None

class Chunks(LanceModel):
    """Schema for document chunks with embeddings."""
    text: str = embedding_func.SourceField()
    vector: Vector(embedding_func.ndims()) = embedding_func.VectorField()  # type: ignore
    metadata: ChunkMetadata

class MarkdownProcessor:
    """Handles markdown document processing and metadata extraction."""
    
    @staticmethod
    def extract_metadata_from_markdown(markdown_text: str) -> Dict[str, str | None]:
        """Extract metadata from the markdown content."""
        metadata = {
            "grade_level": None,
            "subject_area": None
        }
        
        metadata_match = re.search(r"---\s*Metadata:(.*?)---", markdown_text, re.DOTALL)
        if metadata_match:
            metadata_text = metadata_match.group(1)
            
            grade_level_match = re.search(r"metadata_grade_level:\s*(.*?)(?:\n|$)", metadata_text)
            if grade_level_match:
                metadata["grade_level"] = grade_level_match.group(1).strip()
                
            subject_area_match = re.search(r"metadata_subject_area:\s*(.*?)(?:\n|$)", metadata_text)
            if subject_area_match:
                metadata["subject_area"] = subject_area_match.group(1).strip()
        
        return metadata

    @staticmethod
    def clean_text_from_metadata(text: str) -> str:
        """Remove the metadata section from the text content."""
        parts = text.split('---')
        if len(parts) >= 3:
            return '---'.join(parts[2:]).strip()
        return text.strip()

    @staticmethod
    def split_by_area_of_learning(markdown_content: str) -> List[str]:
        """Split the content by Area of Learning sections."""
        sections = markdown_content.split("## Area of Learning:")
        processed_sections = []
        
        if sections[0].strip():
            processed_sections.append(sections[0].strip())
        
        for section in sections[1:]:
            if section.strip():
                processed_sections.append(f"## Area of Learning:{section}")
        
        return processed_sections

class DocumentProcessor:
    """Handles document processing and chunking."""
    
    def __init__(self, subject: str):
        self.converter = DocumentConverter()
        self.chunker = HybridChunker(
            tokenizer=tokenizer,
            max_tokens=MAX_TOKENS // 4,
            merge_peers=True,
        )
        self.subject = self._standardize_filename_component(subject)

    def process_markdown_batch(self, batch_content: str, batch_number: int, total_batches: int) -> Section | None:
        """Process a batch of markdown content."""
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an assistant that helps structure educational curriculum content. Your task is to take markdown content and format it consistently and cleanly, optimizing for readability and proper markdown structure."
                    },
                    {
                        "role": "user",
                        "content": self._get_formatting_prompt(batch_content, batch_number, total_batches)
                    }
                ],
                temperature=0.2,
                max_tokens=4000
            )
            
            processed_content = response.choices[0].message.content
            metadata = MarkdownProcessor.extract_metadata_from_markdown(processed_content)
            cleaned_content = MarkdownProcessor.clean_text_from_metadata(processed_content)
            
            if metadata["grade_level"] and metadata["subject_area"]:
                self._save_processed_section(cleaned_content, metadata)
                print(f"Processed and saved section {batch_number} with grade level: {metadata['grade_level']}, subject area: {metadata['subject_area']}")
                return Section(content=cleaned_content, metadata=metadata)
            
            print(f"Warning: Missing metadata for section {batch_number}")
            print("Content preview:", cleaned_content[:200])
            return None
            
        except Exception as e:
            print(f"Error processing batch {batch_number}: {str(e)}")
            print("Content preview:", batch_content[:200])
            return None

    def _get_formatting_prompt(self, content: str, batch_number: int, total_batches: int) -> str:
        """Generate the formatting prompt for the AI model."""
        return f"""
        This is section {batch_number} of {total_batches} from a curriculum document. 
        Please format this markdown following these strict rules:

        1. Start with a metadata section in this exact format (no extra newlines). For the grade level:
        - Use ONLY these exact values: Kindergarten, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
        - Do NOT include the word "Grade" in the value
        - If multiple grades are mentioned, use the first/lowest grade
        - If no specific grade is found, analyze the content to determine the most likely grade level
        ---
        Metadata:
        metadata_grade_level: <grade level>
        metadata_subject_area: <subject area>
        ---

        2. Format headers consistently:
        - Main area of learning: Level 2 (##)
        - Major sections (Big Ideas, Learning Standards): Level 3 (###)
        - Subsections (Elaborations): Level 4 (####)

        3. Format lists consistently:
        - Use bullet points (-) for all lists
        - Indent nested lists with 2 spaces
        - Keep list items aligned and properly indented
        - No extra newlines between list items

        4. Format tables:
        - Keep table headers and content aligned
        - Use consistent column widths
        - No extra spaces in cells

        5. Content organization:
        - One blank line between sections
        - No multiple consecutive blank lines
        - Consistent indentation throughout
        - Remove any redundant or duplicate headers

        Here's the section to process:

        {content}
        """

    def _save_processed_section(self, content: str, metadata: Dict[str, str | None]) -> None:
        """Save processed section to a file with standardized naming. Appends if file exists."""
        os.makedirs(CURRENT_DIR / "temp", exist_ok=True)
        
        # Standardize grade level and use the standardized subject from initialization
        grade_level = self._standardize_filename_component(metadata.get('grade_level', ''))
        
        # Create filename in format: {grade}-{subject}.md
        filename = f"{grade_level}-{self.subject}.md"
        filepath = CURRENT_DIR / "temp" / filename
        
        # If file exists, append content with a section separator
        if filepath.exists():
            with open(filepath, 'a') as file:
                file.write("\n\n---\n\n")  # Add a clear section separator
                file.write(content)
            print(f"Appended content to existing file: {filename}")
        else:
            # Create new file if it doesn't exist
            with open(filepath, 'w') as file:
                file.write(content)
            print(f"Created new file: {filename}")

    def chunk_document(self, url: str) -> List[dict]:
        """Process and chunk a document from the given URL."""
        result = self.converter.convert(url)
        markdown = result.document.export_to_markdown()
        sections = MarkdownProcessor.split_by_area_of_learning(markdown)
        processed_sections = []

        print(f"Found {len(sections)} Areas of Learning to process")

        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_section = {
                executor.submit(self.process_markdown_batch, section, i + 1, len(sections)): i 
                for i, section in enumerate(sections)
            }
            
            for future in as_completed(future_to_section):
                section_idx = future_to_section[future]
                try:
                    result = future.result()
                    if result:
                        processed_sections.append(result)
                    else:
                        print(f"Section {section_idx + 1} processing failed")
                except Exception as e:
                    print(f"Section {section_idx + 1} generated an exception: {str(e)}")

        return self._process_sections_to_chunks(processed_sections)

    def _process_sections_to_chunks(self, processed_sections: List[Section]) -> List[dict]:
        """Process sections into database chunks."""
        db = lancedb.connect(LANCEDB_PATH)
        
        try:
            table = db.create_table(TABLE_NAME, schema=Chunks)
            print("Created new table")
        except Exception:
            table = db.open_table(TABLE_NAME)
            print("Using existing table")

        all_chunks = []
        for file in (CURRENT_DIR / "temp").glob("*.md"):
            chunks = self._process_file_to_chunks(file)
            if chunks:
                table.add(chunks)
                all_chunks.extend(chunks)
                print(f"Added {len(chunks)} chunks to database from {file.name}")
            else:
                print(f"No chunks processed from {file.name}")

        return all_chunks

    def _process_file_to_chunks(self, file: Path) -> List[dict]:
        """Process a single file into chunks."""
        conversion_result = self.converter.convert(file)
        dl_doc = conversion_result.document
        chunks = list(self.chunker.chunk(dl_doc=dl_doc))
        print(f"Found {len(chunks)} chunks in {file.name}")
        
        processed_chunks = []
        for chunk in chunks:
            # Extract grade level from standardized filename
            grade_str = file.stem.split("-")[0]
            
            # Convert grade level back to readable format
            if grade_str == "kindergarten" or grade_str == "00":
                grade_level = "Kindergarten"
            else:
                try:
                    grade_level = str(int(grade_str))  # Remove leading zero
                except ValueError:
                    print(f"Warning: Invalid grade level '{grade_str}' in filename {file.name}")
                    continue  # Skip this chunk if grade level is invalid
                
            section_type = chunk.meta.headings[0] if chunk.meta and chunk.meta.headings else None

            metadata = {
                "grade_level": grade_level,
                "section_type": section_type,
                "subject_area": self.subject.replace('_', ' '),
            }

            combined_text = f"{grade_level} {self.subject.replace('_', ' ')} {section_type}: \n{chunk.text}"
            processed_chunks.append({
                "text": combined_text,
                "metadata": metadata
            })
            
        return processed_chunks

    def _standardize_filename_component(self, component: str) -> str:
        """Standardize the filename component."""
        return component.strip().lower().replace(" ", "_")

def process_pdf(url: str, subject: str) -> bool:
    """Main function to process a PDF document."""
    try:
        print(f"\nStarting to process PDF from {url} for {subject}")
        processor = DocumentProcessor(subject)
        chunks = processor.chunk_document(url)
        
        if chunks:
            print(f"Document processed into {len(chunks)} chunks")
            return True
        else:
            print("No chunks to add to database")
            return False

    except Exception as e:
        print(f"\nError details:")
        print(f"Type: {type(e).__name__}")
        print(f"Message: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        return False

def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Process PDF and create embeddings")
    parser.add_argument("url", help="URL of the PDF to process")
    parser.add_argument("--subject", required=True, help="Name of the subject (e.g., 'social studies', 'arts education')")
    args = parser.parse_args()

    print(f"Processing {args.url} for {args.subject}")
    
    success = process_pdf(args.url, args.subject)
    if success:
        print(f"Successfully processed {args.url}")
        sys.exit(0)
    else:
        print(f"Failed to process {args.url}")
        sys.exit(1)

if __name__ == "__main__":
    main()
