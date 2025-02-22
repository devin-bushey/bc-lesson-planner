from typing import List, Dict, Any
import lancedb
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv
from lancedb.embeddings import get_registry
from lancedb.pydantic import LanceModel, Vector, pa
from openai import OpenAI
from utils.tokenizer import OpenAITokenizerWrapper
import argparse
from utils.sitemap import get_sitemap_urls

# Get the OpenAI embedding function
embedding_func = get_registry().get("openai").create(name="text-embedding-3-large")

class ChunkMetadata(LanceModel):
    """Metadata schema for document chunks.
    Fields must be in alphabetical order (Pydantic requirement)."""
    filename: str | None
    page_numbers: List[int] | None
    title: str | None

class Chunks(LanceModel):
    """Schema for document chunks with embeddings."""
    text: str = embedding_func.SourceField()
    vector: Vector(embedding_func.ndims()) = embedding_func.VectorField()  # type: ignore
    metadata: ChunkMetadata

class DocumentEmbedder:
    def __init__(self, db_path: str = "data/lancedb"):
        load_dotenv()
        self.client = OpenAI()
        self.tokenizer = OpenAITokenizerWrapper()
        self.max_tokens = 8191  # text-embedding-3-large's maximum context length
        self.db_path = db_path
        self.db = lancedb.connect(db_path)

    def extract_from_sitemap(self, base_url: str) -> List[Dict]:
        """
        Extract content from all pages in a sitemap
        """
        converter = DocumentConverter()
        sitemap_urls = get_sitemap_urls(base_url)
        conv_results_iter = converter.convert_all(sitemap_urls)
        
        documents = []
        for result in conv_results_iter:
            if result.document:
                documents.append(result.document)
        return documents

    def process_document(self, document_url: str, table_name: str = "docling", chunk_size: int = 1000) -> None:
        """Process a document from URL through conversion, chunking, and embedding."""
        try:
            chunks = self._convert_and_chunk_document(document_url, chunk_size)
            if not chunks:
                raise ValueError("No chunks were generated from the document")
            
            processed_chunks = self._prepare_chunks(chunks, document_url)
            if not processed_chunks:
                raise ValueError("No processed chunks were generated")
            
            self._create_and_populate_table(processed_chunks, table_name)
        except Exception as e:
            print(f"Error in process_document: {str(e)}")
            print(f"Document URL: {document_url}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    def process_source(self, url: str, source_type: str, table_name: str = "docling", chunk_size: int = 1000) -> Dict:
        """Process a document source based on its type (pdf, webpage, or website)."""
        try:
            if source_type == 'website':
                documents = self.extract_from_sitemap(url)
                
                # Process each document through the embedder
                for doc in documents:
                    markdown_content = doc.export_to_markdown()
                    self.process_document(markdown_content, table_name=table_name, chunk_size=chunk_size)
                
                stats = self.get_table_stats(table_name=table_name)
                return {
                    "pages": len(documents),
                    "chunks": stats["row_count"],
                    "table": table_name
                }
            else:
                # Process single document (PDF or webpage)
                self.process_document(url, table_name=table_name, chunk_size=chunk_size)
                stats = self.get_table_stats(table_name=table_name)
                return {
                    "pages": 1,
                    "chunks": stats["row_count"],
                    "table": table_name
                }
        except Exception as e:
            print(f"Error in process_source: {str(e)}")
            print(f"URL: {url}, Source Type: {source_type}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    def _convert_and_chunk_document(self, document_url: str, chunk_size: int = 1000) -> List[Any]:
        """Convert document and split into chunks."""
        try:
            print(f"Starting document conversion for: {document_url}")
            converter = DocumentConverter()
            result = converter.convert(document_url)
            
            if not result or not result.document:
                print(f"Document conversion failed or returned empty result for: {document_url}")
                print(f"Conversion result: {result}")
                raise ValueError("Document conversion failed")
            
            print(f"Document converted successfully. Creating chunker...")
            chunker = HybridChunker(
                tokenizer=self.tokenizer,
                max_tokens=min(chunk_size, self.max_tokens),  # Use the smaller of chunk_size or max_tokens
                merge_peers=True,
            )
            
            chunks = list(chunker.chunk(dl_doc=result.document))
            print(f"Generated {len(chunks)} chunks from document")
            
            if not chunks:
                print("Warning: No chunks were generated after successful conversion")
            
            return chunks
        except Exception as e:
            print(f"Error in _convert_and_chunk_document: {str(e)}")
            import traceback
            print(f"Conversion traceback: {traceback.format_exc()}")
            raise

    def _prepare_chunks(self, chunks: List[Any], url: str) -> List[Dict]:
        """Transform chunks into the format required for the database."""
        filename = extract_filename_from_url(url)
        processed_chunks = []
        
        for chunk in chunks:
            # Safely get title/heading
            title = None
            try:
                if chunk.meta.headings and len(chunk.meta.headings) > 0:
                    title = chunk.meta.headings[0]
            except (AttributeError, TypeError):
                pass

            processed_chunks.append({
                "text": chunk.text,
                "metadata": {
                    "filename": filename,
                    "title": title,
                },
            })
        
        return processed_chunks

    def _create_and_populate_table(self, processed_chunks: List[Dict], table_name: str) -> None:
        """Create a new table or append to existing table with the processed chunks."""
        if table_name in self.db.table_names():
            # Table exists, open and append
            table = self.db.open_table(table_name)
            table.add(processed_chunks)
        else:
            # Table doesn't exist, create new
            table = self.db.create_table(table_name, schema=Chunks, mode="create")
            table.add(processed_chunks)

    def get_table_stats(self, table_name: str = "docling") -> Dict:
        """Get basic statistics about the table."""
        table = self.db.open_table(table_name)
        return {
            "row_count": table.count_rows(),
            "dataframe": table.to_pandas()
        }

def extract_filename_from_url(url: str) -> str:
    """Extract filename from URL, removing file extensions and path components."""
    # Split the URL by '/' and get the last component
    filename = url.split('/')[-1]
    # Split by underscore and get the relevant part
    if '_' in filename:
        filename = filename.split('_')[1]
    # Remove file extension
    filename = filename.split('.')[0]
    return filename


# --------------------------------------------------------------
# USAGE: Embedding into LanceDB
#
# python embedding.py https://example.com --type website --table my_website_docs
# --------------------------------------------------------------

def main():
    """Example usage of the DocumentEmbedder class."""
    parser = argparse.ArgumentParser(description='Process documents and create embeddings.')
    parser.add_argument('url', type=str, help='URL of the document to process')
    parser.add_argument('--type', type=str, choices=['pdf', 'webpage', 'website'],
                      required=True, help='Type of document to process (pdf, webpage, or website)')
    parser.add_argument('--table', type=str, default='docling',
                      help='Name of the table to store embeddings (default: docling)')
    parser.add_argument('--chunk-size', type=int, default=1000,
                      help='Size of chunks for processing (default: 1000)')
    
    args = parser.parse_args()
    print(f"Processing {args.type} from: {args.url}")

    embedder = DocumentEmbedder()
    
    try:
        result = embedder.process_source(args.url, args.type, args.table, args.chunk_size)
        if result["pages"] > 1:
            print(f"Processed {result['pages']} pages with {result['chunks']} chunks in table '{result['table']}'")
        else:
            print(f"Processed {result['chunks']} chunks in table '{result['table']}'")
    except Exception as e:
        print(f"Error processing {args.type}: {str(e)}")

if __name__ == "__main__":
    main()

