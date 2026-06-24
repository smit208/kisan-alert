import json
import os
import requests
from datetime import datetime, timedelta

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import OPEN_METEO_BASE, DRY_SPELL_THRESHOLD_MM, DATA_DIR

with open(os.path.join(DATA_DIR, "soil_data.json"), encoding="utf-8") as f:
    _SOIL = json.load(f)["districts"]

# TODO: add proper translation API integration
# for now hardcoding hi and te, enough for demo

ALERT_MESSAGES = {
    "dry_spell": {
        "hi": "अगले 7 दिनों में बारिश नहीं होगी। अभी सिंचाई करें।",
        "te": "వచ్చే 7 రోజులలో వర్షం రాదు. ఇప్పుడే నీరు పెట్టండి.",
        "kn": "ಮುಂದಿನ 7 ದಿನ ಮಳೆ ಇರುವುದಿಲ್ಲ. ಈಗಲೇ ನೀರು ಹಾಯಿಸಿ.",
        "mr": "पुढील 7 दिवस पाऊस नाही. आत्ताच पाणी द्या.",
        "en": "No rain expected in next 7 days. Irrigate your fields now.",
        "ta": "அடுத்த 7 நாட்களில் மழை இல்லை. இப்போதே நீர் பாய்ச்சுங்கள்.",
    },
    "heavy_rain": {
        "hi": "भारी बारिश की संभावना है। खेत की नाली साफ रखें।",
        "te": "భారీ వర్షం పడే అవకాశం ఉంది. పొలంలో నీటి కాలువలు శుభ్రం చేయండి.",
        "kn": "ಭಾರೀ ಮಳೆ ಸಾಧ್ಯತೆ ಇದೆ. ಹೊಲದ ಚರಂಡಿ ಸ್ವಚ್ಛ ಮಾಡಿ.",
        "mr": "जड पावसाची शक्यता आहे. शेतातील पाण्याचा निचरा करा.",
        "en": "Heavy rain expected. Clear your field drainage channels.",
        "ta": "கனமழை வாய்ப்பு உள்ளது. வயல் வடிகால்களை சுத்தம் செய்யுங்கள்.",
    },
    "heat_stress": {
        "hi": "3 दिन से ज्यादा तापमान 42°C से ऊपर रहेगा। फसल को शाम को पानी दें।",
        "te": "3 రోజులు 42°C కంటే ఎక్కువ ఉష్ణోగ్రత ఉంటుంది. సాయంత్రం నీరు పెట్టండి.",
        "kn": "3 ದಿನ ತಾಪಮಾನ 42°C ಮೇಲೆ ಇರುತ್ತದೆ. ಸಂಜೆ ನೀರು ಹಾಯಿಸಿ.",
        "mr": "3 दिवस तापमान 42°C पेक्षा जास्त राहील. संध्याकाळी पाणी द्या.",
        "en": "Heat stress: 3+ days above 42°C forecast. Water crops in the evening.",
        "ta": "3 நாட்களுக்கு மேல் வெப்பம் 42°C க்கு மேல் இருக்கும். மாலையில் நீர் பாய்ச்சுங்கள்.",
    }
}

# mock forecast data for when open-meteo is down - warangal dry spell July scenario
MOCK_FORECAST = {
    "district": "Warangal",
    "daily": {
        "time": [
            (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(10)
        ],
        "rain_sum": [0.2, 0.0, 0.0, 0.4, 0.0, 0.0, 1.5, 12.3, 8.2, 4.1],
        "temperature_2m_max": [38.2, 39.1, 40.5, 41.2, 42.8, 43.1, 42.5, 38.9, 37.6, 36.8],
        "temperature_2m_min": [28.1, 28.8, 29.2, 30.1, 31.2, 30.8, 30.1, 28.5, 27.9, 27.2],
        "et0_fao_evapotranspiration": [5.8, 6.1, 6.4, 6.8, 7.2, 7.5, 7.1, 5.9, 5.6, 5.4]
    }
}


def _find_district_coords(district):
    for k, v in _SOIL.items():
        if k.lower() == district.lower().strip():
            return v.get("lat", 17.9784), v.get("lon", 79.5941)
    # partial match
    for k, v in _SOIL.items():
        if district.lower() in k.lower():
            return v.get("lat", 17.9784), v.get("lon", 79.5941)
    return 17.9784, 79.5941  # warangal default


def _fetch_forecast(lat, lon):
    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "rain_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration",
            "forecast_days": 10,
            "timezone": "Asia/Kolkata"
        }
        resp = requests.get(OPEN_METEO_BASE, params=params, timeout=6)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[warn] open-meteo unreachable: {e}, using mock data")
        return {"daily": MOCK_FORECAST["daily"]}


def _generate_advisory_text(alert_type, lang, district):
    # bit messy, clean up before prod
    base = ALERT_MESSAGES.get(alert_type, {})
    msg = base.get(lang, base.get("en", "Alert: check your crops."))
    # could personalise with district name here later
    return msg


def check_weather_alerts(district: str, lang: str = "hi") -> dict:
    lat, lon = _find_district_coords(district)
    raw = _fetch_forecast(lat, lon)

    daily = raw.get("daily", {})
    times = daily.get("time", [])
    rain_list = daily.get("rain_sum", [])
    max_temps = daily.get("temperature_2m_max", [])

    alerts = []

    # dry spell check - sum of first 7 days
    rain_7d = sum(r for r in rain_list[:7] if r is not None)
    if rain_7d < DRY_SPELL_THRESHOLD_MM:
        trigger = times[0] if times else datetime.now().strftime("%Y-%m-%d")
        alerts.append({
            "type": "dry_spell",
            "severity": "high",
            "message": _generate_advisory_text("dry_spell", lang, district),
            "recommended_action": "irrigate_now",
            "trigger_day": trigger
        })

    # heavy rain check - any single day > 80mm
    for i, rain in enumerate(rain_list):
        if rain is not None and rain > 80.0:
            alerts.append({
                "type": "heavy_rain",
                "severity": "high",
                "message": _generate_advisory_text("heavy_rain", lang, district),
                "recommended_action": "clear_drainage",
                "trigger_day": times[i] if i < len(times) else ""
            })
            break  # one alert is enough, don't spam

    # heat stress - 3+ consecutive days > 42C
    consecutive = 0
    heat_start_day = None
    for i, temp in enumerate(max_temps):
        if temp is not None and temp > 42.0:
            consecutive += 1
            if consecutive == 1:
                heat_start_day = times[i] if i < len(times) else ""
        else:
            consecutive = 0
            heat_start_day = None
        if consecutive >= 3:
            alerts.append({
                "type": "heat_stress",
                "severity": "medium",
                "message": _generate_advisory_text("heat_stress", lang, district),
                "recommended_action": "evening_irrigation",
                "trigger_day": heat_start_day or ""
            })
            break

    overall_max = max((t for t in max_temps if t is not None), default=0)

    return {
        "district": district,
        "forecast_days": 10,
        "alerts": alerts,
        "forecast_summary": {
            "7day_rain_mm": round(rain_7d, 2),
            "max_temp": overall_max
        }
    }
