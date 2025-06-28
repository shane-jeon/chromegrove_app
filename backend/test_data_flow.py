#!/usr/bin/env python3
"""
Comprehensive test script to verify the data flow between frontend and backend.
This script tests all the key endpoints and data relationships.
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000"

def test_api_endpoints():
    """Test all the API endpoints that the frontend uses."""
    print("🧪 Testing API Endpoints...")
    
    # Test 1: Ping endpoint
    print("\n1. Testing ping endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/ping")
        if response.status_code == 200:
            print("✅ Ping endpoint working")
        else:
            print(f"❌ Ping endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Ping endpoint error: {e}")
    
    # Test 2: Studio classes list
    print("\n2. Testing studio classes list...")
    try:
        response = requests.get(f"{BASE_URL}/api/studio-classes/list")
        if response.status_code == 200:
            data = response.json()
            classes = data.get('classes', [])
            print(f"✅ Studio classes endpoint working - {len(classes)} classes found")
            if classes:
                print(f"   Sample class: {classes[0].get('class_name')} (ID: {classes[0].get('instance_id')})")
        else:
            print(f"❌ Studio classes endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Studio classes endpoint error: {e}")
    
    # Test 3: Sliding scale options
    print("\n3. Testing sliding scale options...")
    try:
        response = requests.get(f"{BASE_URL}/api/sliding-scale-options?category=drop-in")
        if response.status_code == 200:
            data = response.json()
            options = data.get('options', [])
            print(f"✅ Sliding scale options endpoint working - {len(options)} options found")
            if options:
                print(f"   Sample option: {options[0].get('tier_name')} (${options[0].get('price_min')}-${options[0].get('price_max')})")
        else:
            print(f"❌ Sliding scale options endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Sliding scale options endpoint error: {e}")
    
    # Test 4: Announcements
    print("\n4. Testing announcements...")
    try:
        response = requests.get(f"{BASE_URL}/api/announcements?board_type=student")
        if response.status_code == 200:
            data = response.json()
            announcements = data.get('announcements', [])
            print(f"✅ Announcements endpoint working - {len(announcements)} announcements found")
            if announcements:
                print(f"   Sample announcement: {announcements[0].get('title')}")
        else:
            print(f"❌ Announcements endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Announcements endpoint error: {e}")

def test_user_creation():
    """Test user creation and retrieval."""
    print("\n🧪 Testing User Creation and Retrieval...")
    
    # Test user creation
    test_user_data = {
        "clerk_user_id": "test_user_123",
        "email": "test@example.com",
        "role": "student",
        "name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/users/create", json=test_user_data)
        if response.status_code == 201:
            data = response.json()
            if data.get('success'):
                user_id = data['user']['id']
                print(f"✅ User created successfully - ID: {user_id}")
                
                # Test user retrieval
                response = requests.get(f"{BASE_URL}/api/users/by-clerk-id?clerk_user_id=test_user_123")
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        print(f"✅ User retrieval working - Name: {data['user']['name']}")
                        return user_id
                    else:
                        print(f"❌ User retrieval failed: {data.get('error')}")
                else:
                    print(f"❌ User retrieval failed: {response.status_code}")
            else:
                print(f"❌ User creation failed: {data.get('error')}")
        else:
            print(f"❌ User creation failed: {response.status_code}")
    except Exception as e:
        print(f"❌ User creation error: {e}")
    
    return None

def test_class_booking_flow(user_id):
    """Test the complete class booking flow."""
    print(f"\n🧪 Testing Class Booking Flow (User ID: {user_id})...")
    
    # Get available classes
    try:
        response = requests.get(f"{BASE_URL}/api/studio-classes/list")
        if response.status_code != 200:
            print("❌ Cannot get classes for booking test")
            return
        
        classes = response.json().get('classes', [])
        if not classes:
            print("❌ No classes available for booking test")
            return
        
        class_instance = classes[0]
        instance_id = class_instance.get('instance_id')
        class_name = class_instance.get('class_name')
        
        print(f"   Using class: {class_name} (Instance: {instance_id})")
        
        # Get sliding scale options
        response = requests.get(f"{BASE_URL}/api/sliding-scale-options?category=drop-in")
        if response.status_code != 200:
            print("❌ Cannot get sliding scale options")
            return
        
        options = response.json().get('options', [])
        if not options:
            print("❌ No sliding scale options available")
            return
        
        option = options[0]
        print(f"   Using option: {option.get('tier_name')}")
        
        # Test checkout session creation
        checkout_data = {
            "student_id": user_id,
            "sliding_scale_option_id": option.get('id'),
            "class_name": class_name,
            "instance_id": instance_id,
            "custom_amount": option.get('price_min')
        }
        
        response = requests.post(f"{BASE_URL}/create-checkout-session", json=checkout_data)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Checkout session creation working")
                print(f"   Payment amount: ${checkout_data['custom_amount']}")
                return instance_id
            else:
                print(f"❌ Checkout session creation failed: {data.get('error')}")
        else:
            print(f"❌ Checkout session creation failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Class booking flow error: {e}")
    
    return None

def test_enrolled_classes(user_id):
    """Test enrolled classes endpoint."""
    print(f"\n🧪 Testing Enrolled Classes (User ID: {user_id})...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/students/enrolled-classes?student_id={user_id}")
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                classes = data.get('classes', [])
                enrolled_count = sum(1 for c in classes if c.get('is_enrolled'))
                print(f"✅ Enrolled classes endpoint working - {enrolled_count} enrolled classes")
                return classes
            else:
                print(f"❌ Enrolled classes failed: {data.get('error')}")
        else:
            print(f"❌ Enrolled classes failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Enrolled classes error: {e}")
    
    return []

def test_data_consistency():
    """Test data consistency between different endpoints."""
    print("\n🧪 Testing Data Consistency...")
    
    try:
        # Get all classes
        response = requests.get(f"{BASE_URL}/api/studio-classes/list")
        if response.status_code != 200:
            print("❌ Cannot get classes for consistency test")
            return
        
        all_classes = response.json().get('classes', [])
        if not all_classes:
            print("❌ No classes available for consistency test")
            return
        
        # Check that each class has required fields
        required_fields = ['instance_id', 'class_name', 'start_time', 'duration', 'max_capacity', 'enrolled_count']
        missing_fields = []
        
        for i, class_data in enumerate(all_classes):
            for field in required_fields:
                if field not in class_data:
                    missing_fields.append(f"Class {i}: {field}")
        
        if missing_fields:
            print(f"❌ Missing fields in class data: {missing_fields}")
        else:
            print("✅ All classes have required fields")
        
        # Check that instance_ids are unique
        instance_ids = [c.get('instance_id') for c in all_classes]
        unique_ids = set(instance_ids)
        if len(instance_ids) == len(unique_ids):
            print("✅ All instance IDs are unique")
        else:
            print("❌ Duplicate instance IDs found")
        
        # Check that start times are valid dates
        invalid_dates = []
        for i, class_data in enumerate(all_classes):
            try:
                datetime.fromisoformat(class_data.get('start_time').replace('Z', '+00:00'))
            except:
                invalid_dates.append(f"Class {i}: {class_data.get('start_time')}")
        
        if invalid_dates:
            print(f"❌ Invalid start times: {invalid_dates}")
        else:
            print("✅ All start times are valid")
            
    except Exception as e:
        print(f"❌ Data consistency test error: {e}")

def main():
    """Run all tests."""
    print("🚀 Starting Comprehensive Data Flow Test")
    print("=" * 50)
    
    # Test 1: API Endpoints
    test_api_endpoints()
    
    # Test 2: User Creation and Retrieval
    user_id = test_user_creation()
    
    # Test 3: Class Booking Flow
    if user_id:
        instance_id = test_class_booking_flow(user_id)
        
        # Test 4: Enrolled Classes
        enrolled_classes = test_enrolled_classes(user_id)
    
    # Test 5: Data Consistency
    test_data_consistency()
    
    print("\n" + "=" * 50)
    print("🎉 Data Flow Test Complete!")
    print("\n📋 Summary:")
    print("- All endpoints should return 200 status codes")
    print("- User creation and retrieval should work")
    print("- Class booking flow should create checkout sessions")
    print("- Data should be consistent across endpoints")
    print("- Instance IDs should be unique")
    print("- All required fields should be present")

if __name__ == "__main__":
    main() 