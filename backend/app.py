from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from models import db, User, StudioClass, SlidingScaleOption, Payment, ClassInstance, ClassEnrollment, Announcement, BulletinBoard
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import stripe

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)
CORS(app)

# Load environment variables from .env
load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")  # Set this in your Stripe dashboard

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
        
        # Add the instructor as assigned staff
        instructor = db.session.get(User, data['instructor_id'])
        if instructor and instructor.discriminator == 'staff':
            studio_class.add_staff_member(instructor)
        
        # Add the creator as a manager (if provided)
        creator_id = data.get('creator_id')
        if creator_id:
            creator = db.session.get(User, creator_id)
            if creator and creator.discriminator == 'management':
                studio_class.add_manager(creator)
        
        # Create class instances for this studio class
        create_class_instances(studio_class)
        
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

def create_class_instances(studio_class):
    """Create class instances for a studio class based on its recurrence pattern."""
    now = datetime.now()
    three_months_later = now + timedelta(days=90)
    
    start = studio_class.start_time
    recurrence = (studio_class.recurrence_pattern or '').lower()
    
    if recurrence in ['weekly', 'bi-weekly', 'monthly']:
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
            
            current_time = start
            while current_time <= three_months_later:
                # Create instance_id
                instance_id = f"{studio_class.id}_{current_time.strftime('%Y%m%d%H%M')}"
                
                # Calculate end_time
                end_time = current_time + timedelta(minutes=studio_class.duration)
                
                # Create class instance
                class_instance = ClassInstance(
                    instance_id=instance_id,
                    class_id=studio_class.id,
                    start_time=current_time,
                    end_time=end_time,
                    max_capacity=studio_class.max_capacity
                )
                db.session.add(class_instance)
                
                # Add one month
                try:
                    current_time = add_month(current_time)
                except Exception:
                    break
        else:
            # For weekly/bi-weekly
            current_time = start
            while current_time <= three_months_later:
                # Create instance_id
                instance_id = f"{studio_class.id}_{current_time.strftime('%Y%m%d%H%M')}"
                
                # Calculate end_time
                end_time = current_time + timedelta(minutes=studio_class.duration)
                
                # Create class instance
                class_instance = ClassInstance(
                    instance_id=instance_id,
                    class_id=studio_class.id,
                    start_time=current_time,
                    end_time=end_time,
                    max_capacity=studio_class.max_capacity
                )
                db.session.add(class_instance)
                
                current_time += delta
    else:
        # One-time class: just create one instance
        instance_id = f"{studio_class.id}_{start.strftime('%Y%m%d%H%M')}"
        end_time = start + timedelta(minutes=studio_class.duration)
        
        class_instance = ClassInstance(
            instance_id=instance_id,
            class_id=studio_class.id,
            start_time=start,
            end_time=end_time,
            max_capacity=studio_class.max_capacity
        )
        db.session.add(class_instance)
    
    db.session.commit()

@app.route('/api/studio-classes/list', methods=['GET'])
def list_studio_classes():
    # Get all class instances from the database
    class_instances = ClassInstance.query.filter(
        ClassInstance.start_time >= datetime.now()
    ).order_by(ClassInstance.start_time).all()
    
    expanded_classes = []
    
    for instance in class_instances:
        # Get the studio class details
        studio_class = instance.studio_class
        instructor_name = studio_class.instructor.name if studio_class.instructor else str(studio_class.instructor_id)
        
        expanded_classes.append({
            "instance_id": instance.instance_id,
            "template_id": instance.class_id,
            "class_name": studio_class.class_name,
            "description": studio_class.description,
            "start_time": str(instance.start_time),
            "duration": (instance.end_time - instance.start_time).total_seconds() / 60,  # Convert to minutes
            "instructor_id": studio_class.instructor_id,
            "instructor_name": instructor_name,
            "max_capacity": instance.max_capacity,
            "requirements": studio_class.requirements,
            "recommended_attire": studio_class.recommended_attire,
            "recurrence_pattern": studio_class.recurrence_pattern,
            "enrolled_count": instance.enrolled_count,
        })
    
    return jsonify({"classes": expanded_classes})

@app.route('/api/studio-classes/templates', methods=['GET'])
def get_studio_class_templates():
    """Get all studio class templates (not instances) for management."""
    studio_classes = StudioClass.query.all()
    
    templates = []
    for studio_class in studio_classes:
        instructor_name = studio_class.instructor.name if studio_class.instructor else str(studio_class.instructor_id)
        
        templates.append({
            "id": studio_class.id,
            "class_name": studio_class.class_name,
            "description": studio_class.description,
            "start_time": studio_class.start_time.isoformat(),
            "duration": studio_class.duration,
            "instructor_id": studio_class.instructor_id,
            "instructor_name": instructor_name,
            "max_capacity": studio_class.max_capacity,
            "requirements": studio_class.requirements,
            "recommended_attire": studio_class.recommended_attire,
            "recurrence_pattern": studio_class.recurrence_pattern,
            "assigned_staff_count": len(studio_class.get_assigned_staff_list()),
            "managers_count": len(studio_class.get_managers_list()),
            "instances_count": len(studio_class.instances)
        })
    
    return jsonify({"success": True, "templates": templates})

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

@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users for management purposes."""
    role_filter = request.args.get('role')
    user_type_filter = request.args.get('type')
    
    query = User.query
    
    if role_filter:
        query = query.filter(User.role == role_filter)
    
    if user_type_filter:
        query = query.filter(User.discriminator == user_type_filter)
    
    users = query.all()
    
    return jsonify({
        "success": True,
        "users": [
            {
                "id": user.id,
                "clerk_user_id": user.clerk_user_id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "type": user.discriminator,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            for user in users
        ]
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
        student = db.session.get(User, student_id)
        if student and student.discriminator != 'student':
            student = None
    elif clerk_user_id:
        student = User.query.filter_by(clerk_user_id=clerk_user_id, discriminator='student').first()
    if not student:
        return jsonify({"success": False, "error": "Student not found"}), 404

    # Find class instance
    class_instance = None
    if instance_id:
        class_instance = ClassInstance.query.filter_by(instance_id=instance_id).first()
    elif studio_class_id:
        # For backward compatibility, find the next available instance of this class
        class_instance = ClassInstance.query.filter(
            ClassInstance.class_id == studio_class_id,
            ClassInstance.start_time >= datetime.now()
        ).order_by(ClassInstance.start_time).first()
    
    if not class_instance:
        return jsonify({"success": False, "error": "Class instance not found"}), 404

    # Check if class instance is full
    if class_instance.is_full:
        return jsonify({"success": False, "error": "Class instance is full"}), 400

    # Check if already booked
    if class_instance.is_student_enrolled(student.id):
        return jsonify({"success": False, "error": "Already booked for this class instance"}), 400

    # Enroll student
    try:
        class_instance.add_student(student.id)
        return jsonify({"success": True, "message": "Class instance booked successfully"})
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/sliding-scale-options')
def get_sliding_scale_options():
    category = request.args.get('category', 'drop-in')
    options = SlidingScaleOption.query.filter_by(category=category).all()
    return jsonify({
        "options": [
            {
                "id": option.id,
                "tier_name": option.tier_name,
                "price_min": option.price_min,
                "price_max": option.price_max,
                "description": option.description,
                "category": option.category,
                "stripe_price_id": option.stripe_price_id
            }
            for option in options
        ]
    })

# Helper function to validate sliding scale option and amount
def get_validated_option_and_amount(option_id, custom_amount=None):
    option = SlidingScaleOption.query.filter_by(id=option_id).first()
    if not option:
        return None, "Sliding scale option not found"
    if custom_amount is not None:
        try:
            amount = float(custom_amount)
        except ValueError:
            return None, "Invalid amount"
        if not (option.price_min <= amount <= option.price_max):
            return None, f"Amount must be between {option.price_min} and {option.price_max}"
    else:
        amount = option.price_max  # or price_min, or whatever default
    return option, amount

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.get_json()
    student_id = data.get('student_id')
    option_id = data.get('sliding_scale_option_id')
    custom_amount = data.get('custom_amount')
    class_name = data.get('class_name')
    instance_id = data.get('instance_id')

    option, amount_or_error = get_validated_option_and_amount(option_id, custom_amount)
    if not option:
        return jsonify({"success": False, "error": amount_or_error}), 400
    amount = amount_or_error

    # Verify the class instance exists
    class_instance = ClassInstance.query.filter_by(instance_id=instance_id).first()
    if not class_instance:
        return jsonify({"success": False, "error": "Class instance not found"}), 404

    # Check if class instance is full
    if class_instance.is_full:
        return jsonify({"success": False, "error": "Class instance is full"}), 400

    # Check if student is already enrolled
    if class_instance.is_student_enrolled(student_id):
        return jsonify({"success": False, "error": "Student is already enrolled in this class instance"}), 400

    # Create Payment record (pending)
    payment = Payment(
        amount=amount,
        status='pending',
        student_id=student_id,
        sliding_scale_option_id=option.id,
        instance_id=instance_id,
        class_name=class_name
    )
    db.session.add(payment)
    db.session.commit()

    # Stripe expects amount in cents
    amount_cents = int(amount * 100)

    try:
        if option.stripe_price_id and not custom_amount:
            # Use fixed price
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': option.stripe_price_id,
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:3000/dashboard/student?payment=success&session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/dashboard/student?payment=cancelled',
                metadata={
                    'payment_id': payment.id,
                    'class_name': class_name,
                    'instance_id': instance_id
                }
            )
        else:
            # Use custom amount
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'{option.category.title()} - {option.tier_name}',
                            'description': option.description,
                        },
                        'unit_amount': amount_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='http://localhost:3000/dashboard/student?payment=success&session_id={CHECKOUT_SESSION_ID}',
                cancel_url='http://localhost:3000/dashboard/student?payment=cancelled',
                metadata={
                    'payment_id': payment.id,
                    'class_name': class_name,
                    'instance_id': instance_id
                }
            )
        return jsonify({"success": True, "url": session.url})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/verify-payment', methods=['GET'])
def verify_payment():
    session_id = request.args.get('session_id')
    
    if not session_id:
        return jsonify({"success": False, "error": "Session ID required"}), 400
    
    try:
        # Retrieve the session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == 'paid':
            # Get payment record from metadata
            payment_id = session.get('metadata', {}).get('payment_id')
            if payment_id:
                payment = Payment.query.filter_by(id=payment_id).first()
                if payment:
                    # Update payment status if not already completed
                    if payment.status != 'completed':
                        payment.status = 'completed'
                        
                        # Enroll student in the specific class instance
                        class_instance = ClassInstance.query.filter_by(instance_id=payment.instance_id).first()
                        if class_instance:
                            try:
                                # Add student to the class instance
                                class_instance.add_student(payment.student_id, payment.id)
                                db.session.commit()
                            except ValueError as e:
                                # Handle enrollment errors (already enrolled, full, etc.)
                                print(f"Enrollment error: {e}")
                                # Still mark payment as completed since payment was successful
                                db.session.commit()
                    
                    return jsonify({
                        "success": True,
                        "payment_status": "completed",
                        "amount": payment.amount,
                        "class_name": payment.class_name
                    })
                else:
                    return jsonify({"success": False, "error": "Payment record not found"}), 404
            else:
                return jsonify({"success": False, "error": "Payment metadata not found"}), 404
        else:
            return jsonify({
                "success": False,
                "error": "Payment not completed",
                "payment_status": session.payment_status
            }), 400
            
    except Exception as e:
        print(f"Error verifying payment: {e}")
        return jsonify({"success": False, "error": "Failed to verify payment"}), 500

@app.route('/webhook/stripe', methods=['POST'])
def stripe_webhook():
    print("🔔 Stripe webhook received!")
    payload = request.data
    sig_header = request.headers.get('stripe-signature')
    event = None

    # 1. Verify the Stripe signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        print(f"Stripe event type: {event['type']}")
    except Exception as e:
        print(f"❌ Webhook signature verification failed: {e}")
        return jsonify({"error": "Invalid signature"}), 400

    # 2. Parse and handle the event
    try:
        if event['type'] == 'checkout.session.completed':
            print("✅ Payment received!")
            session = event['data']['object']
            payment_id = session.get('metadata', {}).get('payment_id')
            if payment_id:
                payment = Payment.query.filter_by(id=payment_id).first()
                if payment:
                    payment.status = 'completed'
                    db.session.commit()
                    print(f"Payment {payment_id} marked as completed.")
                else:
                    print(f"Payment record not found for id: {payment_id}")
            else:
                print("No payment_id found in session metadata.")
        else:
            print(f"ℹ️ Received event type: {event['type']}")
    except Exception as e:
        print(f"❌ Error parsing event: {e}")
        return jsonify({"error": "Invalid event payload"}), 400

    return jsonify({"success": True}), 200

@app.route('/api/students/enrolled-classes')
def get_student_enrolled_classes():
    student_id = request.args.get('student_id')
    clerk_user_id = request.args.get('clerk_user_id')
    
    # Find student
    student = None
    if student_id:
        student = db.session.get(User, student_id)
        if student and student.discriminator != 'student':
            student = None
    elif clerk_user_id:
        student = User.query.filter_by(clerk_user_id=clerk_user_id, discriminator='student').first()
    
    if not student:
        return jsonify({"success": False, "error": "Student not found"}), 404
    
    # Get only the class instances where the student is enrolled
    enrolled_enrollments = ClassEnrollment.query.filter_by(
        student_id=student.id,
        status='enrolled'
    ).all()
    
    enrolled_classes = []
    
    for enrollment in enrolled_enrollments:
        instance = enrollment.class_instance
        if instance:  # Make sure the instance still exists
            # Get studio class details
            studio_class = instance.studio_class
            instructor_name = studio_class.instructor.name if studio_class.instructor else str(studio_class.instructor_id)
            
            enrolled_classes.append({
                "instance_id": instance.instance_id,
                "template_id": instance.class_id,
                "class_name": studio_class.class_name,
                "description": studio_class.description,
                "start_time": str(instance.start_time),
                "duration": (instance.end_time - instance.start_time).total_seconds() / 60,  # Convert to minutes
                "instructor_id": studio_class.instructor_id,
                "instructor_name": instructor_name,
                "max_capacity": instance.max_capacity,
                "requirements": studio_class.requirements,
                "recommended_attire": studio_class.recommended_attire,
                "recurrence_pattern": studio_class.recurrence_pattern,
                "enrolled_count": instance.enrolled_count,
                "is_enrolled": True,
                "enrollment_id": enrollment.id
            })
    
    return jsonify({"success": True, "classes": enrolled_classes})

@app.route('/api/students/cancel-enrollment', methods=['POST'])
def cancel_enrollment():
    data = request.get_json()
    student_id = data.get('student_id')
    clerk_user_id = data.get('clerk_user_id')
    instance_id = data.get('instance_id')
    
    # Find student
    student = None
    if student_id:
        student = db.session.get(User, student_id)
        if student and student.discriminator != 'student':
            student = None
    elif clerk_user_id:
        student = User.query.filter_by(clerk_user_id=clerk_user_id, discriminator='student').first()
    
    if not student:
        return jsonify({"success": False, "error": "Student not found"}), 404
    
    # Find the enrollment
    enrollment = ClassEnrollment.query.filter_by(
        student_id=student.id,
        instance_id=instance_id,
        status='enrolled'
    ).first()
    
    if not enrollment:
        return jsonify({"success": False, "error": "Enrollment not found"}), 404
    
    try:
        # Cancel the enrollment
        enrollment.status = 'cancelled'
        enrollment.cancelled_at = datetime.now()
        db.session.commit()
        
        return jsonify({"success": True, "message": "Enrollment cancelled successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/studio-classes/<int:class_id>/staff', methods=['GET'])
def get_class_staff(class_id):
    """Get all staff members assigned to a specific class."""
    studio_class = db.session.get(StudioClass, class_id)
    if not studio_class:
        return jsonify({"success": False, "error": "Class not found"}), 404
    
    staff_members = studio_class.get_assigned_staff_list()
    return jsonify({
        "success": True,
        "staff": [
            {
                "id": staff.id,
                "name": staff.name,
                "email": staff.email,
                "role": staff.role
            }
            for staff in staff_members
        ]
    })

@app.route('/api/studio-classes/<int:class_id>/staff', methods=['POST'])
def add_class_staff(class_id):
    """Add a staff member to a class."""
    data = request.get_json()
    staff_id = data.get('staff_id')
    
    if not staff_id:
        return jsonify({"success": False, "error": "staff_id is required"}), 400
    
    studio_class = db.session.get(StudioClass, class_id)
    if not studio_class:
        return jsonify({"success": False, "error": "Class not found"}), 404
    
    staff_member = db.session.get(User, staff_id)
    if not staff_member or staff_member.discriminator != 'staff':
        return jsonify({"success": False, "error": "Staff member not found"}), 404
    
    try:
        studio_class.add_staff_member(staff_member)
        return jsonify({"success": True, "message": "Staff member added successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/studio-classes/<int:class_id>/staff/<int:staff_id>', methods=['DELETE'])
def remove_class_staff(class_id, staff_id):
    """Remove a staff member from a class."""
    studio_class = db.session.get(StudioClass, class_id)
    if not studio_class:
        return jsonify({"success": False, "error": "Class not found"}), 404
    
    staff_member = db.session.get(User, staff_id)
    if not staff_member:
        return jsonify({"success": False, "error": "Staff member not found"}), 404
    
    try:
        studio_class.remove_staff_member(staff_member)
        return jsonify({"success": True, "message": "Staff member removed successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/studio-classes/<int:class_id>/managers', methods=['GET'])
def get_class_managers(class_id):
    """Get all managers assigned to a specific class."""
    studio_class = db.session.get(StudioClass, class_id)
    if not studio_class:
        return jsonify({"success": False, "error": "Class not found"}), 404
    
    managers = studio_class.get_managers_list()
    return jsonify({
        "success": True,
        "managers": [
            {
                "id": manager.id,
                "name": manager.name,
                "email": manager.email,
                "role": manager.role
            }
            for manager in managers
        ]
    })

@app.route('/api/studio-classes/<int:class_id>/managers', methods=['POST'])
def add_class_manager(class_id):
    """Add a manager to a class."""
    data = request.get_json()
    manager_id = data.get('manager_id')
    
    if not manager_id:
        return jsonify({"success": False, "error": "manager_id is required"}), 400
    
    studio_class = db.session.get(StudioClass, class_id)
    if not studio_class:
        return jsonify({"success": False, "error": "Class not found"}), 404
    
    manager = db.session.get(User, manager_id)
    if not manager or manager.discriminator != 'management':
        return jsonify({"success": False, "error": "Manager not found"}), 404
    
    try:
        studio_class.add_manager(manager)
        return jsonify({"success": True, "message": "Manager added successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/studio-classes/<int:class_id>/managers/<int:manager_id>', methods=['DELETE'])
def remove_class_manager(class_id, manager_id):
    """Remove a manager from a class."""
    studio_class = db.session.get(StudioClass, class_id)
    if not studio_class:
        return jsonify({"success": False, "error": "Class not found"}), 404
    
    manager = db.session.get(User, manager_id)
    if not manager:
        return jsonify({"success": False, "error": "Manager not found"}), 404
    
    try:
        studio_class.remove_manager(manager)
        return jsonify({"success": True, "message": "Manager removed successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/studio-classes/<int:class_id>/instructor', methods=['PUT'])
def change_class_instructor(class_id):
    """Change the instructor for a class."""
    data = request.get_json()
    new_instructor_id = data.get('instructor_id')
    
    if not new_instructor_id:
        return jsonify({"success": False, "error": "instructor_id is required"}), 400
    
    studio_class = db.session.get(StudioClass, class_id)
    if not studio_class:
        return jsonify({"success": False, "error": "Class not found"}), 404
    
    new_instructor = db.session.get(User, new_instructor_id)
    if not new_instructor or new_instructor.discriminator != 'staff':
        return jsonify({"success": False, "error": "Instructor not found"}), 404
    
    try:
        # Remove old instructor from staff assignments if they were there
        old_instructor = db.session.get(User, studio_class.instructor_id)
        if old_instructor and old_instructor in studio_class.assigned_staff:
            studio_class.remove_staff_member(old_instructor)
        
        # Change instructor
        studio_class.change_instructor(new_instructor_id)
        
        # Add new instructor to staff assignments
        studio_class.add_staff_member(new_instructor)
        
        return jsonify({"success": True, "message": "Instructor changed successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/announcements')
def get_announcements():
    board_type = request.args.get('board_type', 'student')
    
    # Get announcements for the specified board type
    announcements = Announcement.query.join(BulletinBoard).filter(
        BulletinBoard.board_type == board_type
    ).order_by(Announcement.date_created.desc()).all()
    
    return jsonify({
        "announcements": [
            {
                "id": announcement.id,
                "title": announcement.title,
                "body": announcement.body,
                "date_created": announcement.date_created.isoformat()
            }
            for announcement in announcements
        ]
    })

@app.route('/api/announcements', methods=['POST'])
def create_announcement():
    """Create a new announcement (management only)."""
    data = request.get_json()
    title = data.get('title')
    body = data.get('body')
    board_type = data.get('board_type', 'student')
    author_id = data.get('author_id')
    
    if not all([title, body, author_id]):
        return jsonify({"success": False, "error": "Missing required fields: title, body, author_id"}), 400
    
    # Verify the author is a management user
    author = db.session.get(User, author_id)
    if not author or author.discriminator != 'management':
        return jsonify({"success": False, "error": "Only management users can create announcements"}), 403
    
    try:
        # Get or create the bulletin board
        bulletin_board = BulletinBoard.query.filter_by(board_type=board_type).first()
        if not bulletin_board:
            bulletin_board = BulletinBoard(board_type=board_type)
            db.session.add(bulletin_board)
            db.session.commit()
        
        # Create the announcement
        announcement = Announcement(
            title=title,
            body=body,
            author_id=author_id,
            board_id=bulletin_board.id
        )
        
        db.session.add(announcement)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "announcement": {
                "id": announcement.id,
                "title": announcement.title,
                "body": announcement.body,
                "date_created": announcement.date_created.isoformat(),
                "author_id": announcement.author_id,
                "board_id": announcement.board_id
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
