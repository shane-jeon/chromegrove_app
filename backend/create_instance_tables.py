#!/usr/bin/env python3
"""
Script to create the new ClassInstance and ClassEnrollment tables
and migrate existing data if needed.
"""

import sqlite3
from datetime import datetime, timedelta
import os

def create_instance_tables():
    """Create the new ClassInstance and ClassEnrollment tables."""
    
    # Connect to the database
    db_path = 'instance/db.sqlite3'
    if not os.path.exists('instance'):
        os.makedirs('instance')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create ClassInstance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS class_instances (
            instance_id VARCHAR(50) PRIMARY KEY,
            class_id INTEGER NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            max_capacity INTEGER NOT NULL,
            is_cancelled BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES studio_classes (id)
        )
    ''')
    
    # Create ClassEnrollment table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS class_enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            instance_id VARCHAR(50) NOT NULL,
            payment_id INTEGER,
            status VARCHAR(32) DEFAULT 'enrolled',
            enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            cancelled_at DATETIME,
            FOREIGN KEY (student_id) REFERENCES users (id),
            FOREIGN KEY (instance_id) REFERENCES class_instances (instance_id),
            FOREIGN KEY (payment_id) REFERENCES payments (id)
        )
    ''')
    
    # Add instance_id and class_name columns to payments table if they don't exist
    try:
        cursor.execute('ALTER TABLE payments ADD COLUMN instance_id VARCHAR(50)')
    except sqlite3.OperationalError:
        # Column already exists
        pass
    
    try:
        cursor.execute('ALTER TABLE payments ADD COLUMN class_name VARCHAR(255)')
    except sqlite3.OperationalError:
        # Column already exists
        pass
    
    # Create indexes for better performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_class_instances_class_id ON class_instances(class_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_class_instances_start_time ON class_instances(start_time)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON class_enrollments(student_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_class_enrollments_instance_id ON class_enrollments(instance_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_payments_instance_id ON payments(instance_id)')
    
    conn.commit()
    conn.close()
    
    print("✅ ClassInstance and ClassEnrollment tables created successfully!")

def populate_class_instances():
    """Populate ClassInstance table with instances from existing studio classes."""
    
    conn = sqlite3.connect('instance/db.sqlite3')
    cursor = conn.cursor()
    
    # Get all studio classes
    cursor.execute('SELECT id, class_name, start_time, duration, max_capacity, recurrence_pattern FROM studio_classes')
    classes = cursor.fetchall()
    
    now = datetime.now()
    three_months_later = now + timedelta(days=90)
    
    for class_data in classes:
        class_id, class_name, start_time, duration, max_capacity, recurrence_pattern = class_data
        
        # Parse start_time
        if isinstance(start_time, str):
            start_time = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        
        # Generate instances based on recurrence pattern
        if recurrence_pattern and recurrence_pattern.lower() in ['weekly', 'bi-weekly', 'monthly']:
            current_time = start_time
            
            while current_time <= three_months_later:
                # Create instance_id
                instance_id = f"{class_id}_{current_time.strftime('%Y%m%d%H%M')}"
                
                # Calculate end_time
                end_time = current_time + timedelta(minutes=duration)
                
                # Insert class instance
                cursor.execute('''
                    INSERT OR IGNORE INTO class_instances 
                    (instance_id, class_id, start_time, end_time, max_capacity)
                    VALUES (?, ?, ?, ?, ?)
                ''', (instance_id, class_id, current_time, end_time, max_capacity))
                
                # Calculate next occurrence
                if recurrence_pattern.lower() == 'weekly':
                    current_time += timedelta(weeks=1)
                elif recurrence_pattern.lower() == 'bi-weekly':
                    current_time += timedelta(weeks=2)
                elif recurrence_pattern.lower() == 'monthly':
                    # Add one month
                    year = current_time.year + (current_time.month + 1 - 1) // 12
                    month = (current_time.month + 1) % 12
                    if month == 0:
                        month = 12
                    day = min(current_time.day, [31,29 if year%4==0 and (year%100!=0 or year%400==0) else 28,31,30,31,30,31,31,30,31,30,31][month-1])
                    current_time = current_time.replace(year=year, month=month, day=day)
        else:
            # One-time class
            instance_id = f"{class_id}_{start_time.strftime('%Y%m%d%H%M')}"
            end_time = start_time + timedelta(minutes=duration)
            
            cursor.execute('''
                INSERT OR IGNORE INTO class_instances 
                (instance_id, class_id, start_time, end_time, max_capacity)
                VALUES (?, ?, ?, ?, ?)
            ''', (instance_id, class_id, start_time, end_time, max_capacity))
    
    conn.commit()
    conn.close()
    
    print("✅ Class instances populated successfully!")

def migrate_existing_enrollments():
    """Migrate existing enrollments from the old system to the new ClassEnrollment table."""
    
    conn = sqlite3.connect('instance/db.sqlite3')
    cursor = conn.cursor()
    
    # Get existing enrollments
    cursor.execute('SELECT user_id, class_id FROM enrollments')
    enrollments = cursor.fetchall()
    
    migrated_count = 0
    
    for user_id, class_id in enrollments:
        # Get all instances for this class
        cursor.execute('SELECT instance_id FROM class_instances WHERE class_id = ?', (class_id,))
        instances = cursor.fetchall()
        
        for (instance_id,) in instances:
            # Check if enrollment already exists
            cursor.execute('''
                SELECT id FROM class_enrollments 
                WHERE student_id = ? AND instance_id = ?
            ''', (user_id, instance_id))
            
            if not cursor.fetchone():
                # Create enrollment for this instance
                cursor.execute('''
                    INSERT INTO class_enrollments 
                    (student_id, instance_id, status, enrolled_at)
                    VALUES (?, ?, 'enrolled', CURRENT_TIMESTAMP)
                ''', (user_id, instance_id))
                migrated_count += 1
    
    conn.commit()
    conn.close()
    
    print(f"✅ Migrated {migrated_count} enrollments to the new system!")

if __name__ == '__main__':
    print("🔄 Creating new ClassInstance and ClassEnrollment tables...")
    create_instance_tables()
    
    print("🔄 Populating class instances...")
    populate_class_instances()
    
    print("🔄 Migrating existing enrollments...")
    migrate_existing_enrollments()
    
    print("🎉 Database migration completed successfully!") 