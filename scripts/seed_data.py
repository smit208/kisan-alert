"""
seed_data.py — populates demo state with some fake but realistic farmer interactions
run from project root: python scripts/seed_data.py

this hits the running backend at localhost:8000 to pre-seed demo data
make sure uvicorn is running first
"""

import requests
import json
import time

BASE = "http://localhost:8000"

# realistic farmer profiles for demo
DEMO_FARMERS = [
    {
        "phone": "+919440812345",
        "name": "Ramaiah",
        "district": "Warangal",
        "lang": "te"
    },
    {
        "phone": "+919844067890",
        "name": "Suresh",
        "district": "Guntur",
        "lang": "hi"
    },
    {
        "phone": "+917032156789",
        "name": "Lakshmi Bai",
        "district": "Nalgonda",
        "lang": "te"
    },
    {
        "phone": "+918978234567",
        "name": "Raju",
        "district": "Kurnool",
        "lang": "te"
    },
    {
        "phone": "+919876543210",
        "name": "Shankar",
        "district": "Vidisha",
        "lang": "hi"
    }
]

def seed_sms_interactions():
    print("Seeding SMS interactions...")
    
    msgs = [
        {"from_number": DEMO_FARMERS[0]["phone"], "message": "నా పత్తి ఆకులు పసుపు రంగుకు మారుతున్నాయి", "lang": "te"},
        {"from_number": DEMO_FARMERS[1]["phone"], "message": "is baar kaun si fasal lagaun?", "lang": "hi"},
        {"from_number": DEMO_FARMERS[2]["phone"], "message": "వర్షం ఎప్పుడు వస్తుందో చెప్పగలరా?", "lang": "te"},
        {"from_number": DEMO_FARMERS[4]["phone"], "message": "soybean mein kide lag gaye hain", "lang": "hi"},
    ]
    
    for m in msgs:
        try:
            r = requests.post(f"{BASE}/webhook/sms", json=m, timeout=10)
            print(f"  seeded: {m['from_number']} -> {r.status_code}")
        except Exception as e:
            print(f"  failed: {e}")
        time.sleep(0.5)


def seed_flagged_cases():
    """simulate some disease diagnoses that got flagged"""
    print("Seeding flagged cases...")
    
    # tiny placeholder image - in real demo use actual crop photos
    placeholder_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    cases = [
        {"district": "Warangal", "lang": "te"},
        {"district": "Kurnool", "lang": "te"},
        {"district": "Guntur", "lang": "hi"},
    ]
    
    for c in cases:
        try:
            payload = {
                "image_b64": placeholder_b64,
                "district": c["district"],
                "lang": c["lang"]
            }
            r = requests.post(f"{BASE}/api/diagnose", json=payload, timeout=15)
            print(f"  diagnosis for {c['district']}: {r.status_code}")
        except Exception as e:
            print(f"  failed: {e}")
        time.sleep(1)


def check_backend():
    try:
        r = requests.get(f"{BASE}/api/health", timeout=5)
        return r.status_code == 200
    except:
        return False


if __name__ == "__main__":
    print("KisanAlert demo data seeder")
    print("=" * 40)
    
    if not check_backend():
        print("ERROR: backend not running at localhost:8000")
        print("run: cd backend && uvicorn app:app --reload")
        exit(1)
    
    seed_sms_interactions()
    seed_flagged_cases()
    
    print("\nDone. Refresh the dashboard to see demo data.")
