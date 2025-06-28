#!/usr/bin/env python3
"""
Test backend endpoints to identify specific errors
"""
import requests
import json

def test_endpoints():
    """Test all the main endpoints"""
    
    base_url = "http://127.0.0.1:5000"
    
    endpoints = [
        "/api/sliding-scale-options?category=drop-in",
        "/api/studio-classes/list", 
        "/api/announcements?board_type=student",
        "/api/users/by-clerk-id?clerk_user_id=user_2z1phuUnZ4osgHVyFUJLmKASJOw"
    ]
    
    print("🧪 Testing backend endpoints...")
    
    for endpoint in endpoints:
        try:
            print(f"\n🔍 Testing: {endpoint}")
            response = requests.get(f"{base_url}{endpoint}")
            
            if response.status_code == 200:
                print(f"✅ Success ({response.status_code})")
                try:
                    data = response.json()
                    print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Error ({response.status_code})")
                print(f"   Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection Error - Is the backend running?")
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_endpoints() 