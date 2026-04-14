#!/usr/bin/env python3
"""
Test script to verify CharacterRequests endpoint with proper master authentication
"""
import requests
import json

BASE_URL = "http://localhost:8000"

# Master credentials (known to exist in the system)
MASTER_CREDS = {
    "login": "master",
    "password": "master123",
    "pin": "1234"
}

def main():
    print("=" * 60)
    print("Testing Character Requests Endpoint")
    print("=" * 60)
    
    # Step 1: Login as master
    print("\n[1] Logging in as master...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json=MASTER_CREDS,
        timeout=10
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text[:200]}")
        return
    
    token = login_response.json()["access_token"]
    print(f"✓ Login successful")
    print(f"  Token: {token[:30]}...")
    
    # Step 2: Get character requests
    print("\n[2] Fetching character requests...")
    headers = {"Authorization": f"Bearer {token}"}
    
    requests_response = requests.get(
        f"{BASE_URL}/api/characters/requests",
        headers=headers,
        timeout=10
    )
    
    print(f"Status Code: {requests_response.status_code}")
    print(f"Content-Type: {requests_response.headers.get('content-type')}")
    
    if requests_response.status_code == 200:
        try:
            data = requests_response.json()
            print(f"✓ Success! Found {len(data)} character requests")
            print(f"\nRequests:")
            print(json.dumps(data, indent=2))
        except json.JSONDecodeError as e:
            print(f"❌ JSON Parse Error: {e}")
            print(f"Response (first 500 chars):\n{requests_response.text[:500]}")
    else:
        print(f"❌ Request failed with status {requests_response.status_code}")
        print(f"Response (first 500 chars):\n{requests_response.text[:500]}")

if __name__ == "__main__":
    main()
