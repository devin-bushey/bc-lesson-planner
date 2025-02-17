from typing import List, Dict, Any
import lancedb
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv
from lancedb.embeddings import get_registry
from lancedb.pydantic import LanceModel, Vector, pa
from openai import OpenAI
from utils.tokenizer import OpenAITokenizerWrapper

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

    def process_document(self, document_url: str, table_name: str = "docling") -> None:
        """Process a document from URL through conversion, chunking, and embedding."""
        chunks = self._convert_and_chunk_document(document_url)
        processed_chunks = self._prepare_chunks(chunks)
        self._create_and_populate_table(processed_chunks, table_name)

    def _convert_and_chunk_document(self, document_url: str) -> List[Any]:
        """Convert document and split into chunks."""
        converter = DocumentConverter()
        result = converter.convert(document_url)
        
        chunker = HybridChunker(
            tokenizer=self.tokenizer,
            max_tokens=self.max_tokens,
            merge_peers=True,
        )
        return list(chunker.chunk(dl_doc=result.document))

    def _prepare_chunks(self, chunks: List[Any]) -> List[Dict]:
        """Transform chunks into the format required for the database."""
        return [
            {
                "text": chunk.text,
                "metadata": {
                    "filename": chunk.meta.origin.filename,
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
                    "title": chunk.meta.headings[0] if chunk.meta.headings else None,
                },
            }
            for chunk in chunks
        ]

    def _create_and_populate_table(self, processed_chunks: List[Dict], table_name: str) -> None:
        """Create a new table and add the processed chunks."""
        table = self.db.create_table(table_name, schema=Chunks, mode="overwrite")
        # table.create_index(index_type="IVF_FLAT")
        table.add(processed_chunks)

    def get_table_stats(self, table_name: str = "docling") -> Dict:
        """Get basic statistics about the table."""
        table = self.db.open_table(table_name)
        return {
            "row_count": table.count_rows(),
            "dataframe": table.to_pandas()
        }

# --------------------------------------------------------------
# USAGE: Embedding into LanceDB
# --------------------------------------------------------------

def main():
    """Example usage of the DocumentEmbedder class."""
    embedder = DocumentEmbedder()
    embedder.process_document("https://arxiv.org/pdf/2408.09869")
    stats = embedder.get_table_stats()
    print(f"Processed {stats['row_count']} chunks")

if __name__ == "__main__":
    main()