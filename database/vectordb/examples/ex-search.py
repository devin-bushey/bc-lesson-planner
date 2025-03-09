import lancedb

# --------------------------------------------------------------
# Connect to the database
# --------------------------------------------------------------

uri = "../data/lancedb"
db = lancedb.connect(uri)


# --------------------------------------------------------------
# Load the table
# --------------------------------------------------------------

table = db.open_table("bc_curriculum_website")

# --------------------------------------------------------------
# Load the table
# --------------------------------------------------------------
table.to_pandas()
table.count_rows()

print("table: ", table.to_pandas())
print("table count: ", table.count_rows())


# --------------------------------------------------------------
# Search the table
# --------------------------------------------------------------

result = table.search(query="kindergarten big ideas").limit(5)
result.to_pandas()

first_row = result.to_pandas().iloc[1]
print(first_row["text"])


