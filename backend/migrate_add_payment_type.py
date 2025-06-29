#!/usr/bin/env python3
"""
Migration script to add payment_type field to ClassEnrollment
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import ClassEnrollment, Payment, User

def migrate_payment_types():
    """Migrate existing enrollments to have proper payment_type"""
    with app.app_context():
        print("🔄 Starting payment_type migration...")
        
        # Get all enrollments
        enrollments = ClassEnrollment.query.all()
        print(f"📊 Found {len(enrollments)} enrollments to migrate")
        
        updated_count = 0
        
        for enrollment in enrollments:
            # Determine payment type based on existing data
            if enrollment.payment_id is None:
                # No payment record - likely staff booking
                payment_type = 'staff'
            else:
                # Check if student has membership
                student = User.query.get(enrollment.student_id)
                if student and hasattr(student, 'membership') and student.membership and student.membership.is_active():
                    payment_type = 'membership'
                else:
                    payment_type = 'drop-in'
            
            # Update the enrollment
            enrollment.payment_type = payment_type
            updated_count += 1
            
            if updated_count % 10 == 0:
                print(f"✅ Updated {updated_count} enrollments...")
        
        # Commit all changes
        db.session.commit()
        print(f"✅ Migration complete! Updated {updated_count} enrollments")
        
        # Show summary
        payment_type_counts = db.session.query(
            ClassEnrollment.payment_type,
            db.func.count(ClassEnrollment.id)
        ).group_by(ClassEnrollment.payment_type).all()
        
        print("\n📈 Payment Type Distribution:")
        for payment_type, count in payment_type_counts:
            print(f"  {payment_type}: {count}")

if __name__ == "__main__":
    migrate_payment_types() 