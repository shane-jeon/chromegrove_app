#!/usr/bin/env python3
"""
Debug script to test schedule functionality
"""

import os
import sys
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, ClassInstance, StudioClass

def debug_schedule():
    """Debug the schedule functionality"""
    print("🔍 Debugging Schedule Functionality...")
    
    with app.app_context():
        try:
            # Check if we have any class instances
            instances = ClassInstance.query.all()
            print(f"📊 Total class instances: {len(instances)}")
            
            if instances:
                print("\n📅 Sample instances:")
                for i, instance in enumerate(instances[:3]):
                    print(f"  {i+1}. {instance.instance_id}")
                    print(f"     Class ID: {instance.class_id}")
                    print(f"     Start Time: {instance.start_time}")
                    print(f"     End Time: {instance.end_time}")
                    print(f"     Is Cancelled: {instance.is_cancelled}")
                    print(f"     Max Capacity: {instance.max_capacity}")
                    print(f"     Enrolled Count: {instance.enrolled_count}")
                    print()
            
            # Check if we have any studio classes
            studio_classes = StudioClass.query.all()
            print(f"📚 Total studio classes: {len(studio_classes)}")
            
            if studio_classes:
                print("\n🏫 Sample studio classes:")
                for i, studio_class in enumerate(studio_classes[:3]):
                    print(f"  {i+1}. {studio_class.class_name}")
                    print(f"     ID: {studio_class.id}")
                    print(f"     Instructor ID: {studio_class.instructor_id}")
                    print(f"     Duration: {studio_class.duration}")
                    print(f"     Max Capacity: {studio_class.max_capacity}")
                    print()
            
            # Test the find_future_instances method
            print("\n🔮 Testing find_future_instances...")
            from repositories.class_repository import ClassInstanceRepository
            repo = ClassInstanceRepository()
            
            try:
                future_instances = repo.find_future_instances()
                print(f"✅ Found {len(future_instances)} future instances")
                
                if future_instances:
                    print("\n📅 Future instances:")
                    for i, instance in enumerate(future_instances[:3]):
                        print(f"  {i+1}. {instance.instance_id} - {instance.start_time}")
                else:
                    print("⚠️ No future instances found")
                    
            except Exception as e:
                print(f"❌ Error in find_future_instances: {e}")
                import traceback
                traceback.print_exc()
            
            # Test the get_upcoming_classes method
            print("\n🔮 Testing get_upcoming_classes...")
            from services.class_service import ClassService
            service = ClassService()
            
            try:
                upcoming_classes = service.get_upcoming_classes()
                print(f"✅ Found {len(upcoming_classes)} upcoming classes")
                
                if upcoming_classes:
                    print("\n📅 Upcoming classes:")
                    for i, instance in enumerate(upcoming_classes[:3]):
                        print(f"  {i+1}. {instance.instance_id} - {instance.start_time}")
                else:
                    print("⚠️ No upcoming classes found")
                    
            except Exception as e:
                print(f"❌ Error in get_upcoming_classes: {e}")
                import traceback
                traceback.print_exc()
            
        except Exception as e:
            print(f"❌ General error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    debug_schedule() 