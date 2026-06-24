import asyncio
import os
from datetime import datetime

# TODO: wire up actual Cloud TTS/STT once GCP project is set up
# for now this just returns mock audio URL and logs the transcript

# actual Google Cloud TTS voice names - these are real
LANG_VOICE_MAP = {
    "te": {"FEMALE": "te-IN-Standard-A", "MALE": "te-IN-Standard-B"},
    "hi": {"FEMALE": "hi-IN-Standard-A", "MALE": "hi-IN-Standard-C"},
    "kn": {"FEMALE": "kn-IN-Standard-A", "MALE": "kn-IN-Standard-B"},
    "mr": {"FEMALE": "mr-IN-Standard-A", "MALE": "mr-IN-Standard-C"},
    "ta": {"FEMALE": "ta-IN-Standard-A", "MALE": "ta-IN-Standard-B"},
    "en": {"FEMALE": "en-IN-Standard-A", "MALE": "en-IN-Standard-B"},
}

# sample rate per language - some indic langs need slower speed
LANG_SPEAKING_RATE = {
    "te": 0.9,
    "hi": 1.0,
    "kn": 0.9,
    "mr": 1.0,
    "ta": 0.85,
    "en": 1.0,
}


async def text_to_speech(text: str, lang: str, voice_gender: str = "FEMALE") -> dict:
    # would call Cloud TTS API, returns audio file URL
    # returning mock for demo
    voice_name = LANG_VOICE_MAP.get(lang, LANG_VOICE_MAP["hi"]).get(voice_gender, "hi-IN-Standard-A")
    speaking_rate = LANG_SPEAKING_RATE.get(lang, 1.0)

    print(f"[tts] mock: lang={lang} voice={voice_name} rate={speaking_rate} text_len={len(text)}")

    # in prod: call GCP TTS here, save mp3 to GCS, return signed URL
    # resp = texttospeech.TextToSpeechClient().synthesize_speech(...)
    # gcs_url = upload_to_gcs(resp.audio_content)

    mock_audio_id = f"audio_{abs(hash(text + lang)) % 99999:05d}"

    return {
        "audio_url": f"https://storage.googleapis.com/kisanalert-demo/audio/{mock_audio_id}.mp3",
        "voice": voice_name,
        "lang": lang,
        "duration_seconds_estimate": max(3, len(text) // 12),
        "mock": True,
        "generated_at": datetime.now().isoformat()
    }


async def speech_to_text(audio_b64: str, lang: str) -> dict:
    # would call Cloud STT, for demo returns mock transcript
    print(f"[stt] mock: lang={lang} audio_b64_len={len(audio_b64)}")

    # map of demo transcripts by language for testing
    # in prod: send audio_b64 to Cloud STT with language_code
    mock_transcripts = {
        "te": "మా పొలంలో వరి ఆకులు పసుపు పడుతున్నాయి",
        "hi": "मेरी धान की फसल में पत्तियां पीली हो रही हैं",
        "kn": "ನಮ್ಮ ಭತ್ತದ ಎಲೆಗಳು ಹಳದಿ ಆಗುತ್ತಿವೆ",
        "mr": "माझ्या भात पिकाची पाने पिवळी होत आहेत",
        "ta": "என் நெல் பயிரின் இலைகள் மஞ்சளாகி விட்டன",
        "en": "My rice crop leaves are turning yellow"
    }

    transcript = mock_transcripts.get(lang, mock_transcripts["hi"])
    confidence = 0.91  # hardcoded mock confidence

    return {
        "transcript": transcript,
        "confidence": confidence,
        "lang": lang,
        "mock": True,
        "alternatives": []  # would have nbest results from real STT
    }
