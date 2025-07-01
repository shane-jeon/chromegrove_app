#!/usr/bin/env python3
"""
Migration script to create the class_credits table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from sqlalchemy import text

def migrate_create_class_credits_table():
    """Create the class_credits table if it does not exist"""
    with app.app_context():
        print("🔄 Creating class_credits table if not exists...")
        try:
            with db.engine.connect() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS class_credits (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        student_id INTEGER NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                        used BOOLEAN NOT NULL DEFAULT 0,
                        used_at DATETIME,
                        reason VARCHAR(64) NOT NULL,
                        source_enrollment_id INTEGER,
                        FOREIGN KEY(student_id) REFERENCES users(id),
                        FOREIGN KEY(source_enrollment_id) REFERENCES class_enrollments(id)
                    )
                """))
                conn.commit()
            print("✅ class_credits table created or already exists.")
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            raise e

if __name__ == "__main__":
    migrate_create_class_credits_table() 