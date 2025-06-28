#!/usr/bin/env python3
"""
Simple database update script
"""
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import SlidingScaleOption

def update_database():
    """Update database schema"""
    with app.app_context():
        try:
            # Create all tables (this will add missing columns)
            db.create_all()
            print("✅ Database schema updated successfully")
            
            # Check if sliding scale options exist
            options = SlidingScaleOption.query.all()
            print(f"Found {len(options)} sliding scale options")
            
            # Update existing options to have is_active = True
            for option in options:
                if not hasattr(option, 'is_active') or option.is_active is None:
                    option.is_active = True
            
            db.session.commit()
            print("✅ Updated existing sliding scale options")
            
        except Exception as e:
            print(f"❌ Error updating database: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    update_database() 