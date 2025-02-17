from flask import Flask
from flask_cors import CORS
from controllers.lesson_plan_controller import init_routes

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Initialize routes
init_routes(app)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)