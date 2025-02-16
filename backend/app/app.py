from flask import Flask, request, jsonify
from flask_cors import CORS

from lesson_planner import LessonPlannerAgent
import asyncio

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

@app.route('/generate-plan', methods=['POST'])
def generate_plan():
    data = request.get_json()
    grade = data.get('grade')
    subject = data.get('subject')

    planner = LessonPlannerAgent(grade, subject)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    plan = loop.run_until_complete(planner.generate_daily_plan())

    return jsonify(plan)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)