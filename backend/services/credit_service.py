from typing import List, Optional
from datetime import datetime
from models import db, ClassCredit, ClassEnrollment, User

class CreditService:
    """Service layer for class credit business logic"""
    
    def __init__(self):
        pass
    
    def add_credit_for_cancellation(self, enrollment_id: int, reason: str) -> Optional[ClassCredit]:
        """Add a credit for a cancelled enrollment if eligible"""
        try:
            enrollment = ClassEnrollment.query.get(enrollment_id)
            if not enrollment:
                raise ValueError("Enrollment not found")
            
            # Check if this enrollment qualifies for a credit
            if not self._is_eligible_for_credit(enrollment):
                return None
            
            # Check if credit already exists for this enrollment
            existing_credit = ClassCredit.query.filter_by(
                source_enrollment_id=enrollment_id
            ).first()
            
            if existing_credit:
                return existing_credit  # Credit already exists
            
            # Create new credit
            credit = ClassCredit(
                student_id=enrollment.student_id,
                reason=reason,
                source_enrollment_id=enrollment_id
            )
            
            db.session.add(credit)
            db.session.commit()
            
            return credit
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def get_available_credits(self, student_id: int) -> List[ClassCredit]:
        """Get all available credits for a student"""
        return ClassCredit.query.filter_by(
            student_id=student_id,
            used=False
        ).order_by(ClassCredit.created_at.asc()).all()
    
    def get_credit_count(self, student_id: int) -> int:
        """Get the number of available credits for a student"""
        return ClassCredit.query.filter_by(
            student_id=student_id,
            used=False
        ).count()
    
    def use_credit(self, student_id: int) -> Optional[ClassCredit]:
        """Use one available credit for a student"""
        try:
            # Get the oldest available credit
            credit = ClassCredit.query.filter_by(
                student_id=student_id,
                used=False
            ).order_by(ClassCredit.created_at.asc()).first()
            
            if not credit:
                return None
            
            credit.use_credit()
            return credit
            
        except Exception as e:
            db.session.rollback()
            raise e
    
    def get_credit_history(self, student_id: int) -> List[ClassCredit]:
        """Get all credits for a student (used and unused)"""
        return ClassCredit.query.filter_by(
            student_id=student_id
        ).order_by(ClassCredit.created_at.desc()).all()
    
    def _is_eligible_for_credit(self, enrollment: ClassEnrollment) -> bool:
        """Check if an enrollment is eligible for a credit"""
        # Only drop-in payments are eligible for credits
        if enrollment.payment_type != 'drop-in':
            return False
        
        # Must be a cancelled enrollment
        if enrollment.status != 'cancelled':
            return False
        
        # Student must exist and be a student (not staff)
        student = User.query.get(enrollment.student_id)
        if not student or student.discriminator != 'student':
            return False
        
        return True 