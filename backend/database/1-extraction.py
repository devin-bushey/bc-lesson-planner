from docling.document_converter import DocumentConverter
from utils.sitemap import get_sitemap_urls
from typing import List, Dict, Optional

class DocumentExtractor:
    def __init__(self):
        self.converter = DocumentConverter()

    def extract_from_pdf(self, pdf_url: str) -> Dict:
        """
        Extract content from a PDF URL and return as dictionary
        """
        result = self.converter.convert(pdf_url)
        if not result.document:
            return {}
        return result.document.export_to_dict()

    def extract_from_pdf_as_markdown(self, pdf_url: str) -> str:
        """
        Extract content from a PDF URL and return as markdown
        """
        result = self.converter.convert(pdf_url)
        if not result.document:
            return ""
        return result.document.export_to_markdown()

    def extract_from_html(self, html_url: str) -> str:
        """
        Extract content from an HTML URL and return as markdown
        """
        result = self.converter.convert(html_url)
        if not result.document:
            return ""
        return result.document.export_to_markdown()

    def extract_from_sitemap(self, base_url: str) -> List[Dict]:
        """
        Extract content from all pages in a sitemap
        """
        sitemap_urls = get_sitemap_urls(base_url)
        conv_results_iter = self.converter.convert_all(sitemap_urls)
        
        documents = []
        for result in conv_results_iter:
            if result.document:
                documents.append(result.document)
        return documents

# --------------------------------------------------------------
# USAGE: Extract the data
# --------------------------------------------------------------

def main():
    extractor = DocumentExtractor()

    pdf_content = extractor.extract_from_pdf_as_markdown("https://arxiv.org/pdf/2408.09869")
    print("PDF Content:", pdf_content)

    # html_content = extractor.extract_from_html("https://ds4sd.github.io/docling/")
    # print("HTML Content:", html_content)

    # documents = extractor.extract_from_sitemap("https://ds4sd.github.io/docling/")
    # print(f"Found {len(documents)} documents from sitemap")

if __name__ == "__main__":
    main()
