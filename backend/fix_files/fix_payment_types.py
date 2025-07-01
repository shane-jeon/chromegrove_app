#!/usr/bin/env python3
"""
Script to fix payment_type values for enrollments that have payment_id but were incorrectly set to 'staff'
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from sqlalchemy import text

def fix_payment_types():
    """Fix payment_type values for enrollments with payment_id"""
    with app.app_context():
        print("🔄 Fixing payment_type values for enrollments with payment_id...")
        
        try:
            with db.engine.connect() as conn:
                # Find enrollments that have payment_id but payment_type is 'staff'
                result = conn.execute(text("""
                    SELECT id, student_id, payment_id, payment_type 
                    FROM class_enrollments 
                    WHERE payment_id IS NOT NULL AND payment_type = 'staff'
                """))
                
                fixed_count = 0
                
                for row in result:
                    enrollment_id = row[0]
                    student_id = row[1]
                    payment_id = row[2]
                    
                    # Check if user has membership
                    membership_result = conn.execute(text("""
                        SELECT m.id 
                        FROM memberships m 
                        JOIN users u ON u.membership_id = m.id 
                        WHERE u.id = :student_id AND u.type = 'student' 
                        AND m.start_date <= datetime('now') 
                        AND (m.end_date IS NULL OR m.end_date >= datetime('now'))
                    """), {"student_id": student_id})
                    
                    if membership_result.fetchone():
                        payment_type = 'membership'
                    else:
                        payment_type = 'drop-in'
                    
                    # Update the enrollment
                    conn.execute(text("""
                        UPDATE class_enrollments 
                        SET payment_type = :payment_type 
                        WHERE id = :enrollment_id
                    """), {"payment_type": payment_type, "enrollment_id": enrollment_id})
                    
                    fixed_count += 1
                    print(f"✅ Fixed enrollment {enrollment_id}: {row[3]} -> {payment_type}")
                
                conn.commit()
            
            print(f"✅ Fixed {fixed_count} enrollments")
            
            # Show updated summary
            with db.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT payment_type, COUNT(*) as count 
                    FROM class_enrollments 
                    GROUP BY payment_type
                """))
                
                print("\n📈 Updated Payment Type Distribution:")
                for row in result:
                    print(f"  {row[0]}: {row[1]}")
                    
        except Exception as e:
            print(f"❌ Fix failed: {e}")
            raise e

if __name__ == "__main__":
    fix_payment_types() 