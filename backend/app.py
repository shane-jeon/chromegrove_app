from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, create_user_in_db, User, StudioClass

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
    name = data.get('name')
    if not clerk_user_id or not role:
        return jsonify({"success": False, "error": "Missing required fields: clerk_user_id and role"}), 400
    try:
        user = create_user_in_db(clerk_user_id, email, role, name)
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

@app.route('/api/studio-classes/create', methods=['POST'])
def create_studio_class():
    data = request.get_json()
    try:
        studio_class = StudioClass(
            class_name=data['class_name'],
            description=data.get('description'),
            start_time=data['start_time'],
            duration=data['duration'],
            instructor_id=data['instructor_id'],
            max_capacity=data['max_capacity'],
            requirements=data.get('requirements'),
            recommended_attire=data.get('recommended_attire'),
            recurrence_pattern=data.get('recurrence_pattern'),
        )
        db.session.add(studio_class)
        db.session.commit()
        return jsonify({"success": True, "studio_class": {
            "id": studio_class.id,
            "class_name": studio_class.class_name,
            "description": studio_class.description,
            "start_time": str(studio_class.start_time),
            "duration": studio_class.duration,
            "instructor_id": studio_class.instructor_id,
            "max_capacity": studio_class.max_capacity,
            "requirements": studio_class.requirements,
            "recommended_attire": studio_class.recommended_attire,
            "recurrence_pattern": studio_class.recurrence_pattern,
        }}), 201
    except Exception as e:
        db.session.rollback()
        print("Error creating studio class:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/studio-classes/list', methods=['GET'])
def list_studio_classes():
    classes = StudioClass.query.all()
    return jsonify({
        "classes": [
            {
                "id": c.id,
                "class_name": c.class_name,
                "description": c.description,
                "start_time": str(c.start_time),
                "duration": c.duration,
                "instructor_id": c.instructor_id,
                "max_capacity": c.max_capacity,
                "requirements": c.requirements,
                "recommended_attire": c.recommended_attire,
                "recurrence_pattern": c.recurrence_pattern,
            }
            for c in classes
        ]
    })

if __name__ == '__main__':
    app.run(debug=True)
