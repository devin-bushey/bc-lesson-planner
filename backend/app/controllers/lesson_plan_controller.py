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

    @app.route('/lesson-plans', methods=['GET'])
    def get_lesson_plans():
        planner = LessonPlannerAgent(None, None)
        plans = planner.db_manager.get_all_lesson_plans()
        return jsonify(plans)

    @app.route('/lesson-plan/<int:plan_id>', methods=['GET'])
    def get_lesson_plan(plan_id):
        planner = LessonPlannerAgent(None, None)
        plan = planner.db_manager.get_lesson_plan_by_id(plan_id)
        if plan is None:
            return jsonify({'error': 'Lesson plan not found'}), 404
        return jsonify(plan)

    @app.route('/lesson-plan/<int:plan_id>', methods=['PUT'])
    def update_lesson_plan(plan_id):
        data = request.get_json()
        planner = LessonPlannerAgent(None, None)
        updated_plan = planner.db_manager.update_lesson_plan(plan_id, data)
        if updated_plan is None:
            return jsonify({'error': 'Failed to update lesson plan'}), 404
        return jsonify(updated_plan)