#!/bin/bash

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/init.sql

psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "INSERT INTO curriculum (data) SELECT jsonb_pretty(to_jsonb(json_data)) FROM json_table('/knowledge-base/bc_curriculum.json');"
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "INSERT INTO lesson_templates (data) SELECT jsonb_pretty(to_jsonb(json_data)) FROM json_table('/knowledge-base/lesson_templates.json');"