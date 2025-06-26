from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, User, StudioClass, SlidingScaleOption
from datetime import datetime, timedelta

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
        user = User.create_account(clerk_user_id, email, role, name)
        # Print inserted user (now includes role-specific data)
        print("Inserted User:", user)
        return jsonify({
            "success": True,
            "user": user.get_user_profile() | {"type": user.discriminator}
        }), 201
    except Exception as e:
        print("Error creating user:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/studio-classes/create', methods=['POST'])
def create_studio_class():
    data = request.get_json()
    try:
        # Always parse start_time as a datetime object
        try:
            start_time = datetime.fromisoformat(data['start_time'])
        except Exception:
            return jsonify({"success": False, "error": "Invalid start_time format. Must be ISO 8601 (YYYY-MM-DDTHH:MM:SS)"}), 400
        studio_class = StudioClass(
            class_name=data['class_name'],
            description=data.get('description'),
            start_time=start_time,
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
            "start_time": studio_class.start_time.isoformat(),
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
    expanded_classes = []
    now = datetime.now()
    three_months_later = now + timedelta(days=90)

    for c in classes:
        start = c.start_time
        recurrence = (c.recurrence_pattern or '').lower()
        enrolled_count = c.enrolled_students.count() if hasattr(c, 'enrolled_students') else 0
        instructor_name = c.instructor.name if c.instructor and hasattr(c.instructor, 'name') else str(c.instructor_id)
        if recurrence in ['weekly', 'bi-weekly', 'monthly']:
            delta = None
            if recurrence == 'weekly':
                delta = timedelta(weeks=1)
            elif recurrence == 'bi-weekly':
                delta = timedelta(weeks=2)
            elif recurrence == 'monthly':
                # For monthly, add 1 month at a time (handle month overflow)
                def add_month(dt):
                    month = dt.month + 1
                    year = dt.year
                    if month > 12:
                        month = 1
                        year += 1
                    day = min(dt.day, [31,29 if year%4==0 and (year%100!=0 or year%400==0) else 28,31,30,31,30,31,31,30,31,30,31][month-1])
                    return dt.replace(year=year, month=month, day=day)
                next_time = start
                while next_time <= three_months_later:
                    expanded_classes.append({
                        "instance_id": f"{c.id}_{next_time.strftime('%Y%m%d%H%M')}",
                        "template_id": c.id,
                        "class_name": c.class_name,
                        "description": c.description,
                        "start_time": str(next_time),
                        "duration": c.duration,
                        "instructor_id": c.instructor_id,
                        "instructor_name": instructor_name,
                        "max_capacity": c.max_capacity,
                        "requirements": c.requirements,
                        "recommended_attire": c.recommended_attire,
                        "recurrence_pattern": c.recurrence_pattern,
                        "enrolled_count": enrolled_count,
                    })
                    # Add 1 month
                    try:
                        next_time = add_month(next_time)
                    except Exception:
                        break
                continue
            # For weekly/bi-weekly
            next_time = start
            while next_time <= three_months_later:
                expanded_classes.append({
                    "instance_id": f"{c.id}_{next_time.strftime('%Y%m%d%H%M')}",
                    "template_id": c.id,
                    "class_name": c.class_name,
                    "description": c.description,
                    "start_time": str(next_time),
                    "duration": c.duration,
                    "instructor_id": c.instructor_id,
                    "instructor_name": instructor_name,
                    "max_capacity": c.max_capacity,
                    "requirements": c.requirements,
                    "recommended_attire": c.recommended_attire,
                    "recurrence_pattern": c.recurrence_pattern,
                    "enrolled_count": enrolled_count,
                })
                next_time += delta
        else:
            # Pop-up or non-recurring: just one instance
            expanded_classes.append({
                "instance_id": f"{c.id}_{start.strftime('%Y%m%d%H%M')}",
                "template_id": c.id,
                "class_name": c.class_name,
                "description": c.description,
                "start_time": str(start),
                "duration": c.duration,
                "instructor_id": c.instructor_id,
                "instructor_name": instructor_name,
                "max_capacity": c.max_capacity,
                "requirements": c.requirements,
                "recommended_attire": c.recommended_attire,
                "recurrence_pattern": c.recurrence_pattern,
                "enrolled_count": enrolled_count,
            })
    return jsonify({"classes": expanded_classes})

@app.route('/api/instructors/search')
def search_instructors():
    query = request.args.get('query', '')
    q = User.query.filter(User.discriminator == 'staff')
    if query:
        q = q.filter(
            (User.name.ilike(f"%{query}%")) |
            (User.email.ilike(f"%{query}%"))
        )
    instructors = q.all()
    return jsonify({
        "instructors": [
            {"id": u.id, "name": u.name, "email": u.email}
            for u in instructors
        ]
    })

@app.route('/api/users/by-clerk-id')
def get_user_by_clerk_id():
    clerk_user_id = request.args.get('clerk_user_id')
    if not clerk_user_id:
        return jsonify({"success": False, "error": "Missing clerk_user_id"}), 400
    user = User.query.filter_by(clerk_user_id=clerk_user_id).first()
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
    return jsonify({
        "success": True,
        "user": {
            "id": user.id,
            "clerk_user_id": user.clerk_user_id,
            "email": user.email,
            "role": user.role,
            "type": user.discriminator,
            "name": user.name
        }
    })

@app.route('/api/studio-classes/book', methods=['POST'])
def book_studio_class():
    data = request.get_json()
    student_id = data.get('student_id')
    clerk_user_id = data.get('clerk_user_id')
    studio_class_id = data.get('studio_class_id')
    instance_id = data.get('instance_id')

    # Find student
    student = None
    if student_id:
        student = User.query.filter_by(id=student_id, discriminator='student').first()
    elif clerk_user_id:
        student = User.query.filter_by(clerk_user_id=clerk_user_id, discriminator='student').first()
    if not student:
        return jsonify({"success": False, "error": "Student not found"}), 404

    # Find class
    studio_class = None
    if studio_class_id:
        studio_class = StudioClass.query.filter_by(id=studio_class_id).first()
    elif instance_id:
        # instance_id format: "{class_id}_{yyyymmddHHMM}", so split by '_'
        try:
            class_id = int(instance_id.split('_')[0])
            studio_class = StudioClass.query.filter_by(id=class_id).first()
        except Exception:
            return jsonify({"success": False, "error": "Invalid instance_id format"}), 400
    if not studio_class:
        return jsonify({"success": False, "error": "Class not found"}), 404

    # Check if class is full
    if studio_class.enrolled_students.count() >= studio_class.max_capacity:
        return jsonify({"success": False, "error": "Class is full"}), 400

    # Check if already booked
    if student in studio_class.enrolled_students:
        return jsonify({"success": False, "error": "Already booked for this class"}), 400

    # Enroll student
    studio_class.enrolled_students.append(student)
    db.session.commit()
    return jsonify({"success": True, "message": "Class booked successfully"})

if __name__ == '__main__':
    app.run(debug=True)
