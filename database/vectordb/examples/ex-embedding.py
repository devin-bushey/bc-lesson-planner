import os
from pathlib import Path
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
import re
from dataclasses import dataclass

import lancedb
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv
from lancedb.embeddings import get_registry
from lancedb.pydantic import LanceModel, Vector
from openai import OpenAI
from tokenizer import OpenAITokenizerWrapper


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




def extract_metadata_from_markdown(markdown_text):
    """Extract metadata from the markdown by looking for specific metadata lines."""
    metadata = {
        "grade_level": None,
        "subject_area": None
    }
    
    # Extract metadata section
    metadata_match = re.search(r"---\s*Metadata:(.*?)---", markdown_text, re.DOTALL)
    if metadata_match:
        metadata_text = metadata_match.group(1)
        
        # Extract grade level
        grade_level_match = re.search(r"metadata_grade_level:\s*(.*?)(?:\n|$)", metadata_text)
        if grade_level_match:
            metadata["grade_level"] = grade_level_match.group(1).strip()
            
        # Extract subject area
        subject_area_match = re.search(r"metadata_subject_area:\s*(.*?)(?:\n|$)", metadata_text)
        if subject_area_match:
            metadata["subject_area"] = subject_area_match.group(1).strip()
    
    return metadata

def process_markdown_batch(batch_content, batch_number, total_batches):
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
                    "content": f"""
                    This is section {batch_number} of {total_batches} from a curriculum document. 
                    Please format this markdown following these strict rules:

                    1. Start with a metadata section in this exact format (no extra newlines). The grade level should not include the word Grade:
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

                    {batch_content}
                    """
                }
            ],
            temperature=0.2,
            max_tokens=4000
        )
        processed_content = response.choices[0].message.content
        metadata = extract_metadata_from_markdown(processed_content)
        cleaned_content = clean_text_from_metadata(processed_content)
        if metadata["grade_level"] and metadata["subject_area"]:
            # save the section to a file with the grade level and subject area in the name using os
            os.makedirs(CURRENT_DIR / "temp", exist_ok=True)
            with open(CURRENT_DIR / "temp" / f"{metadata['grade_level'].replace(' ', '_')}-{metadata['subject_area'].replace(' ', '_')}.md", "w") as file:
                file.write(cleaned_content)
            print(f"Processed and saved section {batch_number} with grade level: {metadata['grade_level']}, subject area: {metadata['subject_area']}")
            return Section(content=cleaned_content, metadata=metadata)
        else:
            print(f"Warning: Missing metadata for section {batch_number}")
            print("Content preview:", cleaned_content[:200])
            return None
    except Exception as e:
        print(f"Error processing batch {batch_number}: {str(e)}")
        print("Content preview:", batch_content[:200])
        return None
    

def split_by_area_of_learning(markdown_content):
    # Split the content by the Area of Learning marker
    sections = markdown_content.split("## Area of Learning:")
    
    # Handle the first section (content before first "Area of Learning" if any)
    processed_sections = []
    if sections[0].strip():  # If there's content before the first marker
        processed_sections.append(sections[0].strip())
    
    # Process the rest of the sections, adding back the header
    for section in sections[1:]:
        if section.strip():
            processed_sections.append(f"## Area of Learning:{section}")
    
    return processed_sections


def clean_text_from_metadata(text):
    """Remove the metadata section from the text content."""
    # Split by the metadata section markers
    parts = text.split('---')
    if len(parts) >= 3:
        # Return everything after the metadata section
        return '---'.join(parts[2:]).strip()
    return text.strip()



load_dotenv()

# Initialize OpenAI client (make sure you have OPENAI_API_KEY in your environment variables)
client = OpenAI()

# Set up paths
CURRENT_DIR = Path(__file__).parent

test_pdf = CURRENT_DIR / "ex-pdf-med.pdf"
MAX_TOKENS = 8191  # text-embedding-3-large's maximum context length
tokenizer = OpenAITokenizerWrapper()

# --------------------------------------------------------------
# Extract the data into markdown
# --------------------------------------------------------------

converter = DocumentConverter()
result = converter.convert(test_pdf)
# save_markdown = result.document.save_as_markdown(filename=CURRENT_DIR / "ex-md")

# --------------------------------------------------------------
# Preprocessing the markdown
# --------------------------------------------------------------

# Replace the existing processing code with this
markdown = result.document.export_to_markdown()

# Split the markdown into sections by Area of Learning
sections = split_by_area_of_learning(markdown)
processed_sections = []

print(f"Found {len(sections)} Areas of Learning to process")

# Process sections in parallel
with ThreadPoolExecutor(max_workers=3) as executor:
    future_to_section = {
        executor.submit(process_markdown_batch, section, i + 1, len(sections)): i 
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


# --------------------------------------------------------------
# Create a LanceDB database and table
# --------------------------------------------------------------

# Create a LanceDB database
db = lancedb.connect("../data/lancedb")

# Get the OpenAI embedding function
embedding_function = get_registry().get("openai").create(name="text-embedding-3-small")

# Define the main Schema
class Chunks(LanceModel):
    text: str = embedding_function.SourceField()
    vector: Vector(embedding_function.ndims()) = embedding_function.VectorField()  # type: ignore
    metadata: ChunkMetadata


# --------------------------------------------------------------
# Load the table
# --------------------------------------------------------------

table_name = "testing123"
try:
    table = db.create_table(table_name, schema=Chunks)
    print("Created new table")
except Exception:
    table = db.open_table(table_name)
    print("Using existing table")


# --------------------------------------------------------------
# Apply hybrid chunking
# --------------------------------------------------------------

chunker = HybridChunker(
    tokenizer=tokenizer,
    max_tokens=MAX_TOKENS // 4,  # Smaller chunks for more precise retrieval
    merge_peers=True,  # Merge related content
)

# Use Path.glob() to iterate over markdown files
for file in (CURRENT_DIR / "temp").glob("*.md"):
    print(f"Processing file: {file}")
    # Convert to Docling document
    conversion_result = converter.convert(file)
    dl_doc = conversion_result.document

    # Create chunks with their corresponding section metadata
    chunks = list(chunker.chunk(dl_doc=dl_doc))
    print(f"Found {len(chunks)} chunks in {file.name}")
    processed_chunks = []

    for chunk in chunks:

        grade_level = file.stem.split("-")[0].replace("_", " ")
        section_type = chunk.meta.headings[0] if chunk.meta and chunk.meta.headings else None
        subject_area = file.stem.split("-")[1].replace("_", " ")

        print("chunks[0]", chunks[0].meta.headings[0])
        print("chunks[0]", chunks[0].text)

        
        # Find the metadata from the filename
        metadata = {
            "grade_level": grade_level,
            "section_type": section_type,
            "subject_area": subject_area,
        }

        # TODO: Find a way to search on metadata and then remove the combined text so we can just use chunk.text
        combined_text = f"{grade_level} {subject_area} {section_type}: \n{chunk.text}"

        print("combined_text", combined_text)
        
        # Add the chunk and metadata to the processed chunks list
        processed_chunks.append({
            "text": combined_text,
            "metadata": metadata
        })


        print("processed_chunks[0]", processed_chunks[0])

    # Add the processed chunks to the database
    if processed_chunks:
        table.add(processed_chunks)
        print(f"Added {len(processed_chunks)} chunks to database from {file.name}")
    else:
        print(f"No chunks processed from {file.name}")


# --------------------------------------------------------------
# Search the database
# --------------------------------------------------------------


# search_result = table.search(query="What are the Big Ideas for grade 1 physical ed?", query_type="hybrid").limit(5)

# search_result.to_pandas()
# search_result.to_pandas().iloc[0]['metadata']
# search_result.to_pandas().iloc[0]['text']
