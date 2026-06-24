import json
import asyncio
import os

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import GEMINI_API_KEY, GEMINI_MODEL

# intent keywords - good enough for demo, no NLP library needed
INTENT_PATTERNS = {
    "crop_recommendation": [
        "kya boun", "kya boyen", "kaun si fasal", "fasal batao", "konsi phasal",
        "bona chahiye", "what to sow", "crop suggest", "kaun sa beej",
        "ఏ పంట", "పంట సూచించు", "ఏమి విత్తాలి", "పంటలు చెప్పు",
        "ಯಾವ ಬೆಳೆ", "ಬೆಳೆ ಸಲಹೆ",
        "कौन सी फसल", "फसल", "बीज",
        "mausam mein", "is season"
    ],
    "weather_alerts": [
        "baarish", "varsha", "varsha kab", "mausam", "barish kab aayegi",
        "పర్జన్యం", "వర్షం", "వాతావరణ", "ఎప్పుడు వర్షం",
        "weather", "rain", "temperature", "temp kitna",
        "ಮಳೆ", "ಹವಾಮಾನ",
        "बारिश", "तापमान", "मौसम"
    ],
    "disease_advisory": [
        "fasal kharab", "rog", "bimari", "keede", "patton par",
        "పంట చెడిపోతోంది", "తెగులు", "పురుగు", "ఆకులు పసుపు",
        "disease", "pest", "yellow leaves", "spots", "wilting",
        "ರೋಗ", "ಕೀಟ",
        "पत्ते पीले", "कीड़े", "बीमारी", "रोग"
    ],
    "fertilizer_advisory": [
        "khad", "khad kab daalen", "urvarak", "dap", "urea", "potash",
        "ఎరువు", "ఎప్పుడు వేయాలి", "యూరియా",
        "fertilizer", "manure", "nutrient",
        "ಗೊಬ್ಬರ",
        "खाद", "उर्वरक", "डीएपी"
    ]
}

SYSTEM_PROMPT = """You are KisanAlert, a helpful AI assistant for Indian farmers. You work on behalf of the government agricultural extension service.

IMPORTANT RULES:
1. ALWAYS respond in the farmer's language: {lang}
2. Use VERY simple vocabulary - assume low literacy level
3. Keep responses SHORT - farmers are on slow connections or SMS
4. Be warm and respectful, use local terms of address
5. For Telugu: use "మీరు" (formal you)
6. For Hindi: use "आप" (formal you)
7. Do NOT use technical jargon or scientific terms without explanation
8. When recommending, always mention 1-2 specific actionable steps
9. If you cannot help, direct to local RSK/KVK center

Current context:
- District: {district}
- Language: {lang}
- Date: {date}

If asked about crops: mention MSP (minimum support price) as it's important to farmers.
If asked about weather: be specific about days and mm of rainfall.
If asked about disease: ask clarifying questions if image not provided.
"""

MOCK_RESPONSES = {
    "crop_recommendation": {
        "te": "మీ ప్రాంతానికి పత్తి మరియు వరి మంచి పంటలు. ఖరీఫ్ సీజన్‌లో పత్తి వేస్తే MSP ₹7020/క్వింటాల్ వస్తుంది.",
        "hi": "आपके क्षेत्र के लिए कपास और धान अच्छी फसलें हैं। कपास का MSP ₹7020/क्विंटल है।",
        "en": "Cotton and rice are good crops for your area. Cotton MSP is ₹7020/quintal.",
        "kn": "ನಿಮ್ಮ ಪ್ರದೇಶಕ್ಕೆ ಹತ್ತಿ ಮತ್ತು ಭತ್ತ ಉತ್ತಮ ಬೆಳೆಗಳು.",
        "mr": "तुमच्या भागासाठी कापूस आणि धान चांगली पिके आहेत."
    },
    "weather_alerts": {
        "te": "వచ్చే 7 రోజులలో వర్షం తక్కువగా ఉంటుంది. మీ పొలంలో నీరు పెట్టండి.",
        "hi": "अगले 7 दिनों में कम बारिश होगी। अभी सिंचाई करें।",
        "en": "Low rainfall expected next 7 days. Please irrigate your fields.",
        "kn": "ಮುಂದಿನ 7 ದಿನ ಕಡಿಮೆ ಮಳೆ. ನೀರು ಹಾಯಿಸಿ.",
        "mr": "पुढील 7 दिवस कमी पाऊस. पाणी द्या."
    },
    "disease_advisory": {
        "te": "మీ పంట ఆకులు పసుపు పడుతున్నాయా? దయచేసి ఫోటో పంపించండి. అప్పుడు మేము సరైన చికిత్స చెప్పగలం.",
        "hi": "क्या आपकी फसल की पत्तियां पीली हो रही हैं? कृपया फोटो भेजें। हम सही इलाज बताएंगे।",
        "en": "Are your crop leaves turning yellow? Please send a photo and we'll diagnose the issue.",
        "kn": "ನಿಮ್ಮ ಬೆಳೆಯ ಎಲೆಗಳು ಹಳದಿ ಆಗುತ್ತಿವೆಯೇ? ಫೋಟೋ ಕಳುಹಿಸಿ.",
        "mr": "तुमच्या पिकाची पाने पिवळी होत आहेत का? फोटो पाठवा."
    },
    "fertilizer_advisory": {
        "te": "వరికి నాట్లు వేసిన 21 రోజులకు యూరియా 30 కేజీలు/ఎకరానికి వేయండి.",
        "hi": "धान में रोपाई के 21 दिन बाद यूरिया 30 किलो/एकड़ डालें।",
        "en": "Apply Urea 30 kg/acre 21 days after rice transplanting.",
        "kn": "ಭತ್ತ ನಾಟಿ ಮಾಡಿದ 21 ದಿನಗಳ ನಂತರ ಯೂರಿಯಾ 30 ಕೆ.ಜಿ/ಎಕರೆ ಹಾಕಿ.",
        "mr": "भात लावणीनंतर 21 दिवसांनी युरिया 30 किलो/एकर द्या."
    }
}


def _detect_intent(message: str) -> str:
    msg_lower = message.lower()
    scores = {intent: 0 for intent in INTENT_PATTERNS}
    for intent, keywords in INTENT_PATTERNS.items():
        for kw in keywords:
            if kw.lower() in msg_lower:
                scores[intent] += 1
    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return "general"
    return best


async def _call_gemini(message, history, district, lang, intent):
    try:
        import google.generativeai as genai
        from datetime import date
        genai.configure(api_key=GEMINI_API_KEY)

        sys_prompt = SYSTEM_PROMPT.format(
            lang=lang,
            district=district,
            date=date.today().isoformat()
        )
        model = genai.GenerativeModel(
            GEMINI_MODEL,
            system_instruction=sys_prompt
        )

        # build conversation history for gemini
        gemini_history = []
        for msg in history[-6:]:  # keep last 6 messages, token limit
            role = "user" if msg.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg.get("content", "")]})

        chat = model.start_chat(history=gemini_history)

        # add intent context to the message
        context_msg = f"[Intent detected: {intent}]\n{message}"
        resp = await asyncio.get_event_loop().run_in_executor(
            None, lambda: chat.send_message(context_msg)
        )
        return resp.text

    except Exception as e:
        print(f"[error] gemini chat failed: {e}")
        return None


async def chat(message: str, lang: str, history: list, district: str, farmer_id: str) -> dict:
    intent = _detect_intent(message)
    print(f"[debug] intent={intent} lang={lang} district={district} farmer={farmer_id}")

    data = {}
    action_taken = "general_response"
    response_text = ""

    # route to appropriate module
    if intent == "crop_recommendation":
        from modules.crop_recommender import fetch_crop_suggestions
        try:
            crops = await fetch_crop_suggestions(district, "kharif", lang)
            data = {"crops": crops}
            action_taken = "fetch_crop_suggestions"
        except Exception as e:
            print(f"[error] crop rec failed: {e}")

    elif intent == "weather_alerts":
        from modules.weather_alerts import check_weather_alerts
        try:
            alerts_data = await asyncio.get_event_loop().run_in_executor(
                None, check_weather_alerts, district, lang
            )
            data = alerts_data
            action_taken = "check_weather_alerts"
        except Exception as e:
            print(f"[error] weather check failed: {e}")

    # try gemini for response text
    if GEMINI_API_KEY:
        gemini_resp = await _call_gemini(message, history, district, lang, intent)
        if gemini_resp:
            response_text = gemini_resp

    # fallback to hardcoded response
    if not response_text:
        fallback_map = MOCK_RESPONSES.get(intent, {})
        response_text = fallback_map.get(lang, fallback_map.get("en", "मैं समझ नहीं पाया। कृपया दोबारा पूछें।"))

    return {
        "response": response_text,
        "intent_detected": intent,
        "action_taken": action_taken,
        "data": data
    }
