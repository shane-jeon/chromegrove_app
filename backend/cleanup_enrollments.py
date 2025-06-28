#!/usr/bin/env python3
"""
Migration script to clean up the old enrollments table and set up assignment tables.
This script should be run after the new ClassInstance-based enrollment system is in place.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import *

def cleanup_enrollments_table():
    """Remove the old enrollments table since it's no longer needed."""
    print("Cleaning up old enrollments table...")
    
    with app.app_context():
        try:
            # Drop the old enrollments table using modern SQLAlchemy syntax
            with db.engine.connect() as conn:
                conn.execute(db.text("DROP TABLE IF EXISTS enrollments"))
                conn.commit()
            print("✓ Dropped enrollments table")
            
            # Verify the new tables exist and have data
            class_enrollments_count = ClassEnrollment.query.count()
            print(f"✓ ClassEnrollments table has {class_enrollments_count} records")
            
            # Count staff assignments using modern syntax
            with db.engine.connect() as conn:
                result = conn.execute(db.text("SELECT COUNT(*) FROM staff_assignments"))
                staff_assignments_count = result.scalar()
            print(f"✓ StaffAssignments table has {staff_assignments_count} records")
            
            # Count management assignments using modern syntax
            with db.engine.connect() as conn:
                result = conn.execute(db.text("SELECT COUNT(*) FROM management_assignments"))
                management_assignments_count = result.scalar()
            print(f"✓ ManagementAssignments table has {management_assignments_count} records")
            
            print("\nCleanup completed successfully!")
            
        except Exception as e:
            print(f"Error during cleanup: {e}")
            db.session.rollback()

def verify_assignment_functionality():
    """Verify that the assignment functionality is working correctly."""
    print("\nVerifying assignment functionality...")
    
    with app.app_context():
        try:
            # Check if we have any studio classes
            studio_classes = StudioClass.query.all()
            print(f"Found {len(studio_classes)} studio classes")
            
            for studio_class in studio_classes:
                print(f"\nClass: {studio_class.class_name}")
                
                # Check instructor assignment using modern syntax
                instructor = db.session.get(User, studio_class.instructor_id)
                if instructor:
                    print(f"  Instructor: {instructor.name} (ID: {instructor.id})")
                    
                    # Verify instructor is in staff_assignments using modern syntax
                    with db.engine.connect() as conn:
                        result = conn.execute(
                            db.text("SELECT COUNT(*) FROM staff_assignments WHERE staff_id = :staff_id AND class_id = :class_id"),
                            {"staff_id": instructor.id, "class_id": studio_class.id}
                        )
                        staff_assignment = result.scalar()
                    
                    if staff_assignment > 0:
                        print(f"  ✓ Instructor properly assigned to staff_assignments")
                    else:
                        print(f"  ⚠ Instructor NOT in staff_assignments - adding...")
                        studio_class.add_staff_member(instructor)
                
                # Check management assignments
                managers = studio_class.get_managers_list()
                if managers:
                    print(f"  Managers: {[m.name for m in managers]}")
                else:
                    print(f"  No managers assigned")
                
                # Check staff assignments
                staff = studio_class.get_assigned_staff_list()
                if staff:
                    print(f"  Staff: {[s.name for s in staff]}")
                else:
                    print(f"  No additional staff assigned")
            
            print("\n✓ Assignment functionality verification completed!")
            
        except Exception as e:
            print(f"Error during verification: {e}")

def add_sample_assignments():
    """Add some sample assignments for testing purposes."""
    print("\nAdding sample assignments...")
    
    with app.app_context():
        try:
            # Get some sample data using modern syntax
            studio_classes = StudioClass.query.limit(3).all()
            staff_members = User.query.filter_by(discriminator='staff').limit(2).all()
            managers = User.query.filter_by(discriminator='management').limit(2).all()
            
            if not studio_classes:
                print("No studio classes found to assign")
                return
                
            if not staff_members:
                print("No staff members found to assign")
                return
                
            if not managers:
                print("No managers found to assign")
                return
            
            # Add some sample assignments
            for i, studio_class in enumerate(studio_classes):
                # Add a manager if we have one
                if managers:
                    manager = managers[i % len(managers)]
                    if manager not in studio_class.managers:
                        studio_class.add_manager(manager)
                        print(f"✓ Added manager {manager.name} to {studio_class.class_name}")
                
                # Add additional staff if we have them
                if staff_members:
                    staff = staff_members[i % len(staff_members)]
                    if staff not in studio_class.assigned_staff:
                        studio_class.add_staff_member(staff)
                        print(f"✓ Added staff {staff.name} to {studio_class.class_name}")
            
            print("✓ Sample assignments added!")
            
        except Exception as e:
            print(f"Error adding sample assignments: {e}")

if __name__ == "__main__":
    print("=== Enrollment Table Cleanup and Assignment Setup ===")
    
    # Step 1: Clean up old enrollments table
    cleanup_enrollments_table()
    
    # Step 2: Verify assignment functionality
    verify_assignment_functionality()
    
    # Step 3: Add sample assignments (optional)
    response = input("\nWould you like to add sample assignments for testing? (y/n): ")
    if response.lower() == 'y':
        add_sample_assignments()
    
    print("\n=== Migration completed! ===") 