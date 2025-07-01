#!/usr/bin/env python3
"""
Test script for class credit functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, Student, ClassInstance, ClassEnrollment, ClassCredit, StudioClass
from services.credit_service import CreditService
from services.class_service import ClassService
from datetime import datetime, timedelta

def test_credit_functionality():
    """Test the complete credit functionality flow"""
    with app.app_context():
        print("🧪 Testing Class Credit Functionality")
        print("=" * 50)
        
        # Create test data
        print("\n1. Creating test data...")
        
        # Create a test student
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        student = Student(
            clerk_user_id=f"test_student_{timestamp}",
            email=f"test_{timestamp}@example.com",
            name="Test Student",
            role="student"
        )
        db.session.add(student)
        
        # Create a test class
        studio_class = StudioClass(
            class_name="Test Yoga Class",
            description="A test yoga class",
            start_time=datetime.utcnow() + timedelta(days=1),
            duration=60,
            instructor_id=1,  # Assuming instructor exists
            max_capacity=10
        )
        db.session.add(studio_class)
        db.session.commit()
        
        # Create a class instance
        instance = ClassInstance(
            instance_id=f"{studio_class.id}_{datetime.utcnow().strftime('%Y%m%d%H%M')}",
            class_id=studio_class.id,
            start_time=datetime.utcnow() + timedelta(days=1),
            end_time=datetime.utcnow() + timedelta(days=1, hours=1),
            max_capacity=10
        )
        db.session.add(instance)
        db.session.commit()
        
        print(f"✅ Created test student (ID: {student.id})")
        print(f"✅ Created test class (ID: {studio_class.id})")
        print(f"✅ Created test instance (ID: {instance.instance_id})")
        
        # Test 1: Initial credit count should be 0
        print("\n2. Testing initial credit count...")
        credit_service = CreditService()
        initial_credits = credit_service.get_credit_count(student.id)
        print(f"Initial credit count: {initial_credits}")
        assert initial_credits == 0, f"Expected 0 credits, got {initial_credits}"
        print("✅ Initial credit count is 0")
        
        # Test 2: Create a drop-in enrollment
        print("\n3. Creating drop-in enrollment...")
        enrollment = ClassEnrollment(
            student_id=student.id,
            instance_id=instance.instance_id,
            payment_type="drop-in",
            status="enrolled"
        )
        db.session.add(enrollment)
        db.session.commit()
        print(f"✅ Created drop-in enrollment (ID: {enrollment.id})")
        
        # Test 3: Cancel the enrollment and check for credit
        print("\n4. Cancelling enrollment and checking for credit...")
        class_service = ClassService()
        success = class_service.cancel_enrollment(student.id, instance.instance_id)
        print(f"Cancel enrollment result: {success}")
        
        # Check if credit was created
        credits_after_cancel = credit_service.get_credit_count(student.id)
        print(f"Credits after cancellation: {credits_after_cancel}")
        assert credits_after_cancel == 1, f"Expected 1 credit, got {credits_after_cancel}"
        print("✅ Credit issued after drop-in cancellation")
        
        # Test 4: Create another instance for credit booking
        print("\n5. Creating another instance for credit booking...")
        instance2 = ClassInstance(
            instance_id=f"{studio_class.id}_{datetime.utcnow().strftime('%Y%m%d%H%M')}_2",
            class_id=studio_class.id,
            start_time=datetime.utcnow() + timedelta(days=2),
            end_time=datetime.utcnow() + timedelta(days=2, hours=1),
            max_capacity=10
        )
        db.session.add(instance2)
        db.session.commit()
        print(f"✅ Created second test instance (ID: {instance2.instance_id})")
        
        # Test 5: Use credit to book the new class
        print("\n6. Testing credit-based booking...")
        success = class_service.book_class(
            student.id, 
            instance2.instance_id, 
            payment_type="credit"
        )
        print(f"Credit booking result: {success}")
        
        # Check if credit was used
        credits_after_booking = credit_service.get_credit_count(student.id)
        print(f"Credits after credit booking: {credits_after_booking}")
        assert credits_after_booking == 0, f"Expected 0 credits, got {credits_after_booking}"
        print("✅ Credit used for booking")
        
        # Check if enrollment was created
        enrollment2 = ClassEnrollment.query.filter_by(
            student_id=student.id,
            instance_id=instance2.instance_id,
            status="enrolled"
        ).first()
        assert enrollment2 is not None, "Enrollment not created"
        assert enrollment2.payment_type == "credit", f"Expected payment_type 'credit', got '{enrollment2.payment_type}'"
        print("✅ Credit-based enrollment created with correct payment_type")
        
        # Test 6: Verify credit history
        print("\n7. Testing credit history...")
        credit_history = credit_service.get_credit_history(student.id)
        print(f"Credit history count: {len(credit_history)}")
        assert len(credit_history) == 1, f"Expected 1 credit in history, got {len(credit_history)}"
        
        credit = credit_history[0]
        print(f"Credit details: ID={credit.id}, used={credit.used}, reason={credit.reason}")
        assert credit.used == True, "Credit should be marked as used"
        assert credit.reason == "cancellation by student", f"Expected reason 'cancellation by student', got '{credit.reason}'"
        print("✅ Credit history is correct")
        
        # Test 7: Try to use credit when none available
        print("\n8. Testing credit usage when none available...")
        instance3 = ClassInstance(
            instance_id=f"{studio_class.id}_{datetime.utcnow().strftime('%Y%m%d%H%M')}_3",
            class_id=studio_class.id,
            start_time=datetime.utcnow() + timedelta(days=3),
            end_time=datetime.utcnow() + timedelta(days=3, hours=1),
            max_capacity=10
        )
        db.session.add(instance3)
        db.session.commit()
        
        try:
            success = class_service.book_class(
                student.id, 
                instance3.instance_id, 
                payment_type="credit"
            )
            assert False, "Should have raised an exception for no available credits"
        except Exception as e:
            print(f"✅ Correctly prevented credit booking when no credits available: {e}")
        
        print("\n🎉 All credit functionality tests passed!")
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        db.session.delete(enrollment2)
        db.session.delete(enrollment)
        db.session.delete(instance3)
        db.session.delete(instance2)
        db.session.delete(instance)
        db.session.delete(studio_class)
        db.session.delete(student)
        db.session.commit()
        print("✅ Test data cleaned up")

if __name__ == "__main__":
    test_credit_functionality() 