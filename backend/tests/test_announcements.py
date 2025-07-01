#!/usr/bin/env python3
"""
Test script for the Announcement functionality
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

def test_get_announcements(board_types):
    """Test getting announcements for specific board types"""
    print(f"Testing get announcements for: {board_types}")
    
    response = requests.get(f"{BASE_URL}/announcements?board_types={board_types}")
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            announcements = data.get('announcements', [])
            print(f"✅ Found {len(announcements)} announcements")
            
            # Show details of each announcement
            for i, announcement in enumerate(announcements):
                print(f"  {i+1}. {announcement.get('title')} (Board: {announcement.get('board_type', 'unknown')})")
                print(f"     By: {announcement.get('author_name')} ({announcement.get('author_role')})")
                print(f"     Date: {announcement.get('date_created')}")
                print()
            
            return announcements
        else:
            print(f"❌ Failed to get announcements: {data.get('error')}")
            return []
    else:
        print(f"❌ Request failed: {response.status_code}")
        return []

def test_create_announcement(title, body, board_type, author_id=1):
    """Test creating an announcement"""
    print(f"Testing create announcement: {title} for {board_type}")
    
    payload = {
        "title": title,
        "body": body,
        "board_type": board_type,
        "author_id": author_id
    }
    
    response = requests.post(
        f"{BASE_URL}/announcements",
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload)
    )
    
    if response.status_code == 201:
        data = response.json()
        if data.get('success'):
            print("✅ Announcement created successfully")
            return True
        else:
            print(f"❌ Failed to create announcement: {data.get('error')}")
            return False
    else:
        print(f"❌ Request failed: {response.status_code}")
        return False

def main():
    print("🧪 Testing Announcement Functionality")
    print("=" * 50)
    
    # Test 1: Get student announcements
    print("\n📋 Test 1: Student Announcements")
    student_announcements = test_get_announcements("student")
    
    # Test 2: Get staff announcements
    print("\n📋 Test 2: Staff Announcements")
    staff_announcements = test_get_announcements("staff")
    
    # Test 3: Get all announcements (student, staff, all)
    print("\n📋 Test 3: All Announcements")
    all_announcements = test_get_announcements("student,staff,all")
    
    # Test 4: Create a test staff announcement
    print("\n📋 Test 4: Create Staff Announcement")
    success = test_create_announcement(
        "Test Staff Announcement",
        "This is a test announcement for staff only.",
        "staff"
    )
    
    if success:
        # Test 5: Verify the new announcement appears in staff announcements
        print("\n📋 Test 5: Verify New Staff Announcement")
        updated_staff_announcements = test_get_announcements("staff")
        
        # Check if our test announcement is there
        test_announcement = next(
            (a for a in updated_staff_announcements if a.get('title') == "Test Staff Announcement"),
            None
        )
        
        if test_announcement:
            print("✅ Test announcement found in staff announcements")
        else:
            print("❌ Test announcement not found in staff announcements")
    
    print("\n🎯 Summary:")
    print(f"  - Student announcements: {len(student_announcements)}")
    print(f"  - Staff announcements: {len(staff_announcements)}")
    print(f"  - All announcements: {len(all_announcements)}")
    
    # Verify that all announcements include student and staff
    if len(all_announcements) >= len(student_announcements) + len(staff_announcements):
        print("✅ All announcements correctly includes student and staff announcements")
    else:
        print("⚠️  All announcements may not include all types")

if __name__ == "__main__":
    main() 