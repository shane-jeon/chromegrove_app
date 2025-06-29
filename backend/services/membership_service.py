from models import db, Membership, Student, SlidingScaleOption, Payment
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import stripe
import os
from services.user_service import UserService

class MembershipService:
    """Service layer for membership-related business logic"""
    
    def __init__(self):
        self.user_service = UserService()
    
    def get_membership_status(self, clerk_user_id: str) -> Dict[str, Any]:
        """Get membership status for a student"""
        try:
            print(f"[membership_service] Looking up user with clerk_user_id: {clerk_user_id}")
            student = self.user_service.get_user_by_clerk_id(clerk_user_id)
            print(f"[membership_service] Found user: {student}")
            
            if not student:
                print("[membership_service] User not found")
                return {"has_membership": False, "message": "User not found"}
            
            if student.discriminator != 'student':
                print(f"[membership_service] User is not a student, type: {student.discriminator}")
                return {"has_membership": False, "message": "User not found or not a student"}
            
            print(f"[membership_service] Student has_membership: {student.has_membership}")
            if not student.has_membership:
                print("[membership_service] No active membership")
                return {"has_membership": False, "message": "No active membership"}
            
            membership = student.membership
            print(f"[membership_service] Membership found: {membership}")
            result = {
                "has_membership": True,
                "membership_type": membership.membership_type,
                "start_date": membership.start_date.isoformat(),
                "end_date": membership.end_date.isoformat() if membership.end_date else None,
                "is_active": membership.is_active(),
                "expires_at": membership.end_date.isoformat() if membership.end_date else None
            }
            print(f"[membership_service] Returning result: {result}")
            return result
            
        except Exception as e:
            print(f"[membership_service] Exception: {e}")
            raise Exception(f"Error getting membership status: {str(e)}")
    
    def create_membership_payment(self, clerk_user_id: str, option_id: int, custom_amount: Optional[float] = None) -> Dict[str, str]:
        """Create a membership payment and Stripe session"""
        try:
            # Get student
            student = self.user_service.get_user_by_clerk_id(clerk_user_id)
            if not student or student.discriminator != 'student':
                raise ValueError("User not found or not a student")
            
            # Validate payment option (must be membership category)
            option = db.session.get(SlidingScaleOption, option_id)
            if not option:
                raise ValueError("Invalid sliding scale option")
            
            if option.category != 'membership':
                raise ValueError("Selected option is not a membership option")
            
            # Validate amount
            if custom_amount is not None:
                if custom_amount < option.price_min or custom_amount > option.price_max:
                    raise ValueError(f"Custom amount must be between ${option.price_min} and ${option.price_max}")
                amount = custom_amount
            else:
                amount = option.price_min
            
            # Create payment record
            payment = Payment(
                amount=amount,
                student_id=student.id,
                sliding_scale_option_id=option_id,
                instance_id=None,  # No instance_id for membership
                class_name=f"Membership - {option.tier_name}",  # class_name for membership
                status='pending'
            )
            db.session.add(payment)
            db.session.commit()
            
            # Create Stripe checkout session
            success_url = f'http://localhost:3000/dashboard/student?membership=success&session_id={{CHECKOUT_SESSION_ID}}'
            cancel_url = 'http://localhost:3000/dashboard/student?membership=canceled'
            
            session = self._create_stripe_checkout_session(payment.id, success_url, cancel_url)
            
            return {
                "session_id": session.id,
                "url": session.url
            }
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error creating membership payment: {str(e)}")
    
    def activate_membership(self, payment_id: int) -> bool:
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
    
    def cancel_membership(self, clerk_user_id: str) -> Dict[str, Any]:
        """Cancel membership (set end date to day before next renewal)"""
        try:
            student = self.user_service.get_user_by_clerk_id(clerk_user_id)
            if not student or student.discriminator != 'student':
                raise ValueError("User not found or not a student")
            
            if not student.has_membership:
                raise ValueError("No active membership to cancel")
            
            membership = student.membership
            
            # Set end date to day before next renewal
            if membership.end_date:
                # If membership has an end date, set it to day before
                new_end_date = membership.end_date - timedelta(days=1)
            else:
                # If no end date, set to 30 days from now (day before next renewal)
                new_end_date = datetime.utcnow() + timedelta(days=29)
            
            membership.end_date = new_end_date
            db.session.commit()
            
            return {
                "cancellation_date": datetime.utcnow().isoformat(),
                "membership_end_date": new_end_date.isoformat(),
                "message": "Membership will remain active until the day before your next renewal"
            }
            
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Error canceling membership: {str(e)}")
    
    def get_membership_options(self) -> List[SlidingScaleOption]:
        """Get membership sliding scale options"""
        return SlidingScaleOption.query.filter_by(category='membership', is_active=True).all()
    
    def has_active_membership(self, clerk_user_id: str) -> bool:
        """Check if user has active membership"""
        try:
            membership_status = self.get_membership_status(clerk_user_id)
            return membership_status.get("has_membership", False)
        except:
            return False
    
    def _create_stripe_checkout_session(self, payment_id: int, success_url: str, cancel_url: str) -> stripe.checkout.Session:
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
                            'name': f"Membership - {option.tier_name}",
                            'description': option.description or f"Membership payment for {option.tier_name} tier"
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
    
    def can_book_class_for_free(self, clerk_user_id: str, class_start_time: datetime) -> Dict[str, Any]:
        """Check if student can book a class for free based on membership expiration vs class date"""
        try:
            membership_status = self.get_membership_status(clerk_user_id)
            
            if not membership_status.get("has_membership", False):
                return {
                    "can_book_free": False,
                    "reason": "No active membership",
                    "requires_payment": True
                }
            
            # Get membership end date
            end_date_str = membership_status.get("end_date")
            if not end_date_str:
                return {
                    "can_book_free": False,
                    "reason": "Membership has no expiration date",
                    "requires_payment": True
                }
            
            # Parse dates
            membership_end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            class_date = class_start_time.replace(tzinfo=None)  # Remove timezone for comparison
            membership_end_date = membership_end_date.replace(tzinfo=None)
            
            # Check if class is on or before membership expiration
            can_book_free = class_date <= membership_end_date
            
            return {
                "can_book_free": can_book_free,
                "reason": "Class is after membership expiration" if not can_book_free else "Class is within membership period",
                "requires_payment": not can_book_free,
                "membership_end_date": membership_end_date.isoformat(),
                "class_date": class_date.isoformat()
            }
            
        except Exception as e:
            print(f"[membership_service] Error checking free booking eligibility: {e}")
            return {
                "can_book_free": False,
                "reason": f"Error checking eligibility: {str(e)}",
                "requires_payment": True
            } 