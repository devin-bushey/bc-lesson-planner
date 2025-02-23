from flask import request, jsonify
from services.lesson_planner_service import LessonPlannerAgent
from functools import wraps
import asyncio
import json
from urllib.request import urlopen
from jose import jwt
from os import environ
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Auth0 configuration
AUTH0_DOMAIN = environ.get('AUTH0_DOMAIN')
AUTH0_AUDIENCE = environ.get('AUTH0_AUDIENCE')
ALGORITHMS = ["RS256"]

def get_token_auth_header():
    auth = request.headers.get("Authorization", None)
    if not auth:
        logger.debug("No Authorization header")
        return None

    parts = auth.split()
    logger.debug(f"Auth parts length: {len(parts)}")

    if parts[0].lower() != "bearer":
        logger.debug("No bearer token")
        return None
    elif len(parts) == 1:
        logger.debug("Token missing")
        return None
    elif len(parts) > 2:
        logger.debug("Invalid header format")
        return None

    token = parts[1]
    logger.debug("Token extracted successfully")
    return token

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_auth_header()
        if not token:
            return jsonify({"message": "Missing token"}), 401

        try:
            logger.debug(f"Fetching JWKS from Auth0: https://{AUTH0_DOMAIN}/.well-known/jwks.json")
            jsonurl = urlopen(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json")
            jwks = json.loads(jsonurl.read())
            unverified_header = jwt.get_unverified_header(token)
            logger.debug(f"Token header: {unverified_header}")
            
            rsa_key = {}
            for key in jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
                    break

            if rsa_key:
                try:
                    logger.debug("Attempting to decode token")
                    payload = jwt.decode(
                        token,
                        rsa_key,
                        algorithms=ALGORITHMS,
                        audience=AUTH0_AUDIENCE,
                        issuer=f"https://{AUTH0_DOMAIN}/",
                        options={
                            'verify_at_hash': False,
                        }
                    )
                    logger.debug(f"Token decoded successfully: {payload}")
                    return f(*args, **kwargs)
                except jwt.ExpiredSignatureError:
                    logger.error("Token expired")
                    return jsonify({"message": "Token has expired"}), 401
                except jwt.JWTClaimsError as e:
                    logger.error(f"JWT claims error: {str(e)}")
                    return jsonify({"message": f"Invalid claims: {str(e)}"}), 401
                except Exception as e:
                    logger.error(f"Token decode error: {str(e)}")
                    return jsonify({"message": f"Token decode error: {str(e)}"}), 401

            logger.error("No RSA key found")
            return jsonify({"message": "Unable to find appropriate key"}), 401
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return jsonify({"message": f"Authentication error: {str(e)}"}), 401

    return decorated

def init_routes(app):
    @app.route('/generate-plan', methods=['POST'])
    @requires_auth
    def generate_plan():
        try:
            data = request.get_json()
            grade = data.get('grade')
            subject = data.get('subject')

            planner = LessonPlannerAgent(grade, subject)
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            plan = loop.run_until_complete(planner.generate_daily_plan())

            return jsonify(plan)
        except Exception as e:
            logger.error(f"Error generating plan: {str(e)}")
            return jsonify({"message": str(e)}), 500

    @app.route('/lesson-plans', methods=['GET'])
    @requires_auth
    def get_lesson_plans():
        try:
            planner = LessonPlannerAgent(None, None)
            plans = planner.db_manager.get_all_lesson_plans()
            
            # Ensure each plan has a title, even if null
            for plan in plans:
                if 'title' not in plan:
                    plan['title'] = f"{plan['subject']} Lesson"
            
            return jsonify(plans)
        except Exception as e:
            logger.error(f"Error fetching lesson plans: {str(e)}")
            return jsonify({"message": str(e)}), 500

    @app.route('/lesson-plan/<int:plan_id>', methods=['GET'])
    @requires_auth
    def get_lesson_plan(plan_id):
        try:
            planner = LessonPlannerAgent(None, None)
            plan = planner.db_manager.get_lesson_plan_by_id(plan_id)
            if plan is None:
                return jsonify({'error': 'Lesson plan not found'}), 404
            
            # Ensure plan has a title
            if 'title' not in plan:
                plan['title'] = f"{plan['subject']} Lesson"
            
            return jsonify(plan)
        except Exception as e:
            logger.error(f"Error fetching lesson plan: {str(e)}")
            return jsonify({"message": str(e)}), 500

    @app.route('/lesson-plan/<int:plan_id>', methods=['PUT'])
    @requires_auth
    def update_lesson_plan(plan_id):
        try:
            data = request.get_json()
            planner = LessonPlannerAgent(None, None)
            updated_plan = planner.db_manager.update_lesson_plan(plan_id, data)
            if updated_plan is None:
                return jsonify({'error': 'Failed to update lesson plan'}), 404
            return jsonify(updated_plan)
        except Exception as e:
            logger.error(f"Error updating lesson plan: {str(e)}")
            return jsonify({"message": str(e)}), 500