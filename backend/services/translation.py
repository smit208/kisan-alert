import asyncio
import os

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from config import GEMINI_API_KEY, GEMINI_MODEL

# using Gemini for translation instead of Cloud Translation API
# saves one more API to configure, same quality for agricultural domain

COMMON_PHRASES = {
    "hi": {
        "dry_spell_warning": "अगले 7 दिनों में बारिश नहीं होगी। अभी सिंचाई करें।",
        "heavy_rain_warning": "भारी बारिश की संभावना है। खेत की नाली साफ रखें।",
        "crop_rec_intro": "आपके खेत के लिए सबसे अच्छी फसलें:",
        "rsk_referral": "आपका मामला कृषि विशेषज्ञ को भेज दिया गया है।",
        "heat_stress_warning": "बहुत गर्मी है। शाम को फसल को पानी दें।",
        "healthy_crop": "आपकी फसल स्वस्थ दिखती है। ऐसे ही रखें।",
        "error_generic": "कुछ गड़बड़ हुई। कृपया दोबारा कोशिश करें।"
    },
    "te": {
        "dry_spell_warning": "వచ్చే 7 రోజులలో వర్షం రాదు. ఇప్పుడే నీరు పెట్టండి.",
        "heavy_rain_warning": "భారీ వర్షం పడే అవకాశం ఉంది. పొలంలో నీటి కాలువలు శుభ్రం చేయండి.",
        "crop_rec_intro": "మీ పొలానికి అనువైన పంటలు:",
        "rsk_referral": "మీ వివరాలు వ్యవసాయ నిపుణుడికి పంపబడ్డాయి.",
        "heat_stress_warning": "చాలా వేడిగా ఉంది. సాయంత్రం పంటలకు నీరు పెట్టండి.",
        "healthy_crop": "మీ పంట ఆరోగ్యంగా ఉంది. అలాగే కొనసాగించండి.",
        "error_generic": "ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి."
    },
    "kn": {
        "dry_spell_warning": "ಮುಂದಿನ 7 ದಿನ ಮಳೆ ಇರುವುದಿಲ್ಲ. ಈಗಲೇ ನೀರು ಹಾಯಿಸಿ.",
        "heavy_rain_warning": "ಭಾರೀ ಮಳೆ ಸಾಧ್ಯತೆ ಇದೆ. ಹೊಲದ ಚರಂಡಿ ಸ್ವಚ್ಛ ಮಾಡಿ.",
        "crop_rec_intro": "ನಿಮ್ಮ ಹೊಲಕ್ಕೆ ಸೂಕ್ತ ಬೆಳೆಗಳು:",
        "rsk_referral": "ನಿಮ್ಮ ವಿಷಯ ಕೃಷಿ ತಜ್ಞರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.",
        "heat_stress_warning": "ತುಂಬಾ ಬಿಸಿಲು. ಸಂಜೆ ಬೆಳೆಗಳಿಗೆ ನೀರು ಹಾಯಿಸಿ.",
        "healthy_crop": "ನಿಮ್ಮ ಬೆಳೆ ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತದೆ.",
        "error_generic": "ತಪ್ಪಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
    },
    "mr": {
        "dry_spell_warning": "पुढील 7 दिवस पाऊस नाही. आत्ताच पाणी द्या.",
        "heavy_rain_warning": "जड पावसाची शक्यता आहे. शेतातील पाण्याचा निचरा करा.",
        "crop_rec_intro": "तुमच्या शेतासाठी योग्य पिके:",
        "rsk_referral": "तुमची माहिती कृषी तज्ञाकडे पाठवण्यात आली आहे.",
        "heat_stress_warning": "खूप उष्णता आहे. संध्याकाळी पिकांना पाणी द्या.",
        "healthy_crop": "तुमचे पीक निरोगी दिसते.",
        "error_generic": "काही चूक झाली. पुन्हा प्रयत्न करा."
    },
    "ta": {
        "dry_spell_warning": "அடுத்த 7 நாட்களில் மழை இல்லை. இப்போதே நீர் பாய்ச்சுங்கள்.",
        "heavy_rain_warning": "கனமழை வாய்ப்பு உள்ளது. வயல் வடிகால்களை சுத்தம் செய்யுங்கள்.",
        "crop_rec_intro": "உங்கள் நிலத்திற்கு ஏற்ற பயிர்கள்:",
        "rsk_referral": "உங்கள் விவரங்கள் வேளாண் நிபுணரிடம் அனுப்பப்பட்டன.",
        "heat_stress_warning": "மிகவும் வெப்பமாக உள்ளது. மாலையில் பயிர்களுக்கு நீர் பாய்ச்சுங்கள்.",
        "healthy_crop": "உங்கள் பயிர் ஆரோக்கியமாக இருக்கிறது.",
        "error_generic": "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சி செய்யுங்கள்."
    }
}


async def translate_text(text: str, target_lang: str, source_lang: str = "en") -> str:
    # tries Gemini translation first, falls back to COMMON_PHRASES lookup

    if target_lang == source_lang:
        return text

    # check common phrases first - faster and more reliable
    for lang_dict in COMMON_PHRASES.get(target_lang, {}).values():
        if isinstance(lang_dict, str) and text in lang_dict:
            return lang_dict

    if not GEMINI_API_KEY:
        print(f"[warn] no API key for translation, returning original text")
        return text

    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)

        prompt = (
            f"Translate the following agricultural advisory text from {source_lang} to {target_lang}. "
            f"Use simple, farmer-friendly vocabulary. Keep it concise. "
            f"Return ONLY the translated text, nothing else.\n\nText: {text}"
        )

        loop = asyncio.get_event_loop()
        resp = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
        translated = resp.text.strip()
        print(f"[translate] {source_lang}->{target_lang}: {text[:30]}... => {translated[:30]}...")
        return translated

    except Exception as e:
        print(f"[error] translation failed: {e}")
        return text  # return original on failure, better than crashing


def get_phrase(key: str, lang: str) -> str:
    """quick lookup for common phrases"""
    lang_phrases = COMMON_PHRASES.get(lang, COMMON_PHRASES.get("hi", {}))
    return lang_phrases.get(key, "")
