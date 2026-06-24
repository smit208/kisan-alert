# KisanAlert

Smart water, crop & advisory system for small/marginal farmers in India. Built for Track 4 of the Google Cloud × Hack2Skill "Build with AI: Code for Communities" hackathon.

Three things it does: recommends crops based on actual soil/rainfall data, sends dry-spell alerts before farmers even notice the problem, and diagnoses crop disease from a photo. All via SMS or voice in Hindi/Telugu/Kannada/Marathi.

---

## Quick setup

**Requirements:** Python 3.11+, pip

```bash
cd kisan-alert/backend
pip install -r requirements.txt
cp ../.env.example ../.env
# edit .env and add your GEMINI_API_KEY
uvicorn app:app --reload --port 8000
```

Open `frontend/index.html` in a browser. That's it.

If you don't have a Gemini key, it still runs — just returns mock responses for everything. Good enough to demo the flow.

---

## Project structure

```
kisan-alert/
├── backend/
│   ├── app.py                  # FastAPI main, all routes here
│   ├── config.py
│   ├── modules/
│   │   ├── crop_recommender.py
│   │   ├── weather_alerts.py
│   │   ├── disease_diagnosis.py
│   │   └── conversation.py
│   ├── services/
│   │   ├── sms_gateway.py
│   │   ├── voice_gateway.py
│   │   └── translation.py
│   └── data/                   # soil, rainfall, crops, RSK centers
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── scripts/
│   ├── seed_data.py
│   └── test_modules.py
├── .env.example
└── Dockerfile
```

---

## Environment variables

See `.env.example`. Minimum needed for full functionality:

- `GEMINI_API_KEY` — Gemini 1.5 Flash (handles NLU, translation, vision, conversation)
- `GCP_PROJECT_ID` — only needed if you're using Cloud TTS/STT (optional, voice is simulated for demo)

Weather data comes from Open-Meteo (free, no key needed).

---

## API

```
POST /api/chat              conversational layer (Gemini)
POST /api/recommend         crop recommendation by district
GET  /api/alerts/{district} weather/dry-spell alerts
POST /api/diagnose          crop disease from image (base64)
GET  /api/cases/flagged     cases escalated to RSK
POST /webhook/sms           inbound SMS simulation
GET  /api/health
```

Full request/response examples in `scripts/test_modules.py`.

---

## Known limitations / not done yet

- Voice STT/TTS is simulated. To enable real voice: set GCP_PROJECT_ID and enable Cloud Speech API on your project
- Rainfall data only covers the 10 districts in `data/rainfall_history.json`. Other districts fall back to nearest zone average (not great)
- Disease diagnosis works on any crop photo but is best on cotton, rice, groundnut — the prompt is tuned for those
- No persistent storage — all flagged cases and sent messages reset when the server restarts. Would need a simple Postgres or Firestore for production

---

## Deploying to Cloud Run

```bash
docker build -t kisan-alert .
docker tag kisan-alert gcr.io/YOUR_PROJECT/kisan-alert
docker push gcr.io/YOUR_PROJECT/kisan-alert
gcloud run deploy kisan-alert --image gcr.io/YOUR_PROJECT/kisan-alert --platform managed --allow-unauthenticated
```

Set `GEMINI_API_KEY` as a Cloud Run env var or Secret Manager secret.

---

## Data sources

- Soil data: SoilGrids v2.0 (ISRIC) + ICAR district soil health reports
- Rainfall history: IMD district normals 1991-2020
- Crop suitability: ICAR crop production guides + state agriculture dept recommendations
- Weather forecasts: Open-Meteo (open source, no attribution required)
- RSK center contacts: Government of Telangana + AP Agriculture Dept directories

