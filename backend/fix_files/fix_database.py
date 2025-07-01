#!/usr/bin/env python3
"""
Simple database fix script
"""
import sqlite3
import os

def fix_database():
    """Fix database schema by adding missing columns"""
    
    # Database path
    db_path = 'instance/db.sqlite3'
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔧 Checking database schema...")
        
        # Check if is_active column exists in sliding_scale_options
        cursor.execute("PRAGMA table_info(sliding_scale_options)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_active' not in columns:
            print("➕ Adding is_active column to sliding_scale_options table...")
            
            # Add is_active column
            cursor.execute("""
                ALTER TABLE sliding_scale_options 
                ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL
            """)
            
            # Update existing records
            cursor.execute("""
                UPDATE sliding_scale_options 
                SET is_active = 1 
                WHERE is_active IS NULL
            """)
            
            conn.commit()
            print("✅ Successfully added is_active column")
        else:
            print("✅ is_active column already exists")
        
        # Show current table structure
        cursor.execute("PRAGMA table_info(sliding_scale_options)")
        columns = cursor.fetchall()
        print("\n📋 Current sliding_scale_options table structure:")
        for column in columns:
            print(f"  - {column[1]} ({column[2]})")
        
        # Check if there are any sliding scale options
        cursor.execute("SELECT COUNT(*) FROM sliding_scale_options")
        count = cursor.fetchone()[0]
        print(f"\n📊 Found {count} sliding scale options")
        
        if count > 0:
            cursor.execute("SELECT tier_name, price_min, price_max, category FROM sliding_scale_options LIMIT 5")
            options = cursor.fetchall()
            print("\n💰 Sample sliding scale options:")
            for option in options:
                print(f"  - {option[0]}: ${option[1]}-${option[2]} ({option[3]})")
        
        conn.close()
        print("\n✅ Database fix completed successfully!")
        
    except Exception as e:
        print(f"❌ Error fixing database: {e}")
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    fix_database() 