#!/usr/bin/env python3
"""
Script to fix missing enrollments for completed payments
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from sqlalchemy import text

def fix_missing_enrollments():
    """Create missing enrollments for completed payments"""
    with app.app_context():
        print("🔄 Fixing missing enrollments for completed payments...")
        
        try:
            with db.engine.connect() as conn:
                # Find payments that are missing enrollments
                result = conn.execute(text("""
                    SELECT p.id, p.student_id, p.instance_id, p.class_name, p.status, p.date, u.name 
                    FROM payments p 
                    JOIN users u ON p.student_id = u.id 
                    LEFT JOIN class_enrollments ce ON p.id = ce.payment_id 
                    WHERE p.instance_id IS NOT NULL AND p.status = 'completed' AND ce.id IS NULL 
                    ORDER BY p.date DESC
                """))
                
                fixed_count = 0
                
                for row in result:
                    payment_id = row[0]
                    student_id = row[1]
                    instance_id = row[2]
                    class_name = row[3]
                    
                    print(f"🔧 Creating enrollment for payment {payment_id}: {class_name} ({instance_id})")
                    
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
                    
                    # Create the enrollment
                    conn.execute(text("""
                        INSERT INTO class_enrollments 
                        (student_id, instance_id, payment_id, payment_type, status, enrolled_at) 
                        VALUES (:student_id, :instance_id, :payment_id, :payment_type, 'enrolled', datetime('now'))
                    """), {
                        "student_id": student_id,
                        "instance_id": instance_id,
                        "payment_id": payment_id,
                        "payment_type": payment_type
                    })
                    
                    fixed_count += 1
                    print(f"✅ Created enrollment for payment {payment_id} with payment_type: {payment_type}")
                
                conn.commit()
            
            print(f"✅ Fixed {fixed_count} missing enrollments")
            
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
    fix_missing_enrollments() 