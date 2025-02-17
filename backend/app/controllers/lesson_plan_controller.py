from flask import request, jsonify
from services.lesson_planner_service import LessonPlannerAgent
import asyncio

def init_routes(app):
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