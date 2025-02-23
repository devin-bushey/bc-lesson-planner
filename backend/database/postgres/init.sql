-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS lesson_templates (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_plans (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    grade_level VARCHAR(50) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth0_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    picture VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lesson_templates_data ON lesson_templates USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_grade_subject ON lesson_plans(grade_level, subject);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_date ON lesson_plans(date DESC);
CREATE INDEX IF NOT EXISTS idx_users_auth0_id ON users(auth0_id);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updating timestamps
CREATE TRIGGER update_lesson_templates_timestamp
    BEFORE UPDATE ON lesson_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_lesson_plans_timestamp
    BEFORE UPDATE ON lesson_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Load initial data from JSON files

\set templates `cat '/knowledge-base/lesson_templates.json'`
INSERT INTO lesson_templates (id, data)
SELECT 1, :'templates'::jsonb
ON CONFLICT (id) DO UPDATE 
SET data = EXCLUDED.data,
    updated_at = CURRENT_TIMESTAMP;

-- $ docker exec -it bc-lesson-planner-db-1 psql -U user -d mydatabase