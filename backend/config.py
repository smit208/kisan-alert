import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GCP_PROJECT_ID = os.getenv("GCP_PROJECT_ID", "")
# change this before demo - using flash for cost reasons
GEMINI_MODEL = "gemini-1.5-flash"

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

# dry spell threshold - less than this over 7 days = alert
DRY_SPELL_THRESHOLD_MM = 5.0

# if disease confidence is below this, escalate to RSK
DIAGNOSIS_CONFIDENCE_THRESHOLD = 0.72

SUPPORTED_LANGS = ["hi", "te", "kn", "mr", "ta", "en"]

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
