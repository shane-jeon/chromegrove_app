from models import db, Payment, SlidingScaleOption
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
import stripe
import os


class PaymentService:
    """Service class for payment-related business logic"""
    
    @staticmethod
    def get_sliding_scale_options() -> List[SlidingScaleOption]:
        """Get drop-in sliding scale options only"""
        return SlidingScaleOption.query.filter_by(category='drop-in').all()
    
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
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == 'paid':
                payment_id = int(session.metadata.get('payment_id'))
                payment = db.session.get(Payment, payment_id)
                if payment:
                    payment.status = 'completed'
                    db.session.commit()
                    return payment
            return None
        except Exception as e:
            raise e
    
    @staticmethod
    def handle_webhook_event(event: Dict[str, Any]) -> bool:
        """Handle Stripe webhook events"""
        try:
            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']
                payment_id = session.get('metadata', {}).get('payment_id')
                if payment_id:
                    payment = db.session.get(Payment, int(payment_id))
                    if payment:
                        payment.status = 'completed'
                        db.session.commit()
                        return True
            return False
        except Exception as e:
            raise e
    
    @staticmethod
    def get_payment_by_id(payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        return db.session.get(Payment, payment_id)
    
    @staticmethod
    def get_payments_by_student(student_id: int) -> List[Payment]:
        """Get all payments for a student"""
        return Payment.query.filter_by(student_id=student_id).all() 