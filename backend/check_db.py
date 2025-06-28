#!/usr/bin/env python3
"""
Check database schema and data
"""
import sqlite3
import os

def check_database():
    """Check database schema and data"""
    
    db_path = 'instance/db.sqlite3'
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("🔍 Checking database schema...")
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"\n📋 Tables found: {len(tables)}")
        for table in tables:
            print(f"  - {table[0]}")
        
        # Check sliding_scale_options table structure
        print("\n🔍 Checking sliding_scale_options table...")
        try:
            cursor.execute("PRAGMA table_info(sliding_scale_options)")
            columns = cursor.fetchall()
            print(f"Columns in sliding_scale_options:")
            for column in columns:
                print(f"  - {column[1]} ({column[2]})")
            
            # Check if is_active column exists
            column_names = [col[1] for col in columns]
            if 'is_active' in column_names:
                print("✅ is_active column exists")
            else:
                print("❌ is_active column missing")
                
        except Exception as e:
            print(f"❌ Error checking sliding_scale_options: {e}")
        
        # Check data in sliding_scale_options
        try:
            cursor.execute("SELECT COUNT(*) FROM sliding_scale_options")
            count = cursor.fetchone()[0]
            print(f"\n📊 Found {count} sliding scale options")
            
            if count > 0:
                cursor.execute("SELECT * FROM sliding_scale_options LIMIT 3")
                options = cursor.fetchall()
                print("Sample data:")
                for option in options:
                    print(f"  - {option}")
                    
        except Exception as e:
            print(f"❌ Error checking data: {e}")
        
        # Check other important tables
        print("\n🔍 Checking other tables...")
        for table_name in ['users', 'studio_classes', 'class_instances']:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"  - {table_name}: {count} records")
            except Exception as e:
                print(f"  - {table_name}: Error - {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_database() 