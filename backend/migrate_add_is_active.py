#!/usr/bin/env python3
"""
Migration script to add is_active field to sliding_scale_options table
"""
import sqlite3
import os

def migrate_database():
    """Add is_active field to sliding_scale_options table"""
    
    # Database path
    db_path = 'instance/db.sqlite3'
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if is_active column already exists
        cursor.execute("PRAGMA table_info(sliding_scale_options)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_active' not in columns:
            print("Adding is_active column to sliding_scale_options table...")
            
            # Add is_active column with default value True
            cursor.execute("""
                ALTER TABLE sliding_scale_options 
                ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL
            """)
            
            # Update existing records to have is_active = True
            cursor.execute("""
                UPDATE sliding_scale_options 
                SET is_active = 1 
                WHERE is_active IS NULL
            """)
            
            conn.commit()
            print("✅ Successfully added is_active column to sliding_scale_options table")
        else:
            print("✅ is_active column already exists in sliding_scale_options table")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(sliding_scale_options)")
        columns = cursor.fetchall()
        print("\nCurrent sliding_scale_options table structure:")
        for column in columns:
            print(f"  - {column[1]} ({column[2]})")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate_database() 