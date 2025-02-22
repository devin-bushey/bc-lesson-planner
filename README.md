# BC Lesson Planner

An AI Agent that helps Teachers in British Columbia generate and improve their lesson plans

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Flask + Python
- Database: PostgreSQL
- Containerization: Docker
- AI: OpenAI GPT-4

## Prerequisites

- Docker
- Node.js (v18+)
- Python (v3.9+)
- OpenAI API key

## Setup

1. Clone the repository:
```sh
git clone https://github.com/yourusername/bc-lesson-planner.git
cd bc-lesson-planner
```

2. Create `.env` file in the root AND backend directories:
```sh
cp .env.example .env
```

3. Build and start the Docker containers:
```sh
docker compose up -d
```

## Development

### Running the Backend

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
cd backend/database/vectordb
python process_curriculum.py
```

### Testing the Vector Database Data

```sh
cd backend/database/vectordb
streamlit run chat.py
```

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
