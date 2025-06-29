#!/usr/bin/env python3
"""
Migration script to update payment_type values in class_enrollments table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from sqlalchemy import text

def migrate_update_payment_type_values():
    """Update payment_type values for existing class_enrollments"""
    with app.app_context():
        print("🔄 Updating payment_type values in class_enrollments table...")
        try:
            with db.engine.connect() as conn:
                # Get all enrollments
                result = conn.execute(text("""
                    SELECT id, payment_id, student_id 
                    FROM class_enrollments
                """))
                
                updated_count = 0
                
                for row in result:
                    enrollment_id = row[0]
                    payment_id = row[1]
                    student_id = row[2]
                    
                    # Determine payment type
                    if payment_id is None:
                        payment_type = 'staff'
                    else:
                        # Check if user has membership (users table, discriminator='student')
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
                    
                    updated_count += 1
                    
                    if updated_count % 10 == 0:
                        print(f"✅ Updated {updated_count} enrollments...")
                
                conn.commit()
            
            print(f"✅ Migration complete! Updated {updated_count} enrollments")
            
            # Show summary
            with db.engine.connect() as conn:
                result = conn.execute(text("""
                    SELECT payment_type, COUNT(*) as count 
                    FROM class_enrollments 
                    GROUP BY payment_type
                """))
                
                print("\n📈 Payment Type Distribution:")
                for row in result:
                    print(f"  {row[0]}: {row[1]}")
                    
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise e

if __name__ == "__main__":
    migrate_update_payment_type_values() 