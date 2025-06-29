from flask import Flask, jsonify, request
from flask_cors import CORS
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
from controllers.payment_controller import PaymentController
from controllers.membership_controller import MembershipController
from controllers.attendance_controller import AttendanceController
from controllers.credit_controller import CreditController

# Import DTOs
from dtos.user_dto import UserDTO
from dtos.class_dto import StudioClassDTO, ClassInstanceDTO

app = Flask(__name__)
# Use absolute path to database
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'db.sqlite3')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev')

db.init_app(app)
CORS(app)

# Load environment variables from .env
load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Create controller instances
user_controller = UserController()
class_controller = ClassController()
payment_controller = PaymentController()
membership_controller = MembershipController()
attendance_controller = AttendanceController()
credit_controller = CreditController()

@app.route('/api/ping')
def ping():
    return jsonify({"message": "pong"})

# User routes using UserController
@app.route('/api/users/create', methods=['POST'])
def create_user_route():
    return user_controller.create_user()

@app.route('/api/users/by-clerk-id')
def get_user_by_clerk_id():
    return user_controller.get_user_by_clerk_id()

@app.route('/api/users', methods=['GET'])
def get_all_users():
    return user_controller.get_all_users()

@app.route('/api/instructors/search')
def search_instructors():
    return user_controller.search_instructors()

# Class routes using ClassController
@app.route('/api/studio-classes/create', methods=['POST'])
def create_studio_class():
    return class_controller.create_studio_class()

@app.route('/api/studio-classes/list', methods=['GET'])
def list_studio_classes():
    return class_controller.get_future_instances()

@app.route('/api/studio-classes/templates', methods=['GET'])
def get_studio_class_templates():
    return class_controller.get_all_classes()

@app.route('/api/studio-classes/book', methods=['POST'])
def book_studio_class():
    return class_controller.book_class()

@app.route('/api/studio-classes/book-staff', methods=['POST'])
def book_studio_class_for_staff():
    return class_controller.book_class_for_staff()

@app.route('/api/studio-classes/check-eligibility', methods=['POST'])
def check_booking_eligibility():
    return class_controller.check_booking_eligibility()

@app.route('/api/students/enrolled-classes')
def get_student_enrolled_classes():
    return class_controller.get_student_enrolled_classes()

@app.route('/api/students/cancel-enrollment', methods=['POST'])
def cancel_enrollment():
    return class_controller.cancel_enrollment()

@app.route('/api/staff/cancel-booking', methods=['POST'])
def cancel_staff_booking():
    return class_controller.cancel_staff_booking()

@app.route('/api/studio-classes/<int:class_id>/staff', methods=['GET'])
def get_class_staff(class_id):
    return class_controller.get_class_staff(class_id)

@app.route('/api/studio-classes/<int:class_id>/staff', methods=['POST'])
def add_class_staff(class_id):
    return class_controller.add_class_staff(class_id)

@app.route('/api/studio-classes/<int:class_id>/staff/<int:staff_id>', methods=['DELETE'])
def remove_class_staff(class_id, staff_id):
    return class_controller.remove_class_staff(class_id, staff_id)

@app.route('/api/studio-classes/<int:class_id>/instructor', methods=['PUT'])
def change_class_instructor(class_id):
    return class_controller.change_class_instructor(class_id)

@app.route('/api/studio-classes/cancel', methods=['POST'])
def cancel_class():
    return class_controller.cancel_class()

@app.route('/api/studio-classes/book-with-credit', methods=['POST'])
def book_studio_class_with_credit():
    return class_controller.book_class_with_credit()

# Attendance routes using AttendanceController
@app.route('/api/staff/assigned-classes', methods=['GET'])
def get_staff_assigned_classes():
    return attendance_controller.get_staff_assigned_classes()

@app.route('/api/staff/booked-classes', methods=['GET'])
def get_staff_booked_classes():
    return attendance_controller.get_staff_booked_classes()

@app.route('/api/debug/assigned-classes', methods=['GET'])
def debug_assigned_classes():
    """Debug endpoint to check assigned classes"""
    try:
        clerk_user_id = request.args.get('clerk_user_id')
        if not clerk_user_id:
            return jsonify({"success": False, "error": "clerk_user_id is required"}), 400
        
        # Get user
        user = user_controller.user_service.get_user_by_clerk_id(clerk_user_id)
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404
        
        # Get assigned classes
        classes = attendance_controller.attendance_service.get_staff_assigned_classes(user.id)
        
        return jsonify({
            "success": True,
            "user_id": user.id,
            "user_role": user.role,
            "total_classes": len(classes),
            "classes": classes
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/attendance/mark', methods=['POST'])
def mark_attendance():
    return attendance_controller.mark_attendance()

@app.route('/api/attendance/roster/<instance_id>', methods=['GET'])
def get_class_roster(instance_id):
    return attendance_controller.get_class_roster(instance_id)

# Payment routes using PaymentController
@app.route('/api/sliding-scale-options', methods=['GET'])
def get_sliding_scale_options():
    return payment_controller.get_sliding_scale_options()

@app.route('/api/sliding-scale-options/all', methods=['GET'])
def get_all_sliding_scale_options():
    return payment_controller.get_all_sliding_scale_options()

@app.route('/api/sliding-scale-options', methods=['POST'])
def create_sliding_scale_option():
    return payment_controller.create_sliding_scale_option()

# Membership routes using MembershipController
@app.route('/api/membership/status', methods=['POST'])
def get_membership_status():
    return membership_controller.get_membership_status()

@app.route('/api/membership/create', methods=['POST'])
def create_membership():
    return membership_controller.create_membership()

@app.route('/api/membership/cancel', methods=['POST'])
def cancel_membership():
    return membership_controller.cancel_membership()

@app.route('/api/membership/options', methods=['GET'])
def get_membership_options():
    return membership_controller.get_membership_options()

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        print(f"[create-checkout-session] 🔍 Called with data: {request.get_json()}")
        data = request.get_json()
        if not data:
            print(f"[create-checkout-session] ❌ Missing JSON body")
            return jsonify({"success": False, "error": "Missing JSON body"}), 400
        
        option_id = data.get('option_id')
        custom_amount = data.get('custom_amount')
        student_id = data.get('student_id')
        clerk_user_id = data.get('clerk_user_id')
        instance_id = data.get('instance_id')
        class_name = data.get('class_name')
        
        print(f"[create-checkout-session] 📋 Extracted data:")
        print(f"[create-checkout-session] 📋   - option_id: {option_id}")
        print(f"[create-checkout-session] 📋   - custom_amount: {custom_amount}")
        print(f"[create-checkout-session] 📋   - student_id: {student_id}")
        print(f"[create-checkout-session] 📋   - clerk_user_id: {clerk_user_id}")
        print(f"[create-checkout-session] 📋   - instance_id: {instance_id}")
        print(f"[create-checkout-session] 📋   - class_name: {class_name}")
        
        if not option_id:
            print(f"[create-checkout-session] ❌ Missing option_id")
            return jsonify({"success": False, "error": "Missing option_id"}), 400
        
        # Find student
        student = None
        if student_id:
            student = user_controller.user_service.get_user_by_id(student_id)
            if student and student.discriminator != 'student':
                student = None
        elif clerk_user_id:
            student = user_controller.user_service.get_user_by_clerk_id(clerk_user_id)
            if student and student.discriminator != 'student':
                student = None
        
        if not student:
            print(f"[create-checkout-session] ❌ Student not found")
            return jsonify({"success": False, "error": "Student not found"}), 404
        
        print(f"[create-checkout-session] ✅ Student found - id: {student.id}, name: {student.name}")
        
        # Validate payment option
        option, amount = PaymentService.validate_payment_option(option_id, custom_amount)
        print(f"[create-checkout-session] ✅ Payment option validated - tier: {option.tier_name}, amount: {amount}")
        
        # Create payment record
        payment = PaymentService.create_payment(
            student.id, 
            amount, 
            option_id, 
            instance_id, 
            class_name
        )
        print(f"[create-checkout-session] ✅ Payment record created - payment_id: {payment.id}")
        
        # Create Stripe checkout session
        success_url = data.get('success_url', f'http://localhost:3000/dashboard/student?payment=success&session_id={{CHECKOUT_SESSION_ID}}')
        cancel_url = data.get('cancel_url', 'http://localhost:3000/dashboard/student?canceled=true')
        
        print(f"[create-checkout-session] 🔗 Creating Stripe session with:")
        print(f"[create-checkout-session] 🔗   - success_url: {success_url}")
        print(f"[create-checkout-session] 🔗   - cancel_url: {cancel_url}")
        
        session = PaymentService.create_stripe_checkout_session(payment.id, success_url, cancel_url)
        print(f"[create-checkout-session] ✅ Stripe session created - session_id: {session.id}")
        
        return jsonify({
            "success": True,
            "session_id": session.id,
            "url": session.url
        })
        
    except ValueError as e:
        print(f"[create-checkout-session] ❌ ValueError: {e}")
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        print(f"[create-checkout-session] ❌ Exception: {e}")
        import traceback
        print(f"[create-checkout-session] ❌ Exception traceback: {traceback.format_exc()}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/verify-payment', methods=['GET'])
def verify_payment():
    try:
        print(f"[verify-payment endpoint] 🔍 Called with query params: {request.args}")
        session_id = request.args.get('session_id')
        if not session_id:
            print(f"[verify-payment endpoint] ❌ Missing session_id parameter")
            return jsonify({"success": False, "error": "Missing session_id parameter"}), 400
        
        print(f"[verify-payment endpoint] 💳 Processing session_id: {session_id}")
        
        payment = PaymentService.verify_payment(session_id)
        print(f"[verify-payment endpoint] 📋 PaymentService.verify_payment result: {payment}")
        
        if payment:
            print(f"[verify-payment endpoint] ✅ Payment verified successfully")
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
            print(f"[verify-payment endpoint] ❌ Payment not found or not completed")
            return jsonify({"success": False, "error": "Payment not found or not completed"}), 404
            
    except Exception as e:
        print(f"[verify-payment endpoint] ❌ Exception: {e}")
        import traceback
        print(f"[verify-payment endpoint] ❌ Exception traceback: {traceback.format_exc()}")
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
        print("[webhook] Event data:", event)
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            print("[webhook] Stripe session completed. Session data:", session)
            print("[webhook] Metadata received:", session.get('metadata'))
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
        board_types = request.args.get('board_types', 'student').split(',')
        all_announcements = []
        
        for board_type in board_types:
            bulletin_board = BulletinBoard.query.filter_by(board_type=board_type.strip()).first()
            
            if bulletin_board:
                announcements = bulletin_board.get_announcements()
                for announcement in announcements:
                    all_announcements.append({
                        "id": announcement.id,
                        "title": announcement.title,
                        "body": announcement.body,
                        "date_created": announcement.date_created.isoformat(),
                        "author_name": announcement.author.name if announcement.author else 'Unknown',
                        "author_role": announcement.author.role if announcement.author else 'Unknown',
                        "board_type": board_type.strip()
                    })
        
        # Sort by date created (newest first)
        all_announcements.sort(key=lambda x: x['date_created'], reverse=True)
        
        return jsonify({
            "success": True,
            "announcements": all_announcements
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
                "date_created": announcement.date_created.isoformat(),
                "author_name": announcement.author.name if announcement.author else 'Unknown',
                "author_role": announcement.author.role if announcement.author else 'Unknown'
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

# Credit routes using CreditController
@app.route('/api/credits/student', methods=['GET'])
def get_student_credits():
    return credit_controller.get_student_credits()

@app.route('/api/credits/history', methods=['GET'])
def get_credit_history():
    return credit_controller.get_credit_history()

@app.route('/api/credits/use', methods=['POST'])
def use_credit_for_booking():
    return credit_controller.use_credit_for_booking()

if __name__ == '__main__':
    app.run(debug=True) 