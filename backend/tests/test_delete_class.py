#!/usr/bin/env python3
"""
Test script for the Delete Class functionality
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:5000/api"

def test_get_classes():
    """Test getting all classes"""
    print("Testing get classes...")
    response = requests.get(f"{BASE_URL}/studio-classes/list")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Found {len(data.get('classes', []))} classes")
        return data.get('classes', [])
    else:
        print(f"❌ Failed to get classes: {response.status_code}")
        return []

def test_cancel_single_class(instance_id):
    """Test canceling a single class instance"""
    print(f"Testing cancel single class: {instance_id}")
    
    payload = {
        "instance_id": instance_id,
        "scope": "single"
    }
    
    response = requests.post(
        f"{BASE_URL}/studio-classes/cancel",
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload)
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print("✅ Single class cancelled successfully")
            return True
        else:
            print(f"❌ Failed to cancel class: {data.get('error')}")
            return False
    else:
        print(f"❌ Request failed: {response.status_code}")
        return False

def test_cancel_future_classes(instance_id):
    """Test canceling future class instances"""
    print(f"Testing cancel future classes: {instance_id}")
    
    payload = {
        "instance_id": instance_id,
        "scope": "future"
    }
    
    response = requests.post(
        f"{BASE_URL}/studio-classes/cancel",
        headers={"Content-Type": "application/json"},
        data=json.dumps(payload)
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print("✅ Future classes cancelled successfully")
            return True
        else:
            print(f"❌ Failed to cancel future classes: {data.get('error')}")
            return False
    else:
        print(f"❌ Request failed: {response.status_code}")
        return False

def main():
    print("🧪 Testing Delete Class Functionality")
    print("=" * 50)
    
    # Test 1: Get all classes
    classes = test_get_classes()
    if not classes:
        print("❌ No classes found to test with")
        return
    
    # Test 2: Cancel a single class (use the first class)
    first_class = classes[0]
    instance_id = first_class.get('instance_id')
    
    if instance_id:
        print(f"\n📅 Testing with class: {first_class.get('class_name')}")
        print(f"   Instance ID: {instance_id}")
        print(f"   Start Time: {first_class.get('start_time')}")
        
        # Test single cancellation
        success = test_cancel_single_class(instance_id)
        
        if success:
            # Verify the class is no longer in the list
            updated_classes = test_get_classes()
            cancelled_class = next((c for c in updated_classes if c.get('instance_id') == instance_id), None)
            
            if not cancelled_class:
                print("✅ Class successfully removed from list")
            else:
                print("⚠️  Class still appears in list (might be a timing issue)")
        else:
            print("❌ Single class cancellation failed")
    else:
        print("❌ No valid instance_id found")

if __name__ == "__main__":
    main() 