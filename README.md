# BC Lesson Planner

A web application that generates lesson plans for BC curriculum using AI assistance. Built with React frontend and Flask backend.

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

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- pgAdmin: http://localhost:5050

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.