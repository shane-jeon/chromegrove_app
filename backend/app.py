from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, create_user_in_db, User

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
    print("Received data:", data)  # Log incoming payload

    if not data:
        return jsonify({"success": False, "error": "Missing JSON body"}), 400
    clerk_user_id = data.get('clerk_user_id')
    email = data.get('email')
    role = data.get('role')
    if not clerk_user_id or not role:
        return jsonify({"success": False, "error": "Missing required fields: clerk_user_id and role"}), 400
    try:
        user = create_user_in_db(clerk_user_id, email, role)
        # Print inserted user (now includes role-specific data)
        print("Inserted User:", user)
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "clerk_user_id": user.clerk_user_id,
                "email": user.email,
                "role": user.role,
                "type": user.discriminator
            }
        }), 201
    except Exception as e:
        print("Error creating user:", e)
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
