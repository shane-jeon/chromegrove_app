#!/usr/bin/env python3
"""
Migration script to add cancelled field to memberships table
"""

import sqlite3
import os

def migrate_add_cancelled_field():
    """Add cancelled field to memberships table"""
    
    # Get the database path
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'db.sqlite3')
    
    print(f"🔧 Adding cancelled field to memberships table in {db_path}")
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the column already exists
        cursor.execute("PRAGMA table_info(memberships)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'cancelled' in columns:
            print("✅ cancelled column already exists")
            return
        
        # Add the cancelled column
        cursor.execute("ALTER TABLE memberships ADD COLUMN cancelled BOOLEAN DEFAULT FALSE NOT NULL")
        
        # Commit the changes
        conn.commit()
        print("✅ Successfully added cancelled field to memberships table")
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(memberships)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"📋 Current columns in memberships table: {columns}")
        
    except Exception as e:
        print(f"❌ Error adding cancelled field: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_add_cancelled_field() 