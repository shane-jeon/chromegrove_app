#!/usr/bin/env python3
"""
Migration script to add attendance tracking fields to ClassEnrollment table
"""

import sqlite3
import os

def migrate_add_attendance_fields():
    """Add attendance tracking fields to ClassEnrollment table"""
    
    # Connect to the database
    db_path = 'instance/db.sqlite3'
    if not os.path.exists('instance'):
        os.makedirs('instance')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Add attendance_marked_at column
    try:
        cursor.execute('ALTER TABLE class_enrollments ADD COLUMN attendance_marked_at DATETIME')
        print("✅ Added attendance_marked_at column")
    except sqlite3.OperationalError:
        print("ℹ️ attendance_marked_at column already exists")
    
    # Add marked_by_staff_id column
    try:
        cursor.execute('ALTER TABLE class_enrollments ADD COLUMN marked_by_staff_id INTEGER')
        print("✅ Added marked_by_staff_id column")
    except sqlite3.OperationalError:
        print("ℹ️ marked_by_staff_id column already exists")
    
    # Add foreign key constraint for marked_by_staff_id
    try:
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_class_enrollments_marked_by_staff 
            ON class_enrollments(marked_by_staff_id)
        ''')
        print("✅ Added index for marked_by_staff_id")
    except sqlite3.OperationalError as e:
        print(f"ℹ️ Index creation: {e}")
    
    conn.commit()
    conn.close()
    
    print("✅ Migration completed successfully!")

if __name__ == "__main__":
    migrate_add_attendance_fields() 