#!/usr/bin/env python3
"""
Test script for payment API endpoints
"""
import requests
import json

def test_payment_api():
    """Test payment API endpoints"""
    base_url = "http://localhost:5000"
    
    print("🧪 Testing Payment API Endpoints...")
    
    # Test 1: Get sliding scale options
    print("\n1. Testing GET /api/sliding-scale-options")
    try:
        response = requests.get(f"{base_url}/api/sliding-scale-options")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success')}")
            options = data.get('options', [])
            print(f"Found {len(options)} options:")
            for option in options:
                print(f"  - {option.get('tier_name')}: ${option.get('price_min')}-${option.get('price_max')}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 2: Get all sliding scale options
    print("\n2. Testing GET /api/sliding-scale-options/all")
    try:
        response = requests.get(f"{base_url}/api/sliding-scale-options/all")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success: {data.get('success')}")
            options = data.get('options', [])
            print(f"Found {len(options)} total options")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")
    
    # Test 3: Test ping endpoint
    print("\n3. Testing GET /api/ping")
    try:
        response = requests.get(f"{base_url}/api/ping")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_payment_api() 