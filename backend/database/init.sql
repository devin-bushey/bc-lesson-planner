-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS curriculum (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_templates (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lesson_plans (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lesson_plans_grade_subject ON lesson_plans(grade_level, subject);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_date ON lesson_plans(date DESC);

-- -- Insert default curriculum if not exists
INSERT INTO curriculum (id, data)
VALUES (1, '{"elementary": {}}')
ON CONFLICT (id) DO NOTHING;

-- Insert default lesson template if not exists
INSERT INTO lesson_templates (id, data)
VALUES (1, '[]')
ON CONFLICT (id) DO NOTHING;