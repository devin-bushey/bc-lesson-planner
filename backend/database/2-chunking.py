from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter
from dotenv import load_dotenv
from openai import OpenAI
from utils.tokenizer import OpenAITokenizerWrapper

load_dotenv()

# Initialize OpenAI client (make sure you have OPENAI_API_KEY in your environment variables)
client = OpenAI()


class DocumentChunker:
    def __init__(self, max_tokens: int = 8191):
        """Initialize the document chunker with configurable max tokens"""
        self.max_tokens = max_tokens
        self.tokenizer = OpenAITokenizerWrapper()
        self.chunker = HybridChunker(
            tokenizer=self.tokenizer,
            max_tokens=self.max_tokens,
            merge_peers=True,
        )

    def chunk_document(self, document) -> list:
        """
        Chunk a document into smaller pieces
        Args:
            document: The document to chunk
        Returns:
            list: List of document chunks
        """
        chunk_iter = self.chunker.chunk(dl_doc=document)
        return list(chunk_iter)

    def get_chunks_from_url(self, url: str) -> list:
        """
        Convert URL to document and chunk it
        Args:
            url: URL of the document to process
        Returns:
            list: List of document chunks
        """
        converter = DocumentConverter()
        result = converter.convert(url)
        if not result.document:
            return []
        return self.chunk_document(result.document)


# --------------------------------------------------------------
# USAGE: Extract the data and apply hybrid chunking
# --------------------------------------------------------------

def main():
    document_chunker = DocumentChunker()
    chunks = document_chunker.get_chunks_from_url("https://arxiv.org/pdf/2408.09869")

    print(chunks)

if __name__ == "__main__":
    main()




