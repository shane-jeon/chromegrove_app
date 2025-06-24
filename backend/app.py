from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, create_user_in_db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app)

@app.route('/api/ping')
def ping():
    return jsonify({"message": "pong"})

@app.route('/api/users/create', methods=['POST'])
def create_user_route():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON body"}), 400
    clerk_user_id = data.get('clerk_user_id')
    email = data.get('email')
    role = data.get('role')
    if not clerk_user_id or not role:
        return jsonify({"error": "Missing required fields: clerk_user_id and role"}), 400
    try:
        user = create_user_in_db(clerk_user_id, email, role)
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "clerk_user_id": user.clerk_user_id,
                "email": user.email,
                "role": user.role
            }
        }), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": "Failed to create user", "details": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
