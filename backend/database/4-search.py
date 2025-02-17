import lancedb
import pandas as pd

class DocumentSearch:
    """Class to handle document search operations in LanceDB."""
    
    def __init__(self, db_path: str = "data/lancedb", table_name: str = "docling"):
        """Initialize the search interface with database connection.
        
        Args:
            db_path: Path to LanceDB database
            table_name: Name of the table to search
        """
        self.db = lancedb.connect(db_path)
        self.table_name = table_name
        self.table = self.db.open_table(table_name)

    def search(self, query: str, limit: int = 5) -> pd.DataFrame:
        """Search for documents matching the query.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            
        Returns:
            DataFrame containing search results
        """
        search_query = self.table.search(query=query).limit(limit)
                
        return search_query.to_pandas()
    

# --------------------------------------------------------------
# USAGE: Search
# --------------------------------------------------------------

def main():
    searcher = DocumentSearch(table_name="my_custom_table")
    
    # Basic search
    results = searcher.search("pdf", 2)
    print("Search Results:")
    print(results)

if __name__ == "__main__":
    main()
