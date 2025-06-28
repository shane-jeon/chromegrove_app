from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_migrate import Migrate
from models import db, User, StudioClass, SlidingScaleOption, Payment, ClassInstance, ClassEnrollment, Announcement, BulletinBoard
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import stripe

# Import services
from services.user_service import UserService
from services.class_service import ClassService
from services.payment_service import PaymentService

# Import controllers
from controllers.user_controller import UserController
from controllers.class_controller import ClassController

# Import DTOs
from dtos.user_dto import UserDTO
from dtos.class_dto import StudioClassDTO, ClassInstanceDTO

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)
CORS(app)

# Load environment variables from .env
load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

@app.route('/api/ping')
def ping():
    return jsonify({"message": "pong"})

# User routes using UserController
@app.route('/api/users/create', methods=['POST'])
def create_user_route():
    return UserController.create_user()

@app.route('/api/users/by-clerk-id')
def get_user_by_clerk_id():
    return UserController.get_user_by_clerk_id()

@app.route('/api/users', methods=['GET'])
def get_all_users():
    return UserController.get_all_users()

@app.route('/api/instructors/search')
def search_instructors():
    return UserController.search_instructors()

# Class routes using ClassController
@app.route('/api/studio-classes/create', methods=['POST'])
def create_studio_class():
    return ClassController.create_studio_class()

@app.route('/api/studio-classes/list', methods=['GET'])
def list_studio_classes():
    return ClassController.list_studio_classes()

@app.route('/api/studio-classes/templates', methods=['GET'])
def get_studio_class_templates():
    return ClassController.get_class_templates()

@app.route('/api/studio-classes/book', methods=['POST'])
def book_studio_class():
    return ClassController.book_class()

@app.route('/api/students/enrolled-classes')
def get_student_enrolled_classes():
    return ClassController.get_student_enrolled_classes()

@app.route('/api/students/cancel-enrollment', methods=['POST'])
def cancel_enrollment():
    return ClassController.cancel_enrollment()

@app.route('/api/studio-classes/<int:class_id>/staff', methods=['GET'])
def get_class_staff(class_id):
    return ClassController.get_class_staff(class_id)

@app.route('/api/studio-classes/<int:class_id>/staff', methods=['POST'])
def add_class_staff(class_id):
    return ClassController.add_class_staff(class_id)

@app.route('/api/studio-classes/<int:class_id>/staff/<int:staff_id>', methods=['DELETE'])
def remove_class_staff(class_id, staff_id):
    return ClassController.remove_class_staff(class_id, staff_id)

@app.route('/api/studio-classes/<int:class_id>/instructor', methods=['PUT'])
def change_class_instructor(class_id):
    return ClassController.change_class_instructor(class_id)

# Payment routes using PaymentService
@app.route('/api/sliding-scale-options')
def get_sliding_scale_options():
    try:
        options = PaymentService.get_sliding_scale_options()
        return jsonify({
            "success": True,
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
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Missing JSON body"}), 400
        
        option_id = data.get('option_id')
        custom_amount = data.get('custom_amount')
        student_id = data.get('student_id')
        clerk_user_id = data.get('clerk_user_id')
        instance_id = data.get('instance_id')
        class_name = data.get('class_name')
        
        if not option_id:
            return jsonify({"success": False, "error": "Missing option_id"}), 400
        
        # Find student
        student = None
        if student_id:
            student = UserService.get_user_by_id(student_id)
            if student and student.discriminator != 'student':
                student = None
        elif clerk_user_id:
            student = UserService.get_user_by_clerk_id(clerk_user_id)
            if student and student.discriminator != 'student':
                student = None
        
        if not student:
            return jsonify({"success": False, "error": "Student not found"}), 404
        
        # Validate payment option
        option, amount = PaymentService.validate_payment_option(option_id, custom_amount)
        
        # Create payment record
        payment = PaymentService.create_payment(
            student.id, 
            amount, 
            option_id, 
            instance_id, 
            class_name
        )
        
        # Create Stripe checkout session
        success_url = data.get('success_url', 'http://localhost:3000/dashboard/student?success=true')
        cancel_url = data.get('cancel_url', 'http://localhost:3000/dashboard/student?canceled=true')
        
        session = PaymentService.create_stripe_checkout_session(payment.id, success_url, cancel_url)
        
        return jsonify({
            "success": True,
            "session_id": session.id,
            "url": session.url
        })
        
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/verify-payment', methods=['GET'])
def verify_payment():
    try:
        session_id = request.args.get('session_id')
        if not session_id:
            return jsonify({"success": False, "error": "Missing session_id parameter"}), 400
        
        payment = PaymentService.verify_payment(session_id)
        if payment:
            return jsonify({
                "success": True,
                "payment": {
                    "id": payment.id,
                    "amount": payment.amount,
                    "status": payment.status,
                    "student_id": payment.student_id,
                    "instance_id": payment.instance_id,
                    "class_name": payment.class_name
                }
            })
        else:
            return jsonify({"success": False, "error": "Payment not found or not completed"}), 404
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/webhook/stripe', methods=['POST'])
def stripe_webhook():
    print("🔔 Stripe webhook received!")
    payload = request.data
    sig_header = request.headers.get('stripe-signature')
    event = None

    # Verify the Stripe signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        print(f"Stripe event type: {event['type']}")
    except Exception as e:
        print(f"❌ Webhook signature verification failed: {e}")
        return jsonify({"error": "Invalid signature"}), 400

    # Handle the event
    try:
        success = PaymentService.handle_webhook_event(event)
        if success:
            print("✅ Payment processed successfully!")
        else:
            print(f"ℹ️ Received event type: {event['type']}")
    except Exception as e:
        print(f"❌ Error processing event: {e}")
        return jsonify({"error": "Invalid event payload"}), 400

    return jsonify({"success": True}), 200

# Announcement routes
@app.route('/api/announcements')
def get_announcements():
    try:
        board_type = request.args.get('board_type', 'student')
        bulletin_board = BulletinBoard.query.filter_by(board_type=board_type).first()
        
        if not bulletin_board:
            return jsonify({"success": False, "error": "Bulletin board not found"}), 404
        
        announcements = bulletin_board.get_announcements()
        return jsonify({
            "success": True,
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
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/announcements', methods=['POST'])
def create_announcement():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Missing JSON body"}), 400
        
        title = data.get('title')
        body = data.get('body')
        author_id = data.get('author_id')
        board_type = data.get('board_type', 'student')
        
        if not all([title, body, author_id]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400
        
        # Get or create bulletin board
        bulletin_board = BulletinBoard.query.filter_by(board_type=board_type).first()
        if not bulletin_board:
            bulletin_board = BulletinBoard(board_type=board_type)
            db.session.add(bulletin_board)
            db.session.commit()
        
        # Create announcement
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
                "date_created": announcement.date_created.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 