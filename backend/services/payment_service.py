from models import db, Payment, SlidingScaleOption, Membership, Student
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import stripe
import os
from repositories.payment_repository import PaymentRepository
from services.class_service import ClassService


class PaymentService:
    """Service layer for payment-related business logic"""
    
    def __init__(self):
        self.payment_repository = PaymentRepository()
    
    def get_sliding_scale_options(self) -> List[SlidingScaleOption]:
        """Get drop-in sliding scale options only"""
        return self.payment_repository.find_drop_in_options()
    
    def get_all_sliding_scale_options(self) -> List[SlidingScaleOption]:
        """Get all sliding scale options"""
        return self.payment_repository.get_all()
    
    def get_options_by_category(self, category: str) -> List[SlidingScaleOption]:
        """Get sliding scale options by category"""
        return self.payment_repository.find_by_category(category)
    
    def get_membership_options(self) -> List[SlidingScaleOption]:
        """Get membership sliding scale options"""
        return self.payment_repository.find_membership_options()
    
    def get_active_options(self) -> List[SlidingScaleOption]:
        """Get active sliding scale options"""
        return self.payment_repository.find_active_options()
    
    def create_sliding_scale_option(self, option_data: dict) -> SlidingScaleOption:
        """Create a new sliding scale option"""
        option = SlidingScaleOption(**option_data)
        return self.payment_repository.create(option)
    
    def update_sliding_scale_option(self, option: SlidingScaleOption) -> SlidingScaleOption:
        """Update a sliding scale option"""
        return self.payment_repository.update(option)
    
    def delete_sliding_scale_option(self, option: SlidingScaleOption) -> bool:
        """Delete a sliding scale option"""
        return self.payment_repository.delete(option)
    
    @staticmethod
    def get_sliding_scale_option(option_id: int) -> Optional[SlidingScaleOption]:
        """Get a specific sliding scale option"""
        return db.session.get(SlidingScaleOption, option_id)
    
    @staticmethod
    def validate_payment_option(option_id: int, custom_amount: Optional[float] = None) -> Tuple[SlidingScaleOption, float]:
        """Validate payment option and return the option and amount"""
        option = PaymentService.get_sliding_scale_option(option_id)
        if not option:
            raise ValueError("Invalid sliding scale option")
        
        if custom_amount is not None:
            if custom_amount < option.price_min or custom_amount > option.price_max:
                raise ValueError(f"Custom amount must be between ${option.price_min} and ${option.price_max}")
            amount = custom_amount
        else:
            amount = option.price_min
        
        return option, amount
    
    @staticmethod
    def create_payment(student_id: int, amount: float, option_id: int, instance_id: Optional[str] = None, class_name: Optional[str] = None) -> Payment:
        """Create a new payment record"""
        try:
            payment = Payment(
                amount=amount,
                student_id=student_id,
                sliding_scale_option_id=option_id,
                instance_id=instance_id,
                class_name=class_name,
                status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            return payment
        except Exception as e:
            db.session.rollback()
            raise e
    
    @staticmethod
    def create_stripe_checkout_session(payment_id: int, success_url: str, cancel_url: str) -> stripe.checkout.Session:
        """Create a Stripe checkout session"""
        try:
            payment = db.session.get(Payment, payment_id)
            if not payment:
                raise ValueError("Payment not found")
            
            option = payment.sliding_scale_option
            
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f"Class Payment - {option.tier_name}",
                            'description': option.description or f"Payment for {option.tier_name} tier"
                        },
                        'unit_amount': int(payment.amount * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'payment_id': payment_id,
                    'student_id': payment.student_id,
                    'instance_id': payment.instance_id or '',
                    'class_name': payment.class_name or ''
                }
            )
            
            return session
        except Exception as e:
            raise e
    
    @staticmethod
    def verify_payment(session_id: str) -> Optional[Payment]:
        """Verify a payment using Stripe session ID"""
        try:
            print(f"[verify_payment] 🔍 Called with session_id={session_id}")
            session = stripe.checkout.Session.retrieve(session_id)
            print(f"[verify_payment] 📊 Stripe session payment_status: {session.payment_status}")
            print(f"[verify_payment] 📊 Stripe session metadata: {session.metadata}")
            
            if session.payment_status == 'paid':
                payment_id = int(session.metadata.get('payment_id'))
                print(f"[verify_payment] 💳 Payment ID from metadata: {payment_id}")
                
                payment = db.session.get(Payment, payment_id)
                print(f"[verify_payment] 📋 Payment found: {payment}")
                print(f"[verify_payment] 📋 Payment details - student_id: {payment.student_id}, instance_id: {payment.instance_id}, class_name: {payment.class_name}, status: {payment.status}")
                
                if payment:
                    payment.status = 'completed'
                    db.session.commit()
                    print(f"[verify_payment] ✅ Payment status updated to 'completed'")
                    print(f"[verify_payment] 🟣 Stripe payment received for user: {payment.student_id}, class: {payment.instance_id}")
                    
                    # Check if this is a membership payment
                    if payment.class_name and 'Membership' in payment.class_name:
                        print(f"[verify_payment] 🏢 Processing membership payment")
                        try:
                            # Activate membership directly
                            PaymentService._activate_membership(payment.id)
                            print(f"[verify_payment] ✅ Membership activated successfully")
                        except Exception as e:
                            print(f"[verify_payment] ❌ Membership activation error: {e}")
                    else:
                        # Enroll the student in the class instance if not already enrolled
                        print(f"[verify_payment] 🎓 Attempting to register user for class: {payment.instance_id}")
                        print(f"[verify_payment] 🎓 Enrollment details - student_id: {payment.student_id}, instance_id: {payment.instance_id}, payment_id: {payment.id}")
                        
                        if payment.student_id and payment.instance_id:
                            try:
                                print(f"[verify_payment] 🎓 Calling ClassService.book_class with payment_type='drop-in'")
                                result = ClassService().book_class(payment.student_id, payment.instance_id, payment.id, 'drop-in')
                                print(f"[verify_payment] ✅ Booking entry saved: {result}")
                                
                                # Verify enrollment was created
                                from models import ClassEnrollment
                                enrollment = ClassEnrollment.query.filter_by(
                                    student_id=payment.student_id,
                                    instance_id=payment.instance_id,
                                    payment_id=payment.id
                                ).first()
                                print(f"[verify_payment] 🔍 Enrollment verification - found: {enrollment is not None}")
                                if enrollment:
                                    print(f"[verify_payment] 🔍 Enrollment details - id: {enrollment.id}, status: {enrollment.status}, payment_type: {enrollment.payment_type}")
                                
                            except Exception as e:
                                print(f"[verify_payment] ❌ Enrollment error: {e}")
                                import traceback
                                print(f"[verify_payment] ❌ Enrollment error traceback: {traceback.format_exc()}")
                        else:
                            print(f"[verify_payment] ❌ Missing student_id or instance_id for enrollment")
                            print(f"[verify_payment] ❌ student_id: {payment.student_id}, instance_id: {payment.instance_id}")
                    return payment
                else:
                    print(f"[verify_payment] ❌ Payment not found for ID: {payment_id}")
            else:
                print(f"[verify_payment] ❌ Payment not completed, status: {session.payment_status}")
            return None
        except Exception as e:
            print(f"[verify_payment] ❌ Exception: {e}")
            import traceback
            print(f"[verify_payment] ❌ Exception traceback: {traceback.format_exc()}")
            raise e
    
    @staticmethod
    def _activate_membership(payment_id: int) -> bool:
        """Activate membership after successful payment"""
        try:
            payment = db.session.get(Payment, payment_id)
            if not payment:
                raise ValueError("Payment not found")
            
            if payment.status != 'completed':
                raise ValueError("Payment not completed")
            
            # Get student
            student = Student.query.get(payment.student_id)
            if not student:
                raise ValueError("Student not found")
            
            # Create or update membership
            membership_type = payment.sliding_scale_option.tier_name
            start_date = datetime.utcnow()
            
            # Calculate end date based on membership type
            from datetime import timedelta
            if 'monthly' in membership_type.lower():
                end_date = start_date + timedelta(days=30)
            elif 'annual' in membership_type.lower():
                end_date = start_date + timedelta(days=365)
            else:
                # Default to monthly
                end_date = start_date + timedelta(days=30)
            
            # Create new membership
            membership = Membership(
                membership_type=membership_type,
                start_date=start_date,
                end_date=end_date
            )
            
            db.session.add(membership)
            db.session.flush()  # Get the membership ID
            
            # Assign membership to student
            student.membership_id = membership.id
            db.session.commit()
            
            return True
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error activating membership: {str(e)}")
    
    @staticmethod
    def handle_webhook_event(event: Dict[str, Any]) -> bool:
        """Handle Stripe webhook events"""
        try:
            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']
                print("[handle_webhook_event] Stripe session completed. Session:", session)
                payment_id = session.get('metadata', {}).get('payment_id')
                print(f"[handle_webhook_event] Payment ID from metadata: {payment_id}")
                if payment_id:
                    payment = db.session.get(Payment, int(payment_id))
                    print(f"[handle_webhook_event] Payment lookup result: {payment}")
                    if payment:
                        payment.status = 'completed'
                        db.session.commit()
                        print(f"[handle_webhook_event] Payment status updated to 'completed' for payment_id={payment.id}")
                        # Activate membership if this is a membership payment
                        if payment.class_name and 'Membership' in payment.class_name:
                            print(f"[handle_webhook_event] Detected membership payment, activating membership...")
                            PaymentService._activate_membership(payment.id)
                        else:
                            # Enroll the student in the class instance if not already enrolled
                            print(f"[handle_webhook_event] Attempting to register user: {payment.student_id} for class: {payment.instance_id} with payment_id: {payment.id}")
                            try:
                                result = ClassService().book_class(payment.student_id, payment.instance_id, payment.id, 'drop-in')
                                print(f"[handle_webhook_event] Booking result: {result}")
                            except Exception as e:
                                print(f"[handle_webhook_event] ❌ Booking error: {e}")
                                import traceback
                                print(traceback.format_exc())
                        return True
            return False
        except Exception as e:
            print(f"[handle_webhook_event] ❌ Exception: {e}")
            import traceback
            print(traceback.format_exc())
            raise e
    
    @staticmethod
    def get_payment_by_id(payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        return db.session.get(Payment, payment_id)
    
    @staticmethod
    def get_payments_by_student(student_id: int) -> List[Payment]:
        """Get all payments for a student"""
        return Payment.query.filter_by(student_id=student_id).all() 