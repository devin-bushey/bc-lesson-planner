from flask import Flask
from flask_cors import CORS
from controllers.lesson_plan_controller import init_routes
import psycopg2
import os

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-Profile"]
    }
})

# Initialize database connection
app.db_connection = psycopg2.connect(
    dbname=os.getenv("POSTGRES_DB"),
    user=os.getenv("POSTGRES_USER"),
    password=os.getenv("POSTGRES_PASSWORD"),
    host=os.getenv("POSTGRES_HOST"),
    port=os.getenv("POSTGRES_PORT")
)

# Initialize routes
init_routes(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)