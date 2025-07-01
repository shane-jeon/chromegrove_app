#!/usr/bin/env python3
"""
Simple test script to verify the payment API
"""
import requests
import json

def test_payment_api():
    """Test the payment API endpoints"""
    base_url = "http://localhost:5000"
    
    print("🧪 Testing Payment API...")
    
    # Test 1: Ping endpoint
    print("\n1. Testing ping endpoint...")
    try:
        response = requests.get(f"{base_url}/api/ping")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Sliding scale options
    print("\n2. Testing sliding scale options...")
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
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_payment_api() 