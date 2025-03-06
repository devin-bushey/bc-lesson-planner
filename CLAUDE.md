# BC Lesson Planner Project Guidelines

## Commands
- **Frontend Dev**: `cd frontend && npm run dev`
- **Frontend Build**: `cd frontend && npm run build`
- **Frontend Lint**: `cd frontend && npm run lint`
- **Backend Dev**: `cd backend && flask --app app/app.py --debug run`
- **Vector DB Process**: `cd database && python3 ./vectordb/process_curriculum.py`
- **Start All Services**: `docker compose up -d`

## Code Style Guidelines
- **TypeScript**: Use explicit types for props, state, and function params
- **React Components**: Define as `React.FC<PropType>` with proper interfaces
- **CSS**: Use component-specific `.module.css` files
- **Python**: Use type hints for parameters and return values
- **Naming**: PascalCase for components/classes, camelCase for JS variables, snake_case for Python
- **Imports**: Use path aliases: @features, @shared, @core, @assets
- **Feature Structure**: Organize by feature (auth, lessonPlans, reportCards)
- **Error Handling**: try/catch with user feedback (frontend), try/except with logging (backend)
- **API Services**: Centralize in service modules, use async/await pattern
- **Authentication**: Use Auth middleware consistently across routes

Follow ESLint/TypeScript configs. Use logger utility for backend logging.