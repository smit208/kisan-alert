import os
import sys
import asyncio
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(__file__))
from config import GEMINI_API_KEY, SUPPORTED_LANGS, DATA_DIR

from modules.conversation import chat as conversation_chat
from modules.crop_recommender import fetch_crop_suggestions
from modules.weather_alerts import check_weather_alerts
from modules.disease_diagnosis import run_diagnosis
from services.sms_gateway import send_sms, get_sent_messages, simulate_inbound
from services.voice_gateway import text_to_speech, speech_to_text
from services.translation import translate_text

app = FastAPI(title="KisanAlert API", version="0.1.0")

# allow all origins for demo - tighten before prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# in-memory flagged cases list - populated by disease_diagnosis when confidence is low
flagged_cases = []

# supported districts list - just pull from soil data
import json
with open(os.path.join(DATA_DIR, "soil_data.json"), encoding="utf-8") as f:
    _soil_raw = json.load(f)
DISTRICTS = list(_soil_raw["districts"].keys())


# --- Pydantic models ---

class ChatRequest(BaseModel):
    message: str
    lang: str = "hi"
    history: List[dict] = []
    district: str = "Warangal"
    farmer_id: str = "unknown"


class RecommendRequest(BaseModel):
    district: str
    season: str = "kharif"
    lang: str = "te"


class DiagnoseRequest(BaseModel):
    image_b64: str
    district: str = "Warangal"
    lang: str = "te"


class SMSWebhookRequest(BaseModel):
    from_number: str
    message: str
    lang: str = "hi"


class TTSRequest(BaseModel):
    text: str
    lang: str = "hi"
    voice_gender: str = "FEMALE"


class STTRequest(BaseModel):
    audio_b64: str
    lang: str = "hi"


# --- startup ---

@app.on_event("startup")
async def on_startup():
    print(f"KisanAlert backend starting... Gemini key set: {bool(GEMINI_API_KEY)}")
    print(f"Loaded {len(DISTRICTS)} districts, supported langs: {SUPPORTED_LANGS}")


# --- endpoints ---

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "gemini_configured": bool(GEMINI_API_KEY),
        "districts_loaded": len(DISTRICTS)
    }


@app.get("/api/districts")
def get_districts():
    return {"districts": DISTRICTS}


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    if req.lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail=f"Unsupported lang: {req.lang}")
    try:
        result = await conversation_chat(
            message=req.message,
            lang=req.lang,
            history=req.history,
            district=req.district,
            farmer_id=req.farmer_id
        )
        return result
    except Exception as e:
        print(f"[error] chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/recommend")
async def recommend_endpoint(req: RecommendRequest):
    try:
        crops = await fetch_crop_suggestions(
            district=req.district,
            season=req.season,
            lang=req.lang
        )
        return {
            "district": req.district,
            "season": req.season,
            "lang": req.lang,
            "recommendations": crops
        }
    except Exception as e:
        print(f"[error] recommend endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/alerts/{district}")
def alerts_endpoint(district: str, lang: str = "hi"):
    try:
        result = check_weather_alerts(district=district, lang=lang)
        return result
    except Exception as e:
        print(f"[error] alerts endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/diagnose")
async def diagnose_endpoint(req: DiagnoseRequest):
    try:
        result = await run_diagnosis(
            image_b64=req.image_b64,
            district=req.district,
            lang=req.lang
        )

        # if flagged, add to dashboard list
        if result.get("flag_for_rsk"):
            case = {
                "case_id": f"CASE_{len(flagged_cases)+1:04d}",
                "district": req.district,
                "lang": req.lang,
                "crop": result.get("crop_identified", "unknown"),
                "disease": result.get("disease_name", "unknown"),
                "confidence": result.get("confidence", 0),
                "severity": result.get("severity", "unknown"),
                "rsk": result.get("nearest_rsk", {}),
                "flagged_at": datetime.now().isoformat(),
                "status": "pending"
            }
            flagged_cases.append(case)
            print(f"[flag] new RSK case: {case['case_id']} for {req.district}")

        return result
    except Exception as e:
        print(f"[error] diagnose endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cases/flagged")
def get_flagged_cases():
    # add some demo cases if list is empty - so dashboard looks populated
    if not flagged_cases:
        demo_cases = [
            {
                "case_id": "CASE_0001",
                "district": "Warangal",
                "lang": "te",
                "crop": "Rice",
                "disease": "Rice Blast (Pyricularia oryzae)",
                "confidence": 0.88,
                "severity": "high",
                "rsk": {"name": "Rythu Seva Kendra - Warangal Urban", "phone": "0870-2441234"},
                "flagged_at": "2026-07-08T06:15:00",
                "status": "pending"
            },
            {
                "case_id": "CASE_0002",
                "district": "Nalgonda",
                "lang": "te",
                "crop": "Cotton",
                "disease": "Cotton Leaf Curl Virus",
                "confidence": 0.65,  # below threshold, so flagged
                "severity": "medium",
                "rsk": {"name": "Rythu Seva Kendra - Nalgonda", "phone": "08682-242789"},
                "flagged_at": "2026-07-08T07:30:00",
                "status": "in_review"
            },
            {
                "case_id": "CASE_0003",
                "district": "Guntur",
                "lang": "te",
                "crop": "Chilli",
                "disease": "Anthracnose (Colletotrichum capsici)",
                "confidence": 0.71,  # just below 0.72 threshold
                "severity": "medium",
                "rsk": {"name": "Rythu Seva Kendra - Guntur", "phone": "0863-2342100"},
                "flagged_at": "2026-07-08T08:05:00",
                "status": "pending"
            }
        ]
        return {"cases": demo_cases, "total": len(demo_cases)}

    return {"cases": flagged_cases, "total": len(flagged_cases)}


@app.get("/api/messages")
def get_messages():
    msgs = get_sent_messages()
    return {"messages": msgs, "total": len(msgs)}


@app.post("/webhook/sms")
async def sms_webhook(req: SMSWebhookRequest):
    # record inbound
    inbound = simulate_inbound(req.from_number, req.message, req.lang)

    # auto-respond via chat
    try:
        chat_result = await conversation_chat(
            message=req.message,
            lang=req.lang,
            history=[],
            district="Warangal",  # TODO: detect district from phone number prefix or farmer profile
            farmer_id=req.from_number
        )
        response_text = chat_result.get("response", "")
        if response_text:
            send_sms(req.from_number, response_text, req.lang)

        return {"status": "processed", "inbound": inbound, "response": response_text}
    except Exception as e:
        print(f"[error] sms webhook: {e}")
        return {"status": "error", "error": str(e)}


@app.post("/api/tts")
async def tts_endpoint(req: TTSRequest):
    result = await text_to_speech(req.text, req.lang, req.voice_gender)
    return result


@app.post("/api/stt")
async def stt_endpoint(req: STTRequest):
    result = await speech_to_text(req.audio_b64, req.lang)
    return result


# serve frontend if it exists - for integrated deployment
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
