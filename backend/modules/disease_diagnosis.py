import json
import os
import asyncio
import base64
import math

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import GEMINI_API_KEY, GEMINI_MODEL, DATA_DIR, DIAGNOSIS_CONFIDENCE_THRESHOLD

with open(os.path.join(DATA_DIR, "rsk_centers.json"), encoding="utf-8") as f:
    RSK_CENTERS = json.load(f)["centers"]

# TODO: fine-tune on PlantVillage dataset for better confidence on local crop varieties

DIAGNOSIS_PROMPT = """You are an expert agricultural plant pathologist AI assistant helping Indian farmers.
Analyze the provided crop image carefully and return a JSON response with EXACTLY these fields:

{
  "crop_identified": "name of the crop (e.g., Rice, Cotton, Tomato, Groundnut)",
  "disease_name": "specific disease or pest name, or 'Healthy' if no issue found",
  "severity": "one of: none, low, medium, high, critical",
  "symptoms_observed": "describe visible symptoms in 2-3 sentences",
  "treatment_organic": "organic/natural treatment recommendation",
  "treatment_chemical": "chemical treatment with specific product names if possible",
  "confidence": 0.85,
  "preventive_measures": "2-3 preventive steps for next season"
}

Rules:
- confidence must be a float between 0.0 and 1.0
- If image is unclear or not a crop, set confidence below 0.5
- For severity 'none', set disease_name to 'Healthy'
- Use simple language, farmer-friendly terms
- For Indian context: mention locally available products when possible
- Return ONLY the JSON object, no markdown, no explanation
"""

# mock for demo when no API key
MOCK_RICE_BLAST = {
    "crop_identified": "Rice",
    "disease_name": "Rice Blast (Pyricularia oryzae)",
    "severity": "high",
    "symptoms_observed": "Diamond-shaped lesions with grey centers and brown borders visible on leaves. Lesions coalescing on upper leaves. Neck rot starting at panicle base.",
    "treatment_organic": "Spray neem oil 3% solution (30ml neem oil + 1ml liquid soap in 1L water) every 7 days. Remove and burn infected plant parts immediately.",
    "treatment_chemical": "Spray Tricyclazole 75WP (Beam) at 0.6g/L or Isoprothiolane 40EC (Fuji-One) at 1.5ml/L. Apply 2 sprays at 10-day interval.",
    "confidence": 0.88,
    "preventive_measures": "Use resistant varieties like MTU-7029 (Swarna) next season. Avoid excess nitrogen fertilizer. Maintain proper spacing for air circulation."
}


def _find_nearest_rsk(district: str) -> dict:
    # exact match first
    for c in RSK_CENTERS:
        if c["district"].lower() == district.lower().strip():
            return c

    # try partial match
    for c in RSK_CENTERS:
        if district.lower() in c["district"].lower():
            return c

    # fallback - return warangal RSK
    print(f"[debug] no RSK found for {district}, returning Warangal default")
    return RSK_CENTERS[0]


def _haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


async def run_diagnosis(image_b64: str, district: str = "Warangal", lang: str = "te") -> dict:
    rsk = _find_nearest_rsk(district)

    if not GEMINI_API_KEY:
        print("[warn] GEMINI_API_KEY not set, returning mock rice blast diagnosis")
        result = dict(MOCK_RICE_BLAST)
        result["flag_for_rsk"] = result["confidence"] < DIAGNOSIS_CONFIDENCE_THRESHOLD
        result["nearest_rsk"] = rsk
        result["district"] = district
        return result

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)

        model = genai.GenerativeModel(GEMINI_MODEL)

        # decode base64 to bytes
        img_bytes = base64.b64decode(image_b64)

        import PIL.Image
        import io
        img = PIL.Image.open(io.BytesIO(img_bytes))

        response = model.generate_content(
            [DIAGNOSIS_PROMPT, img],
            generation_config={"temperature": 0.2, "response_mime_type": "application/json"}
        )

        text = response.text.strip()
        # sometimes gemini wraps in markdown - strip it
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])

        diag = json.loads(text)

        confidence = float(diag.get("confidence", 0.5))
        flag = confidence < DIAGNOSIS_CONFIDENCE_THRESHOLD

        diag["flag_for_rsk"] = flag
        diag["nearest_rsk"] = rsk
        diag["district"] = district

        if flag:
            print(f"[debug] low confidence {confidence:.2f}, flagging for RSK: {rsk['name']}")

        return diag

    except Exception as e:
        print(f"[error] diagnosis failed: {e}")
        # return mock on error, don't crash the whole API
        result = dict(MOCK_RICE_BLAST)
        result["flag_for_rsk"] = True
        result["nearest_rsk"] = rsk
        result["district"] = district
        result["error"] = str(e)
        return result
