# BC Lesson Planner

An AI Agent that helps Teachers in British Columbia generate and improve their lesson plans

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Flask + Python
- Database: PostgreSQL
- Containerization: Docker
- AI: OpenAI GPT-4
- Authentication: Auth0

## Prerequisites

- Docker
- Node.js (v18+)
- Python (v3.9+)
- OpenAI API key
- Auth0 account and application setup

## Setup

1. Clone the repository:
```sh
git clone https://github.com/yourusername/bc-lesson-planner.git
cd bc-lesson-planner
```

2. Set up Auth0:
   - Create a new Auth0 application (Regular Web Application)
   - Set Application Auth to None under Credentials (TODO: Use Client Secret Post)
   - Configure the following URLs in your Auth0 application settings:
     - Allowed Callback URLs: `http://localhost:5173`
     - Allowed Logout URLs: `http://localhost:5173/login`
     - Allowed Web Origins: `http://localhost:5173`
   - Note down your Auth0 Domain, Client ID, and Client Secret

3. Copy the `.env.example` file to a new file called `.env` in the root and frontend directories:
```sh
cp .env.example .env
cp ./frontend/.env.example ./frontend/.env
```

4. Build and start the Docker containers:
```sh
docker compose up -d
```

## Development

### Running the Backend

On a mac:
```sh
brew install python
cd backend
python3 -m venv .venv && source .venv/bin/activate 
pip install -r requirements.txt
```

```sh
cd backend
flask --app app/app.py --debug run
```

### Running the Frontend

```sh
cd frontend
npm run dev
```

### Loading the Vector Database with BC Curriculum Data

```sh
cd database
python3 -m venv .venv && source .venv/bin/activate 
pip install -r requirements.txt
python3 process_curriculum.py
```

### Testing the Vector Database Data

```sh
cd database
streamlit run ./vectordb/chat.py 
```

SCP vectordb to render:

Add ssh key: https://render.com/docs/ssh-keys
Scp zip file to disk: https://render.com/docs/disks#scp

```sh
cd database/vectordb/data/lancedb
zip -r bc_curriculum.zip .

# Copying a file from your local machine to your service
scp -s bc_curriculum.zip YOUR_SERVICE@ssh.YOUR_REGION.render.com:/app/database/vectordb/data/lancedb
```

On render shell:
```sh
cd /app/database/vectordb/data/lancedb
sudo apt-get install unzip
unzip bc_curriculum.zip
```

### Environment Variables

The application uses several environment variables for configuration:

- **Database Configuration**:
  - `POSTGRES_DB`: PostgreSQL database name
  - `POSTGRES_USER`: PostgreSQL username
  - `POSTGRES_PASSWORD`: PostgreSQL password
  - `POSTGRES_HOST`: PostgreSQL host
  - `POSTGRES_PORT`: PostgreSQL port

- **Vector Database**:
  - `LANCEDB_PATH`: Path to the LanceDB vector database
    - For local development: `database/vectordb/data/lancedb`
    - For production: Set to your desired storage location on render.com or other hosting service

- **Authentication**:
  - `AUTH0_DOMAIN`: Auth0 domain
  - `AUTH0_CLIENT_ID`: Auth0 client ID
  - `AUTH0_CLIENT_SECRET`: Auth0 client secret

- **OpenAI API**:
  - `OPENAI_API_KEY`: Your OpenAI API key

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- pgAdmin: http://localhost:5050
- Chat app: http://localhost:8501/

## AI Agent Techniques

This application leverages advanced AI Agent techniques to assist teachers in generating and improving lesson plans. The techniques used are inspired by research and patterns from the following sources:

- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [AI Cookbook - Workflows](https://github.com/daveebbelaar/ai-cookbook/tree/main/patterns/workflows)

### Techniques Used

- **Prompt Chaining**: This pattern breaks down complex AI tasks into a sequence of smaller, more focused steps. Each step processes the output from the previous step, allowing for better control, validation, and reliability. For example, the `LessonPlanChain` class in `lesson_plan_chain.py` uses prompt chaining to analyze curriculum requirements, generate learning objectives, create activities, and design assessments.

- **Parallelization**: This technique runs multiple LLM calls concurrently to validate or analyze different aspects of a request simultaneously. In the `LessonPlanChain` class, parallel execution is used to generate learning objectives, create activities, and design assessments concurrently.

- **Routing**: This pattern directs different types of requests to specialized handlers, optimizing processing and maintaining a clean separation of concerns. The `LessonPlannerAgent` class in `lesson_planner_service.py` uses routing to handle different types of lesson planning tasks.

- **Orchestrator-Workers**: This pattern uses a central LLM to dynamically analyze tasks, coordinate specialized workers, and synthesize their results. The `LessonPlannerAgent` class acts as an orchestrator, coordinating the execution of various lesson planning tasks.

- **Retrieval-Augmented Generation (RAG)**: This application uses Retrieval-Augmented Generation (RAG) to enhance the AI's ability to generate accurate and contextually relevant lesson plans. RAG combines the power of large language models (LLMs) with a retrieval mechanism that fetches relevant information from a vector database.

- **Vector Database**: The vector database stores information about the BC curriculum, allowing the AI to retrieve specific curriculum details as needed. This ensures that the generated lesson plans are aligned with the curriculum requirements. 
For example, the `DatabaseManager` class in `db_manager.py` connects to the vector database and manages the curriculum data. The `LessonPlannerAgent` class retrieves curriculum context using the `_get_curriculum_context` method, which queries the vector database for relevant information.


## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
