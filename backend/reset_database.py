#!/usr/bin/env python3
"""
Reset and recreate database with correct schema
"""
import os
import sqlite3

def reset_database():
    """Reset and recreate database"""
    
    db_path = 'instance/db.sqlite3'
    
    # Backup existing database
    if os.path.exists(db_path):
        backup_path = f"{db_path}.backup"
        print(f"📦 Backing up existing database to {backup_path}")
        os.rename(db_path, backup_path)
    
    print("🔄 Creating new database...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create tables with correct schema
        print("📋 Creating tables...")
        
        # Users table
        cursor.execute("""
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clerk_user_id VARCHAR(128) UNIQUE NOT NULL,
                email VARCHAR(255),
                name VARCHAR(128),
                role VARCHAR(32) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                type VARCHAR(50)
            )
        """)
        
        # Studio classes table
        cursor.execute("""
            CREATE TABLE studio_classes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                class_name VARCHAR(128) NOT NULL,
                description TEXT,
                start_time DATETIME NOT NULL,
                duration INTEGER NOT NULL,
                instructor_id INTEGER NOT NULL,
                max_capacity INTEGER NOT NULL,
                requirements TEXT,
                recommended_attire VARCHAR(255),
                recurrence_pattern VARCHAR(64),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                deleted_at DATETIME,
                creator_id INTEGER,
                FOREIGN KEY (instructor_id) REFERENCES users (id),
                FOREIGN KEY (creator_id) REFERENCES users (id)
            )
        """)
        
        # Class instances table
        cursor.execute("""
            CREATE TABLE class_instances (
                instance_id VARCHAR(50) PRIMARY KEY,
                class_id INTEGER NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                max_capacity INTEGER NOT NULL,
                is_cancelled BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                FOREIGN KEY (class_id) REFERENCES studio_classes (id)
            )
        """)
        
        # Sliding scale options table
        cursor.execute("""
            CREATE TABLE sliding_scale_options (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tier_name VARCHAR(64) NOT NULL,
                price_min FLOAT NOT NULL,
                price_max FLOAT NOT NULL,
                description TEXT,
                category VARCHAR(64) NOT NULL,
                stripe_price_id VARCHAR(255),
                is_active BOOLEAN DEFAULT 1 NOT NULL
            )
        """)
        
        # Payments table
        cursor.execute("""
            CREATE TABLE payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                amount FLOAT NOT NULL,
                date DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'pending',
                student_id INTEGER NOT NULL,
                sliding_scale_option_id INTEGER NOT NULL,
                instance_id VARCHAR(50),
                class_name VARCHAR(255),
                FOREIGN KEY (student_id) REFERENCES users (id),
                FOREIGN KEY (sliding_scale_option_id) REFERENCES sliding_scale_options (id),
                FOREIGN KEY (instance_id) REFERENCES class_instances (instance_id)
            )
        """)
        
        # Class enrollments table
        cursor.execute("""
            CREATE TABLE class_enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                instance_id VARCHAR(50) NOT NULL,
                payment_id INTEGER,
                status VARCHAR(32) NOT NULL DEFAULT 'enrolled',
                enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                cancelled_at DATETIME,
                FOREIGN KEY (student_id) REFERENCES users (id),
                FOREIGN KEY (instance_id) REFERENCES class_instances (instance_id),
                FOREIGN KEY (payment_id) REFERENCES payments (id)
            )
        """)
        
        # Staff assignments table
        cursor.execute("""
            CREATE TABLE staff_assignments (
                class_id INTEGER NOT NULL,
                staff_id INTEGER NOT NULL,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                PRIMARY KEY (class_id, staff_id),
                FOREIGN KEY (class_id) REFERENCES studio_classes (id),
                FOREIGN KEY (staff_id) REFERENCES users (id)
            )
        """)
        
        # Management assignments table
        cursor.execute("""
            CREATE TABLE management_assignments (
                class_id INTEGER NOT NULL,
                manager_id INTEGER NOT NULL,
                assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                PRIMARY KEY (class_id, manager_id),
                FOREIGN KEY (class_id) REFERENCES studio_classes (id),
                FOREIGN KEY (manager_id) REFERENCES users (id)
            )
        """)
        
        # Bulletin boards table
        cursor.execute("""
            CREATE TABLE bulletin_boards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                board_type VARCHAR(32) NOT NULL
            )
        """)
        
        # Announcements table
        cursor.execute("""
            CREATE TABLE announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(255) NOT NULL,
                body TEXT NOT NULL,
                date_created DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                author_id INTEGER NOT NULL,
                board_id INTEGER NOT NULL,
                FOREIGN KEY (author_id) REFERENCES users (id),
                FOREIGN KEY (board_id) REFERENCES bulletin_boards (id)
            )
        """)
        
        # Memberships table
        cursor.execute("""
            CREATE TABLE memberships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                membership_type VARCHAR(64) NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME
            )
        """)
        
        conn.commit()
        print("✅ Tables created successfully")
        
        # Insert sample data
        print("📝 Inserting sample data...")
        
        # Insert sample sliding scale options
        cursor.execute("""
            INSERT INTO sliding_scale_options (tier_name, price_min, price_max, description, category, is_active)
            VALUES 
            ('Tier A', 15.00, 20.00, 'Standard drop-in rate', 'drop-in', 1),
            ('Tier B', 10.00, 15.00, 'Reduced rate for students', 'drop-in', 1),
            ('Tier C', 5.00, 10.00, 'Community rate', 'drop-in', 1),
            ('Monthly Basic', 80.00, 100.00, 'Monthly membership', 'membership', 1),
            ('Monthly Premium', 120.00, 150.00, 'Premium monthly membership', 'membership', 1)
        """)
        
        # Insert sample bulletin board
        cursor.execute("""
            INSERT INTO bulletin_boards (board_type)
            VALUES ('student')
        """)
        
        conn.commit()
        print("✅ Sample data inserted")
        
        # Verify the data
        cursor.execute("SELECT COUNT(*) FROM sliding_scale_options")
        count = cursor.fetchone()[0]
        print(f"📊 Inserted {count} sliding scale options")
        
        conn.close()
        print("✅ Database reset completed successfully!")
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    reset_database() 