#!/usr/bin/env python3
"""
Test script to verify staff functionality
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_staff_endpoints():
    """Test staff-related endpoints"""
    print("🧪 Testing Staff Functionality...")
    
    # Test 1: Get staff assigned classes
    print("\n1. Testing get staff assigned classes...")
    try:
        response = requests.get(f"{BASE_URL}/api/staff/assigned-classes?clerk_user_id=test_staff_1")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                classes = data.get('classes', [])
                print(f"✅ Staff assigned classes endpoint working - {len(classes)} classes found")
                for class_item in classes[:2]:  # Show first 2 classes
                    print(f"   - {class_item.get('class_name')} ({class_item.get('enrolled_count')} enrolled)")
            else:
                print(f"❌ Staff assigned classes failed: {data.get('error')}")
        else:
            print(f"❌ Staff assigned classes failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Staff assigned classes error: {e}")
    
    # Test 2: Get announcements for staff
    print("\n2. Testing staff announcements...")
    try:
        response = requests.get(f"{BASE_URL}/api/announcements?board_types=student,staff")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                announcements = data.get('announcements', [])
                print(f"✅ Staff announcements endpoint working - {len(announcements)} announcements found")
                for announcement in announcements[:2]:  # Show first 2 announcements
                    print(f"   - {announcement.get('title')} (by {announcement.get('author_name')})")
            else:
                print(f"❌ Staff announcements failed: {data.get('error')}")
        else:
            print(f"❌ Staff announcements failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Staff announcements error: {e}")
    
    # Test 3: Test attendance marking (this would need valid enrollment_id)
    print("\n3. Testing attendance marking...")
    try:
        # This would need a valid enrollment_id from the database
        test_data = {
            "enrollment_id": 1,  # This would need to be a real enrollment ID
            "status": "attended",
            "clerk_user_id": "test_staff_1"
        }
        response = requests.post(f"{BASE_URL}/api/attendance/mark", json=test_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Attendance marking endpoint working")
            else:
                print(f"ℹ️ Attendance marking (expected error): {data.get('error')}")
        else:
            print(f"ℹ️ Attendance marking (expected error): {response.status_code}")
    except Exception as e:
        print(f"❌ Attendance marking error: {e}")
    
    print("\n✅ Staff functionality test completed!")

if __name__ == "__main__":
    test_staff_endpoints() 