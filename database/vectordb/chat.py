import streamlit as st
import lancedb
import os
from openai import OpenAI
from dotenv import load_dotenv
import re 

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI()

# Get database path from environment variable or use default
LANCEDB_PATH = "vectordb/data/lancedb"

# Initialize LanceDB connection
@st.cache_resource
def init_db():
    """Initialize database connection.

    Returns:
        LanceDB table object or None if database doesn't exist
    """
    try:
        # Ensure the directory exists
        os.makedirs(os.path.dirname(LANCEDB_PATH), exist_ok=True)
        
        db = lancedb.connect(LANCEDB_PATH)
        return db.open_table("testing123")
    except Exception as e:
        st.error(f"Error connecting to database: {str(e)}")
        return None


def get_context(query: str, table, num_results: int = 3) -> str:
    """Search the database for relevant context.

    Args:
        query: User's question
        table: LanceDB table object
        num_results: Number of results to return

    Returns:
        str: Concatenated context from relevant chunks with source information
    """
    if table is None:
        return "Database is not available. Please check your configuration."
        
    try:
        results = table.search(query).limit(num_results).to_pandas()
        contexts = []

        for _, row in results.iterrows():
            # Extract metadata
            metadata = row.get("metadata", {})
            grade_level = metadata.get("grade_level", "Unknown Grade")
            subject_area = metadata.get("subject_area", "Unknown Subject")
            
            # Format the content block
            content_block = {
                "text": row["text"].strip(),
                "metadata": {
                    "grade_level": grade_level,
                    "subject_area": subject_area
                }
            }
            
            # Create formatted text with metadata
            formatted_text = f"{content_block['text']}\n---\nGrade Level: {content_block['metadata']['grade_level']}\nSubject Area: {content_block['metadata']['subject_area']}"
            contexts.append(formatted_text)

        # Join with clear separation
        return "\n\n---\n\n".join(contexts)
    except Exception as e:
        return f"Error searching database: {str(e)}"


def get_chat_response(messages, context: str) -> str:
    """Get streaming response from OpenAI API.

    Args:
        messages: Chat history
        context: Retrieved context from database

    Returns:
        str: Model's response
    """
    system_prompt = f"""You are a helpful assistant that answers questions based on the provided context.
    Use only the information from the context to answer questions. If you're unsure or the context
    doesn't contain the relevant information, say so.
    
    Context:
    {context}
    """

    messages_with_context = [{"role": "system", "content": system_prompt}, *messages]

    # Create the streaming response
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=messages_with_context,
        temperature=0.7,
        stream=True,
    )

    # Use Streamlit's built-in streaming capability
    response = st.write_stream(stream)
    return response


# Initialize Streamlit app
st.title("📚 BC Curriculum Q&A")

# Initialize session state for chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Initialize database connection
table = init_db()

# Display chat messages
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])


# Chat input
if prompt := st.chat_input("Ask a question"):
    # Display user message
    with st.chat_message("user"):
        st.markdown(prompt)

    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Get relevant context
    with st.status("Searching document...", expanded=False) as status:
        context = get_context(prompt, table)
        st.markdown(
            """
            <style>
            .search-result {
                margin: 10px 0;
                padding: 10px;
                border-radius: 4px;
                background-color: #f0f2f6;
            }
            .search-result summary {
                cursor: pointer;
                color: #0f52ba;
                font-weight: 500;
            }
            .search-result summary:hover {
                color: #1e90ff;
            }
            .metadata {
                font-size: 0.9em;
                color: #666;
                font-style: italic;
            }
            </style>
        """,
            unsafe_allow_html=True,
        )

        st.write("Found relevant sections:")

        print("context: ", context)

        
        for chunk in context.split("\n\n---\n\n"):
            # Split into text and metadata parts
            parts = chunk.split("\n---\n")
            
            if len(parts) != 2:
                continue
                
            text, metadata = parts
            
            # Extract grade level and subject area from metadata
            grade_match = re.search(r"Grade Level: (.+)", metadata)
            subject_match = re.search(r"Subject Area: (.+)", metadata)
            section_type_match = re.search(r"Section Type: (.+)", metadata)
            
            grade_level = grade_match.group(1) if grade_match else "Unknown Grade"
            subject_area = subject_match.group(1) if subject_match else "Unknown Subject"
            section_type = section_type_match.group(1) if section_type_match else "Unknown Section Type"

            st.markdown(
                f"""
                <div class="search-result" style="color: black;">
                    <details>
                        <summary>Curriculum Section</summary>
                        <div class="metadata">
                            <p>Grade Level: {grade_level}</p>
                            <p>Subject Area: {subject_area}</p>
                            <p>Section Type: {section_type}</p>
                        </div>
                    </details>
                </div>
            """,
                unsafe_allow_html=True,
            )


    # Display assistant response first
    with st.chat_message("assistant"):
        # Get model response with streaming
        response = get_chat_response(st.session_state.messages, context)

    # Add assistant response to chat history
    st.session_state.messages.append({"role": "assistant", "content": response})


# --------------------------------------------------------------
# USAGE: Chatbot
# --------------------------------------------------------------

# $ streamlit run ./vectordb/chat.py 