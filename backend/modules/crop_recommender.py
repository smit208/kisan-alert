import json
import os
import asyncio
import requests
from datetime import datetime

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import DATA_DIR, OPEN_METEO_BASE

# load data at import time - bit wasteful but fine for hackathon
with open(os.path.join(DATA_DIR, "soil_data.json"), encoding="utf-8") as f:
    SOIL_DATA = json.load(f)["districts"]

with open(os.path.join(DATA_DIR, "rainfall_history.json"), encoding="utf-8") as f:
    RAINFALL_DATA = json.load(f)["districts"]

with open(os.path.join(DATA_DIR, "crops_db.json"), encoding="utf-8") as f:
    CROPS_DB = json.load(f)["crops"]

# TODO: handle lat/lng input directly (not just district name) for future
# right now everything goes through district name lookup

SOIL_TYPE_ALIASES = {
    "black_cotton": ["clay", "clay_loam", "black_cotton", "medium_black"],
    "alluvial": ["alluvial", "loam", "clay_loam"],
    "red_loam": ["red_loam", "loam", "sandy_loam"],
    "red_sandy": ["red_sandy", "sandy_loam"],
    "medium_black": ["medium_black", "clay_loam"],
    "Black Cotton Soil": ["clay", "clay_loam", "black_cotton", "medium_black"],
    "Deep Black Soil": ["clay", "clay_loam", "black_cotton", "medium_black"],
    "Shallow Black Soil": ["clay", "clay_loam", "black_cotton"],
    "Medium Black Soil": ["clay_loam", "medium_black", "black_cotton"],
    "Red Sandy Loam": ["red_sandy", "sandy_loam", "red_loam"],
    "Red Loam": ["red_loam", "loam", "sandy_loam"],
    "Alluvial Soil": ["alluvial", "loam", "clay_loam"],
}


def _find_district(name):
    """fuzzy match district name, lowercase comparison"""
    name_lower = name.lower().strip()
    for k in SOIL_DATA:
        if k.lower() == name_lower:
            return k, SOIL_DATA[k]
    # try partial match
    for k in SOIL_DATA:
        if name_lower in k.lower() or k.lower() in name_lower:
            return k, SOIL_DATA[k]
    # fallback to Warangal
    print(f"[warn] district '{name}' not found, using Warangal as fallback")
    return "Warangal", SOIL_DATA["Warangal"]


def _get_rainfall_data(district_key):
    for k in RAINFALL_DATA:
        if k.lower() == district_key.lower():
            return RAINFALL_DATA[k]
    return RAINFALL_DATA.get("Warangal", {})


def _fetch_live_forecast(lat, lon):
    """hits open-meteo for 7 day forecast, returns sum of rain"""
    try:
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "rain_sum",
            "forecast_days": 7,
            "timezone": "Asia/Kolkata"
        }
        resp = requests.get(OPEN_METEO_BASE, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        rain_list = data.get("daily", {}).get("rain_sum", [])
        total = sum(r for r in rain_list if r is not None)
        return total
    except Exception as e:
        print(f"[debug] open-meteo failed: {e}")
        return None


def _score_crop(crop_name, crop_data, soil_info, rainfall_info, season, live_rain_mm):
    """scores a single crop. returns (score, reasoning_parts)"""
    print(f"[debug] scoring {crop_name} for district")  # still there from testing
    score = 0
    reasons = []

    # get soil type from the nested structure
    if "soil" in soil_info:
        soil_type = soil_info["soil"].get("type", "")
        pH = soil_info["soil"].get("pH", 7.0)
        N = soil_info["soil"].get("nitrogen_kg_ha", 0)
        P = soil_info["soil"].get("phosphorus_kg_ha", 0)
        K = soil_info["soil"].get("potassium_kg_ha", 0)
        gw_depth = soil_info["soil"].get("groundwater_depth_m", 10)
    else:
        # flat structure (old format)
        soil_type = soil_info.get("soil_type", "")
        pH = soil_info.get("pH", 7.0)
        N = soil_info.get("N_kg_ha", 0)
        P = soil_info.get("P_kg_ha", 0)
        K = soil_info.get("K_kg_ha", 0)
        gw_depth = soil_info.get("groundwater_depth_m", 10)

    crop_soils = crop_data.get("soil_types", [])
    # expand using aliases
    compatible_soils = SOIL_TYPE_ALIASES.get(soil_type, [soil_type.lower()])

    soil_match = any(cs in compatible_soils for cs in crop_soils)
    if soil_match:
        score += 30
        reasons.append(f"{soil_type} suits {crop_name}")
    else:
        reasons.append(f"soil mismatch ({soil_type})")

    pH_range = crop_data.get("pH_range", [6.0, 8.0])
    if pH_range[0] <= pH <= pH_range[1]:
        score += 20
        reasons.append(f"pH {pH} in range")
    else:
        reasons.append(f"pH {pH} outside optimal {pH_range}")

    # rainfall check - use live if available else historical
    if season == "kharif":
        hist_rain = rainfall_info.get("kharif_avg_mm", rainfall_info.get("annual_avg_mm", 600))
    else:
        hist_rain = rainfall_info.get("rabi_avg_mm", 80)

    effective_rain = hist_rain
    if live_rain_mm is not None:
        # blend: live forecast weight 30%, historical 70% - hacky but ok
        effective_rain = (hist_rain * 0.7) + (live_rain_mm * 4.3 * 0.3)  # scale weekly to seasonal

    min_rain = crop_data.get("min_rainfall_mm", 400)
    if effective_rain >= min_rain:
        score += 20
        reasons.append(f"rainfall adequate ({int(effective_rain)}mm vs {min_rain}mm min)")
    else:
        reasons.append(f"rainfall may be low ({int(effective_rain)}mm, needs {min_rain}mm)")

    gw_ok_m = crop_data.get("groundwater_depth_ok_m", 20)
    if gw_depth <= gw_ok_m:
        score += 15
        reasons.append(f"groundwater at {gw_depth}m accessible")
    else:
        reasons.append(f"groundwater deep ({gw_depth}m)")
        if effective_rain < min_rain:
            score -= 20

    # N/P/K rough check
    n_req = crop_data.get("nitrogen_req", "medium")
    npk_score = 0
    if n_req == "low" and N >= 130:
        npk_score += 15
    elif n_req == "medium" and N >= 160:
        npk_score += 15
    elif n_req == "high" and N >= 200:
        npk_score += 15
    elif n_req == "high" and N >= 160:
        npk_score += 8
    else:
        npk_score += 5  # partial

    if P >= 15 and K >= 250:
        npk_score = min(npk_score + 5, 15)

    score += npk_score
    if npk_score >= 12:
        reasons.append("N/P/K levels adequate")
    else:
        reasons.append("N levels may need supplementation")

    return score, reasons


def _confidence_label(score):
    if score >= 75:
        return "high"
    elif score >= 55:
        return "medium"
    return "low"


async def fetch_crop_suggestions(district: str, season: str = "kharif", lang: str = "te") -> list:
    dist_key, soil_info = _find_district(district)
    rainfall_info = _get_rainfall_data(dist_key)

    lat = soil_info.get("lat", 17.9784)
    lon = soil_info.get("lon", 79.5941)

    # fetch live forecast in thread pool so we don't block
    loop = asyncio.get_event_loop()
    live_rain_mm = await loop.run_in_executor(None, _fetch_live_forecast, lat, lon)

    if live_rain_mm is not None:
        print(f"[debug] live 7-day rain for {dist_key}: {live_rain_mm}mm")

    result_list = []

    for crop_name, crop_data in CROPS_DB.items():
        # skip crops not in this season
        crop_seasons = crop_data.get("season", ["kharif"])
        if season not in crop_seasons:
            continue

        score, reasons = _score_crop(
            crop_name, crop_data, soil_info, rainfall_info, season, live_rain_mm
        )

        local_name = crop_data.get("local_names", {}).get(lang, crop_name)
        reasoning_text = ". ".join(reasons)

        result_list.append({
            "crop": crop_name,
            "local_name": local_name,
            "score": max(0, score),
            "confidence": _confidence_label(score),
            "reasoning": reasoning_text,
            "season": season,
            "duration_days": crop_data.get("duration_days", 120),
            "msp_2024": crop_data.get("msp_2024", 0),
            "water_need_mm": crop_data.get("water_requirement_mm", 500)
        })

    # sort by score desc, return top 5
    result_list.sort(key=lambda x: x["score"], reverse=True)
    top5 = result_list[:5]

    print(f"[debug] top crop for {district}: {top5[0]['crop'] if top5 else 'none'}")
    return top5
