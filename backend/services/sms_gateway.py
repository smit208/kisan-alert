from datetime import datetime

# in prod this would be Twilio or MSG91, for now just in-memory
sent_messages = []  # yes this resets on restart, fine for demo

# pre-seeded demo messages to populate the dashboard
DEMO_MESSAGES = [
    {
        "id": "demo_001",
        "from": "+919849012345",
        "to": "+911800KISAN1",
        "message": "మా పొలంలో వరి ఆకులు పసుపు పడుతున్నాయి. ఏం చేయాలి?",
        "lang": "te",
        "timestamp": "2026-07-08T06:10:00",
        "direction": "inbound",
        "farmer_name": "Ramaiah Goud",
        "district": "Warangal"
    },
    {
        "id": "demo_001_r",
        "from": "+911800KISAN1",
        "to": "+919849012345",
        "message": "మీ వరి పంటలో నత్రజని లోపం ఉండవచ్చు. ఎకరానికి 20 కేజీల యూరియా వేయండి. మరింత సమాచారానికి Warangal RSK కి వెళ్ళండి: 0870-2441234",
        "lang": "te",
        "timestamp": "2026-07-08T06:11:30",
        "direction": "outbound",
        "farmer_name": "Ramaiah Goud",
        "district": "Warangal"
    },
    {
        "id": "demo_002",
        "from": "+919440123789",
        "to": "+911800KISAN1",
        "message": "इस बार कपास बोना चाहिए या धान? मौसम कैसा रहेगा?",
        "lang": "hi",
        "timestamp": "2026-07-08T06:45:00",
        "direction": "inbound",
        "farmer_name": "Srinivas Reddy",
        "district": "Guntur"
    },
    {
        "id": "demo_002_r",
        "from": "+911800KISAN1",
        "to": "+919440123789",
        "message": "आपके क्षेत्र में इस बार कपास अच्छी रहेगी। MSP ₹7020/क्विंटल है। अगले 7 दिन बारिश कम है, इसलिए बुवाई के बाद एक सिंचाई करें।",
        "lang": "hi",
        "timestamp": "2026-07-08T06:46:15",
        "direction": "outbound",
        "farmer_name": "Srinivas Reddy",
        "district": "Guntur"
    },
    {
        "id": "demo_003",
        "from": "+919866543210",
        "to": "+911800KISAN1",
        "message": "నా పొలంలో పత్తి మొక్కలు వాడిపోతున్నాయి. వేరు కుళ్ళు వస్తుందా?",
        "lang": "te",
        "timestamp": "2026-07-08T07:22:00",
        "direction": "inbound",
        "farmer_name": "Lakshmi Devi",
        "district": "Nalgonda"
    },
    {
        "id": "demo_003_r",
        "from": "+911800KISAN1",
        "to": "+919866543210",
        "message": "వేరు కుళ్ళు అయి ఉండవచ్చు. వేప నూనె 3% స్ప్రే చేయండి. ఫోటో పంపిస్తే మరింత సరిగా చెప్పగలం. మీ విషయం వ్యవసాయ నిపుణుడికి పంపబడింది.",
        "lang": "te",
        "timestamp": "2026-07-08T07:23:45",
        "direction": "outbound",
        "farmer_name": "Lakshmi Devi",
        "district": "Nalgonda"
    },
    {
        "id": "demo_004",
        "from": "+917702891234",
        "to": "+911800KISAN1",
        "message": "खाद कब डालें? धान लगाए 15 दिन हो गए।",
        "lang": "hi",
        "timestamp": "2026-07-08T08:01:00",
        "direction": "inbound",
        "farmer_name": "Bhim Rao",
        "district": "Warangal"
    },
    {
        "id": "demo_004_r",
        "from": "+911800KISAN1",
        "to": "+917702891234",
        "message": "रोपाई के 21 दिन बाद यूरिया 30 किलो/एकड़ डालें। अभी 6 दिन और रुकें। DAP पहले ही डाल चुके हों तो ठीक है।",
        "lang": "hi",
        "timestamp": "2026-07-08T08:02:20",
        "direction": "outbound",
        "farmer_name": "Bhim Rao",
        "district": "Warangal"
    }
]


def send_sms(to_number: str, message: str, lang: str = "hi") -> dict:
    # truncate to 160 chars if needed (SMS limit)
    if len(message) > 160:
        message = message[:157] + "..."

    entry = {
        "id": f"sms_{len(sent_messages)+1:04d}",
        "to": to_number,
        "message": message,
        "lang": lang,
        "timestamp": datetime.now().isoformat(),
        "status": "sent",
        "direction": "outbound"
    }
    sent_messages.append(entry)
    print(f"[sms] sent to {to_number}: {message[:50]}...")
    return {"status": "sent", "message_id": entry["id"]}


def get_sent_messages() -> list:
    # return demo messages + any real ones sent during session
    all_msgs = DEMO_MESSAGES + sent_messages
    return sorted(all_msgs, key=lambda x: x.get("timestamp", ""), reverse=True)


def simulate_inbound(from_number: str, message: str, lang: str = "hi") -> dict:
    # pretends a farmer sent an SMS
    entry = {
        "id": f"inbound_{len(sent_messages)+1:04d}",
        "from": from_number,
        "message": message,
        "lang": lang,
        "timestamp": datetime.now().isoformat(),
        "direction": "inbound",
        "status": "received"
    }
    sent_messages.append(entry)
    print(f"[sms] inbound from {from_number}: {message[:60]}")
    return {"status": "received", "message_id": entry["id"], "message": entry}
