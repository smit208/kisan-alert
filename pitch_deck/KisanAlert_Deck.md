# KisanAlert: Smart Water, Crop & Advisory System
### Pitch Deck — Track 4 Submission | Build with AI: Code for Communities

---

## Slide 1 — Cover

**KisanAlert**
*Smart Water, Crop & Advisory for Every Farmer. In Their Language.*

Built with Google Cloud + Gemini AI  
Track 4: Kisan Alert — Smart Water, Crop & Advisory System  
Build with AI: Code for Communities | Google Cloud × Hack2Skill

---

## Slide 2 — The Real Problem (From the Ground)

In Warangal, a cotton farmer named Suresh plants based on what his father grew. He has no soil test. He has no idea his groundwater table has dropped 4 meters in three years. He finds out his crop failed in October.

**This is not an edge case. This is the norm.**

- 86% of Indian farmers are small/marginal — less than 2 hectares
- Crop failure due to dry spells kills seasons that took 6 months of inputs
- Agricultural extension workers serve 1 per ~800 farmers (WHO ratio for comparison: 1 doctor per 1000)
- Indic language literacy barriers mean English/app-based solutions don't reach them

> "Farmers make crop decisions based on habit or hearsay, not soil health or groundwater data." — MP problem statement, Track 4

---

## Slide 3 — What KisanAlert Does

Three things. Integrated. SMS/voice-first. In the farmer's language.

**1. Crop Recommendation Engine**
Tells a farmer what to plant THIS season based on their district's actual soil composition, groundwater depth, and rainfall forecast — not guesswork.

**2. Dry-Spell & Weather Alert System**
Proactively texts or calls the farmer 5-7 days before a dry spell hits. Not reactive. Not after the crop is already stressed.

**3. Crop Disease Diagnosis**
Farmer sends a photo of their crop. Gets back: what disease, how bad, what to do, organic and chemical options — and if it's serious, an actual Rythu Seva Kendra officer follows up by phone.

All three talk to each other. One farmer. One conversation. All three working.

---

## Slide 4 — How It Works (Technical Architecture)

```
Farmer (SMS/Voice/WhatsApp)
         |
    [SMS Gateway / Voice Bridge]
    (Twilio-compatible, simulated in demo)
         |
    [Multilingual Conversational Layer]
    Gemini 1.5 Flash — understands farmer intent in
    Hindi, Telugu, Kannada, Marathi, Tamil
         |
    +------------+----------+-------------+
    |            |          |             |
[Crop Rec]  [Weather]  [Disease Diag]  [General
 Engine      Alerts     Gemini Vision   Advisory]
    |            |          |
 SoilGrids  Open-Meteo  PlantVillage-
 IMD data   7-day API   style prompting
    |            |          |
    +------------+----------+
         |
    [Response in Farmer's Language]
    SMS text OR Google Cloud TTS voice call
         |
    [RSK Escalation if needed]
    Auto-assign to nearest Rythu Seva Kendra
```

Google Cloud services used: Gemini 1.5 Flash (vision + NLU + conversation), Cloud Text-to-Speech, Cloud Speech-to-Text, Cloud Run (deployment)

---

## Slide 5 — The AI Is Doing Real Work

This is not a chatbot with canned responses. Let's be specific about what Gemini is doing:

**Crop Recommendation:**
- Soil pH 6.4, sandy loam, groundwater at 8m, 742mm kharif rainfall -> Gemini factors all of this plus live Open-Meteo 7-day forecast to rank cotton above rice for Warangal this season
- Not a rule lookup. A scored recommendation with reasoning in Telugu.

**Disease Diagnosis:**
- Farmer photos a yellowing leaf in Guntur. Gemini Vision identifies *Alternaria leaf spot* on groundnut, estimates severity (medium), recommends Mancozeb spray at 2g/L, flags for RSK if confidence < 72%
- The prompt is tuned to ask for structured output: disease name, severity, organic treatment, chemical treatment, confidence score

**Conversation:**
- Farmer types "meri fasal mein kuch kharaabi lag rahi hai" (my crop seems to have a problem)
- Gemini detects advisory intent, routes to disease module, asks "kya aap ek photo bhej sakte hain?" (can you send a photo?) — in Hindi
- The whole thing works over 2G on a basic Android phone

---

## Slide 6 — Voice & SMS First (Inclusivity)

Because a smartphone app would reach the wrong farmers.

**How a farmer actually uses this:**

1. Farmer calls the KisanAlert number (or sends SMS to a short code)
2. IVR asks: "Hindi mein baat karein" / "Telugu lo matladandi"
3. Farmer speaks: "Is baar kaun si fasal lagaun?"
4. Cloud STT converts to text. Gemini processes.
5. Response in farmer's language via TTS voice call OR plain SMS.
6. If farmer sends a WhatsApp image — same pipeline, image routed to diagnosis module.

**Languages supported:** Hindi, Telugu, Kannada, Marathi, Tamil (Bengali, Odia in next sprint)

**Connectivity:** Designed for 2G/EDGE. No app install. No smartphone required. Works on a Rs. 800 feature phone.

**Literacy:** Voice-first. Farmer never needs to type.

---

## Slide 7 — Rythu Seva Kendra Integration

The genius of this is we're NOT building a new system. We're amplifying what's already there.

Rythu Seva Kendras (RSKs) are government agricultural extension centers across Telangana and AP. There are 3,643 of them. Each has a trained officer. Most are underutilized because farmers don't know what they offer, or the officer can't reach every farmer.

**KisanAlert slots in like this:**
- RSK officer installs the KisanAlert dashboard on any laptop/tablet
- Flagged disease cases appear in their queue automatically, with photo + diagnosis + farmer phone number
- Officer makes one call. Farmer gets expert follow-up.
- Officer can also push district-wide alerts via the dashboard

This means KisanAlert can scale from 0 to district-wide in days — not months. No new hardware. No new centers. The infrastructure already exists.

---

## Slide 8 — Who It Serves & Why This Is Different

**Primary users:** Small and marginal farmers (< 2 hectares) in Telangana, AP, Maharashtra, Karnataka, Bihar

**Why now, why this:**
- Gemini's multilingual capability on Indic languages is genuinely good enough for agricultural queries
- Open-Meteo provides district-level forecasts free of charge, including India
- SoilGrids gives 250m resolution soil data globally with a REST API
- None of these existed at usable quality two years ago

**What we're NOT doing:**
- Not replacing the RSK officer. Supporting them.
- Not requiring internet-connected smartphones. 2G SMS works.
- Not asking farmers to change behavior. They already call for advice. We just give them a number.

---

## Slide 9 — Demo Walkthrough

**Scenario 1 — Crop Recommendation (Warangal, Telugu)**
- Farmer Suresh asks: "ee yeda em panta veyali?" (What crop to plant this year?)
- KisanAlert: Checks Warangal soil data (red sandy loam, pH 6.4, GW 8m), 2026 kharif forecast
- Response: Cotton #1 (score 87), then Tur Dal, then Groundnut. With Telugu reasoning.

**Scenario 2 — Dry Spell Alert (Guntur, Hindi)**
- System detects: Open-Meteo shows 2.1mm over next 7 days for Guntur
- Auto-SMS sent to registered farmers: "agle 7 dinon mein barish nahin hogi. abhi sinchai karen."

**Scenario 3 — Disease Diagnosis + RSK Escalation**
- Farmer Raju sends photo from Kurnool (groundnut leaf with spots)
- Gemini Vision: Alternaria leaf spot, medium severity, Mancozeb recommended
- Confidence: 68% -> flagged for RSK-KNL-001 (Sri T. Narasimha Rao, 08518-222456)
- Officer sees it in dashboard, calls Raju within 2 hours

---

## Slide 10 — From One District to the Country

**Month 1 (Pilot):** 3 districts in Telangana — Warangal, Guntur, Nalgonda. ~50 farmers via RSK officers. Manual onboarding.

**Month 3:** 10 districts across Telangana + AP. 500 farmers. RSK officers trained on dashboard. Feedback loop for improving recommendations.

**Month 6:** State rollout with integration into Telangana's existing Rythu Bandhu farmer database. 2 lakh farmers potentially reachable via SMS broadcast.

**Year 2:** Multi-state. Tie-in with PM-KISAN farmer registry (10 crore registered farmers) for SMS delivery at state-level. Soil data coverage expands via Bhuvan (ISRO) integration.

**What makes this scalable:**
- Cloud Run autoscales to handle any number of concurrent requests
- No per-farmer infrastructure — a district is just a lat/lon lookup
- Adding a new language is a Gemini prompt change, not an engineering sprint
- RSK network already covers 3,643 centers nationally

---

## Slide 11 — Technical Stack & Google Cloud

| What | Technology |
|---|---|
| Intelligence / NLU | Gemini 1.5 Flash |
| Crop Disease Vision | Gemini 1.5 Flash Vision |
| Voice to Text | Google Cloud Speech-to-Text |
| Text to Voice | Google Cloud Text-to-Speech |
| Translation | Gemini (domain-tuned) |
| API + backend | FastAPI on Python 3.11 |
| Deployment | Google Cloud Run |
| Soil data | SoilGrids v2.0 REST API + ICAR data |
| Weather | Open-Meteo (free, India coverage) |
| Rainfall history | IMD district normals |

Containerized, stateless, deploys to Cloud Run in 10 minutes.

---

## Slide 12 — Why This Will Actually Work

Two reasons this isn't the usual agri-tech promise:

**1. We're working WITH existing government infrastructure, not around it.**
Rythu Seva Kendras are funded, staffed, and already trusted by farmers. We give their officers better tools and a direct channel to farmers who need urgent help. The system earns adoption by making RSK officers more effective, not by trying to replace them.

**2. The AI cost structure actually works for this population.**
Gemini 1.5 Flash costs ~$0.000075 per 1K tokens (input). A full crop recommendation conversation is roughly 2,000 tokens. That's $0.00015 per farmer interaction. At 1 lakh interactions per month, that's Rs. 1,260 per month in AI inference costs. The entire platform — Cloud Run, Gemini, TTS — can run for a district pilot under Rs. 5,000/month. Government can fund this from existing extension program budgets.

---

*KisanAlert | Built for Track 4 — Kisan Alert: Smart Water, Crop & Advisory System*
*Google Cloud x Hack2Skill | Build with AI: Code for Communities*
*Submission deadline: July 8, 2026*
