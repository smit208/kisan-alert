"""
quick smoke tests for the three main modules
run from backend/ dir: python ../scripts/test_modules.py
"""

import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from modules.crop_recommender import fetch_crop_suggestions
from modules.weather_alerts import check_weather_alerts
from modules.disease_diagnosis import run_diagnosis
import json
import base64


async def test_crop_rec():
    print("\n--- testing crop recommender ---")
    result = await fetch_crop_suggestions("Warangal", season="kharif", lang="te")
    print(f"got {len(result)} recommendations")
    for r in result[:3]:
        print(f"  {r['crop']} ({r['local_name']}) score={r['score']} confidence={r['confidence']}")
    assert len(result) > 0
    print("crop rec: PASS")


async def test_weather():
    print("\n--- testing weather alerts ---")
    result = await check_weather_alerts("Guntur", lang="hi")
    print(f"alerts: {len(result['alerts'])}")
    print(f"7-day rain: {result['forecast_summary'].get('7day_rain_mm')} mm")
    print("weather: PASS")


async def test_diagnosis():
    print("\n--- testing disease diagnosis (mock) ---")
    # using a tiny 1x1 red pixel as placeholder - real test needs actual crop photo
    mock_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg=="
    result = await run_diagnosis(mock_b64, district="Warangal", lang="te")
    print(f"disease: {result.get('disease_name', 'unknown')}")
    print(f"flagged for RSK: {result.get('flag_for_rsk')}")
    print("diagnosis: PASS")


async def test_rabi_rec():
    # testing with a different district and rabi season
    print("\n--- testing rabi season for Vidisha ---")
    result = await fetch_crop_suggestions("Vidisha", season="rabi", lang="hi")
    for r in result[:2]:
        print(f"  {r['crop']} score={r['score']}")
    print("rabi test: PASS")


async def main():
    print("KisanAlert module tests")
    print("=" * 40)
    
    try:
        await test_crop_rec()
    except Exception as e:
        print(f"crop rec FAILED: {e}")
    
    try:
        await test_weather()
    except Exception as e:
        print(f"weather FAILED: {e}")

    try:
        await test_diagnosis()
    except Exception as e:
        print(f"diagnosis FAILED: {e}")

    try:
        await test_rabi_rec()
    except Exception as e:
        print(f"rabi test FAILED: {e}")

    print("\nDone.")


if __name__ == "__main__":
    asyncio.run(main())
