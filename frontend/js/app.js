// ============================================================
//  KisanAlert Dashboard — app.js
//  Agricultural Intelligence Platform Frontend
//  Written: July 2026
// ============================================================

// TODO: Move API_BASE to env config before production
const API_BASE = 'http://localhost:8000';

// ---- App State ----
var currentLang = 'te';
var currentDistrict = 'Chittoor';
var currentFarmer = { name: 'Ramaiah', phone: '+91 94408 12345' };
var isBackendLive = false;  // toggled after first successful call
var tickerCountdown = 30;
var tickerInterval = null;

// Small helper to get current time string
function nowTime() {
  var d = new Date();
  var h = d.getHours(), m = d.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}

function nowDateStr() {
  var d = new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============================================================
//  MOCK DATA
// ============================================================

var MOCK_FLAGGED_CASES = [
  {
    id: 'F-0091',
    district: 'Kurnool',
    cropEmoji: '🥜',
    diagnosis: 'Groundnut Leaf Spot',
    severity: 'high',
    rsk: 'RSK Kurnool-2',
    status: 'pending'
  },
  {
    id: 'F-0077',
    district: 'Warangal',
    cropEmoji: '🌿',
    diagnosis: 'Cotton Bollworm',
    severity: 'high',
    rsk: 'RSK Warangal-1',
    status: 'contacted'
  },
  {
    id: 'F-0134',
    district: 'Guntur',
    cropEmoji: '🌶️',
    diagnosis: 'Chilli Mosaic Virus',
    severity: 'medium',
    rsk: 'RSK Guntur-3',
    status: 'pending'
  },
  {
    id: 'F-0058',
    district: 'Nashik',
    cropEmoji: '🍇',
    diagnosis: 'Downy Mildew (Grape)',
    severity: 'medium',
    rsk: 'RSK Nashik-1',
    status: 'resolved'
  },
  {
    id: 'F-0203',
    district: 'Vidisha',
    cropEmoji: '🌾',
    diagnosis: 'Wheat Rust (Yellow)',
    severity: 'high',
    rsk: 'RSK Vidisha-1',
    status: 'pending'
  }
];

var MOCK_RECOMMENDATIONS = [
  {
    district: 'Warangal',
    count: 14,
    crops: [
      { name: 'Cotton', score: 88 },
      { name: 'Soybean', score: 74 },
      { name: 'Maize', score: 61 }
    ]
  },
  {
    district: 'Guntur',
    count: 9,
    crops: [
      { name: 'Chilli', score: 91 },
      { name: 'Tobacco', score: 65 },
      { name: 'Groundnut', score: 58 }
    ]
  },
  {
    district: 'Kurnool',
    count: 11,
    crops: [
      { name: 'Groundnut', score: 84 },
      { name: 'Sunflower', score: 72 },
      { name: 'Cotton', score: 55 }
    ]
  },
  {
    district: 'Nashik',
    count: 8,
    crops: [
      { name: 'Grapes', score: 89 },
      { name: 'Onion', score: 77 },
      { name: 'Wheat', score: 49 }
    ]
  },
  {
    district: 'Vidisha',
    count: 7,
    crops: [
      { name: 'Wheat', score: 86 },
      { name: 'Chickpea', score: 73 },
      { name: 'Mustard', score: 68 }
    ]
  },
  {
    district: 'Bijapur',
    count: 5,
    crops: [
      { name: 'Jowar', score: 79 },
      { name: 'Sunflower', score: 62 },
      { name: 'Cotton', score: 54 }
    ]
  }
];

var MOCK_ALERTS = [
  {
    type: 'rain',
    icon: '🌧️',
    title: 'Heavy Rainfall Advisory — Warangal, Nalgonda',
    district: 'Warangal',
    time: '08:14 AM',
    detail: 'IMD forecast: 64mm rainfall in next 48h. Delay irrigation, check drainage.'
  },
  {
    type: 'pest',
    icon: '🦗',
    title: 'Fall Armyworm Alert — Guntur, Kurnool',
    district: 'Guntur',
    time: '07:30 AM',
    detail: 'Scouting recommended. Threshold: >2 larvae per plant. Spray Spinosad 45 SC.'
  },
  {
    type: 'heat',
    icon: '🌡️',
    title: 'Heat Wave Warning — Vidisha, Madhubani',
    district: 'Vidisha',
    time: '06:45 AM',
    detail: 'Temp forecast: 42°C+. Irrigate in evening. Cover nursery seedlings.'
  },
  {
    type: 'frost',
    icon: '❄️',
    title: 'Night Frost Risk — Nashik (Grapes)',
    district: 'Nashik',
    time: 'Yesterday 11 PM',
    detail: 'Min temp expected to drop below 4°C. Use frost protection nets.'
  },
  {
    type: 'rain',
    icon: '⛈️',
    title: 'Thunderstorm Alert — Solapur',
    district: 'Solapur',
    time: 'Yesterday 9 PM',
    detail: 'Lightning risk during evening hours. Avoid open fields 4–7 PM.'
  }
];

var MOCK_FARMERS = [
  { name: 'Ramaiah',       district: 'Chittoor',  lang: 'తెలుగు' },
  { name: 'Suresh Kumar',  district: 'Warangal',  lang: 'हिंदी' },
  { name: 'Basavaraj',     district: 'Bijapur',   lang: 'ಕನ್ನಡ' },
  { name: 'Mangesh Patil', district: 'Nashik',    lang: 'मराठी' },
  { name: 'Narasimha Rao', district: 'Kurnool',   lang: 'తెలుగు' },
  { name: 'Laxmi Devi',    district: 'Nalgonda',  lang: 'తెలుగు' },
  { name: 'Rajendra Yadav',district: 'Madhubani', lang: 'हिंदी' },
  { name: 'Kavitha S.',    district: 'Guntur',    lang: 'తెలుగు' }
];

// ============================================================
//  MOCK RESPONSES for when backend is unavailable
// ============================================================

var MOCK_CHAT_RESPONSES = {
  default_te: `నమస్కారం! మీ సమస్య అర్థమైంది. 🌿\n\nఆకులు పసుపు రంగుకు మారడం సాధారణంగా నత్రజని లోపం (Nitrogen Deficiency) వల్ల జరుగుతుంది.\n\n**సూచించిన చికిత్స:**\n• యూరియా 2% స్ప్రే (20g/litre) వారానికి ఒకసారి\n• మట్టి పరీక్ష చేయించుకోండి\n• నీరు పెట్టే సమయం మార్చండి — ఉదయం పెట్టండి\n\n⚠️ RSK కేంద్రానికి తెలియజేశాం.`,
  default_hi: `नमस्ते किसान भाई! 🌾\n\nआपके सवाल के आधार पर — इस मौसम में Warangal के लिए सबसे अच्छी फसलें:\n\n🥇 **कपास (Cotton)** — मिट्टी अनुकूलता 88%\n🥈 **सोयाबीन** — 74%, अच्छी बाजार मांग\n🥉 **मक्का** — 61%, कम पानी में भी अच्छी\n\nMSP 2024-25: कपास ₹7,121/क्विंटल\n\nक्या आप विस्तृत जानकारी चाहते हैं?`,
  default_en: `Hello! Based on your query, here's what our AI analysis suggests:\n\nFor your district and current season, we recommend focusing on soil health monitoring. Our Gemini-powered system has analyzed historical crop data for 11 districts.\n\n📊 Confidence Score: 87%\n\nWould you like a detailed recommendation with input costs?`,
  crop_advice: `🌾 **Crop Recommendation — ${nowDateStr()}**\n\nBased on soil data, rainfall forecast & MSP for your district:\n\n1. 🥇 Cotton — Suitability 88%, MSP ₹7,121\n2. 🥈 Soybean — Suitability 74%, MSP ₹4,600\n3. 🥉 Maize — Suitability 61%, Good market demand\n\n💧 Water requirement: Cotton needs 700mm/season\n📅 Best sowing window: June 15 – July 10`,
  weather_alert: `⛈️ **Weather Alert — Active**\n\nDistrict: ${currentDistrict || 'Your District'}\nIMD Forecast (next 72h):\n\n• Rainfall: 45–60mm expected\n• Max Temp: 36°C | Min: 24°C\n• Wind: NE 18 km/h\n\n⚠️ **Advisory:** Delay pesticide spray for 2 days. Ensure proper drainage in fields.\n\n🌦 Next dry window: Thursday onwards`,
  diagnose: `🔬 **Gemini Vision Analysis Complete**\n\nCrop: Groundnut\nDisease Detected: **Leaf Spot (Cercospora arachidicola)**\nConfidence: 91%\nSeverity: HIGH\n\n💊 **Treatment Protocol:**\n• Mancozeb 75 WP @ 2g/L — spray immediately\n• Remove infected leaves\n• Avoid overhead irrigation\n\n🚩 Case flagged to RSK Chittoor Block 3 for field visit.`
};

// ============================================================
//  API HELPERS
// ============================================================

async function apiPost(endpoint, payload) {
  try {
    var res = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    isBackendLive = true;
    return await res.json();
  } catch (e) {
    console.warn('[KisanAlert] Backend unavailable, using mock response:', e.message);
    isBackendLive = false;
    return null;
  }
}

async function apiGet(endpoint) {
  try {
    var res = await fetch(API_BASE + endpoint, {
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    isBackendLive = true;
    return await res.json();
  } catch (e) {
    console.warn('[KisanAlert] GET failed, using mock:', endpoint);
    return null;
  }
}

// ============================================================
//  CHAT PANEL
// ============================================================

var chatEl = null;

function initChat() {
  chatEl = document.getElementById('chat-messages');
}

// Create and append a date separator
function addDateSep(text) {
  var sep = document.createElement('div');
  sep.className = 'date-sep';
  sep.textContent = text || nowDateStr();
  chatEl.appendChild(sep);
}

// Append a message bubble to the chat
function addMessage(role, text, senderLabel) {
  var wrap = document.createElement('div');
  wrap.className = 'msg-bubble ' + role;

  var senderEl = document.createElement('div');
  senderEl.className = 'msg-sender';
  senderEl.textContent = senderLabel || (role === 'farmer' ? currentFarmer.name : 'KisanAlert 🌿');

  var contentEl = document.createElement('div');
  contentEl.className = 'msg-content';
  // Render basic markdown-ish formatting
  contentEl.innerHTML = formatBotText(text);

  var timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = nowTime();

  wrap.appendChild(senderEl);
  wrap.appendChild(contentEl);
  wrap.appendChild(timeEl);

  chatEl.appendChild(wrap);
  scrollChatToBottom();
  return wrap;
}

// Very simple text formatter — bold, line breaks, bullets
function formatBotText(text) {
  if (!text) return '';
  // Strip --- horizontal rules (look AI-generated)
  text = text.replace(/^-{3,}\s*$/gm, '');
  // Bold **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Bullet points
  text = text.replace(/^• (.+)/gm, '<span style="display:flex;gap:6px;align-items:flex-start;margin:2px 0"><span style="color:#4ade80;font-size:14px;line-height:1.4">•</span><span>$1</span></span>');
  // Line breaks
  text = text.replace(/\n/g, '<br/>');
  // Clean up multiple consecutive <br/>
  text = text.replace(/(<br\/>){3,}/g, '<br/><br/>');
  return text;
}

// Show typing indicator, returns element ref for removal
function showTyping() {
  var bubble = document.createElement('div');
  bubble.className = 'msg-bubble bot';
  bubble.id = 'typing-bubble';

  var indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  bubble.appendChild(indicator);
  chatEl.appendChild(bubble);
  scrollChatToBottom();
  return bubble;
}

function removeTyping() {
  var el = document.getElementById('typing-bubble');
  if (el) el.remove();
}

function scrollChatToBottom() {
  chatEl.scrollTop = chatEl.scrollHeight;
}

// ---- Pre-populate demo conversation on load ----
function loadDemoConversation() {
  addDateSep('Today — ' + nowDateStr());

  // Turn 1: Farmer sends Telugu message about crop issue
  addMessage('farmer', 'నా వేరుశెనగ ఆకులపై మచ్చలు వస్తున్నాయి 😟 చాలా భయంగా ఉంది', 'Ramaiah (+91 94408 12345)');

  setTimeout(function() {
    addMessage('bot', MOCK_CHAT_RESPONSES.default_te, 'KisanAlert 🌿');
  }, 700);

  // Turn 2: Hindi crop advice
  setTimeout(function() {
    addMessage('farmer', 'इस बार कौन सी फसल लगाऊं? मेरे पास 3 एकड़ है', 'Suresh (+91 98440 67890)');
  }, 1500);

  setTimeout(function() {
    addMessage('bot', MOCK_CHAT_RESPONSES.default_hi, 'KisanAlert 🌿');
  }, 2400);

  // Turn 3: LIVE PHOTO MOMENT — farmer sends a real crop photo
  setTimeout(function() {
    addPhotoMessage(
      'Ramaiah (+91 94408 12345)',
      'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=200&h=120&fit=crop',
      'groundnut_leaf_spot.jpg'
    );
  }, 3200);

  // Show "Analyzing with Gemini Vision..." typing state
  setTimeout(function() {
    var analyzeEl = addMessage('bot',
      '🔍 Image received. Analyzing with Gemini Vision AI...',
      'KisanAlert 🌿');
    analyzeEl.classList.add('analyzing-pulse');
  }, 4000);

  // Final: full diagnosis result
  setTimeout(function() {
    // Remove analyzing message
    var prev = chatEl.querySelector('.analyzing-pulse');
    if (prev) prev.remove();
    addMessage('bot', MOCK_CHAT_RESPONSES.diagnose, 'KisanAlert 🌿');
  }, 5800);
}

// Append a farmer photo bubble to chat
function addPhotoMessage(senderLabel, imgUrl, filename) {
  var wrap = document.createElement('div');
  wrap.className = 'msg-bubble farmer';

  var senderEl = document.createElement('div');
  senderEl.className = 'msg-sender';
  senderEl.textContent = senderLabel;

  var bubble = document.createElement('div');
  bubble.className = 'chat-photo-bubble';
  bubble.innerHTML =
    '<img src="' + imgUrl + '" alt="Crop photo" onerror="this.src=\'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=200&h=120&fit=crop\'">' +
    '<div class="chat-photo-caption">📎 ' + filename + '</div>';

  var timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = nowTime();

  wrap.appendChild(senderEl);
  wrap.appendChild(bubble);
  wrap.appendChild(timeEl);
  chatEl.appendChild(wrap);
  scrollChatToBottom();
  return wrap;
}

// ---- Send a message (user typed or quick action) ----
async function sendMessage(text, actionType) {
  if (!text && !actionType) return;

  var msgText = text || getQuickActionText(actionType);
  addMessage('farmer', msgText, currentFarmer.name + ' (' + currentFarmer.phone + ')');

  var typingEl = showTyping();

  // Simulate slight processing delay
  await delay(1200 + Math.random() * 800);

  var botResponse = null;

  if (actionType === 'crop') {
    var data = await apiPost('/api/recommend', { district: currentDistrict, lang: currentLang });
    botResponse = data ? formatRecommendResponse(data) : MOCK_CHAT_RESPONSES.crop_advice;
  } else if (actionType === 'weather') {
    var weatherData = await apiGet('/api/alerts/' + currentDistrict);
    botResponse = weatherData ? formatWeatherResponse(weatherData) : MOCK_CHAT_RESPONSES.weather_alert.replace('${currentDistrict || \'Your District\'}', currentDistrict);
  } else if (actionType === 'diagnose') {
    botResponse = MOCK_CHAT_RESPONSES.diagnose;
  } else {
    // Regular chat
    var chatData = await apiPost('/api/chat', { message: text, lang: currentLang, district: currentDistrict });
    if (chatData && chatData.response) {
      botResponse = chatData.response;
    } else {
      // pick a sensible fallback based on lang
      botResponse = MOCK_CHAT_RESPONSES['default_' + currentLang] || MOCK_CHAT_RESPONSES.default_en;
    }
  }

  removeTyping();
  addMessage('bot', botResponse, 'KisanAlert 🌿');
}

function getQuickActionText(action) {
  var texts = {
    crop: '🌾 What crops should I grow this season?',
    weather: '🌦️ What is the weather alert for ' + currentDistrict + '?',
    diagnose: '🔬 Please diagnose my crop issue'
  };
  return texts[action] || 'Help me with my farm';
}

function formatRecommendResponse(data) {
  if (data.recommendations && data.recommendations.length) {
    var text = '🌾 **Crop Recommendations for ' + currentDistrict + ':**\n\n';
    data.recommendations.forEach(function(r, i) {
      var medal = ['🥇', '🥈', '🥉'][i] || '•';
      text += medal + ' **' + r.crop + '** — Score: ' + r.score + '%\n';
      if (r.msp) text += '   MSP: ₹' + r.msp + '/qtl\n';
    });
    return text;
  }
  return MOCK_CHAT_RESPONSES.crop_advice;
}

function formatWeatherResponse(data) {
  if (data.alert) {
    return '⛈️ **Weather Alert**\n\n' + data.alert.description + '\n\nAdvisory: ' + (data.alert.advisory || 'Stay updated.');
  }
  return MOCK_CHAT_RESPONSES.weather_alert;
}

// ---- Mic button — simulated voice input ----
var micActive = false;
var voiceSamples = [
  'मेरी फसल में कीड़े लग गए हैं',
  'నా పొలంలో నీరు నిలబడింది',
  'ಈ ಸಲ ಯಾವ ಬೆಳೆ ಹಾಕಬೇಕು?',
  'When should I apply fertilizer?',
  'माझ्या शेतात पाणी जास्त झालं'
];

function initMic() {
  var micBtn = document.getElementById('mic-btn');
  micBtn.addEventListener('click', function() {
    if (micActive) return;
    micActive = true;
    micBtn.classList.add('recording');

    // simulate recording for 2 seconds then fill the input
    setTimeout(function() {
      micBtn.classList.remove('recording');
      micActive = false;
      var sample = voiceSamples[Math.floor(Math.random() * voiceSamples.length)];
      var inputEl = document.getElementById('chat-input');
      inputEl.value = sample;
      inputEl.focus();
    }, 2000);
  });
}

// ============================================================
//  ADMIN PANEL
// ============================================================

// ---- Animated counter ----
function animateCounter(el, target) {
  var start = 0;
  var duration = 1800;
  var step = target / (duration / 16);
  var current = 0;

  var timer = setInterval(function() {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString('en-IN');
    el.classList.add('counting');
    setTimeout(function() { el.classList.remove('counting'); }, 100);
  }, 16);
}

// ---- crop emoji map by crop name ----
var CROP_EMOJI_MAP = {
  'Rice': '🌾', 'Wheat': '🌾', 'Cotton': '🪴', 'Groundnut': '🥜',
  'Soybean': '🫘', 'Jowar': '🌾', 'Bajra': '🌾', 'Maize': '🌽',
  'Chilli': '🌶️', 'Tomato': '🍅', 'Onion': '🧅', 'Grapes': '🍇',
  'Sunflower': '🌻', 'Sugarcane': '🎋', 'Turmeric': '🟡', 'default': '🌿'
};

var CROP_PHOTO_MAP = {
  'Rice':       'https://images.unsplash.com/photo-1536054989289-13de2f4c62e0?w=60&h=60&fit=crop',
  'Cotton':     'https://images.unsplash.com/photo-1606914501449-5a96b6cd5e4e?w=60&h=60&fit=crop',
  'Groundnut':  'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=60&h=60&fit=crop',
  'Chilli':     'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=60&h=60&fit=crop',
  'Wheat':      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=60&h=60&fit=crop',
  'Soybean':    'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=60&h=60&fit=crop',
  'Maize':      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=60&h=60&fit=crop',
  'Tomato':     'https://images.unsplash.com/photo-1561136594-7f68b2709451?w=60&h=60&fit=crop',
  'Grapes':     'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=60&h=60&fit=crop',
  'Sugarcane':  'https://images.unsplash.com/photo-1568347877321-f8935c7dc5f0?w=60&h=60&fit=crop',
  'default':    'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=60&h=60&fit=crop'
};

// Normalize a case object — handles ALL possible shapes from backend + mock
// Backend actual fields: case_id, disease, rsk (obj {name,phone}), crop, no farmer_name
// Mock fields: id, diagnosis, rsk (string), cropEmoji
// idx is used to generate a stable deterministic ID when no ID field exists
function normalizeCase(c, idx) {
  // farmer display — backend has no farmer_name, use district + case ID
  var farmerName = c.farmer_name || c.farmer || '';
  var farmerPhone = (c.farmer_id && c.farmer_id.startsWith('+')) ? c.farmer_id : '';
  var farmerDisplay;
  if (farmerName) {
    farmerDisplay = farmerName + (farmerPhone ? '<br><small style="opacity:0.6">' + farmerPhone + '</small>' : '');
  } else {
    // backend cases have no farmer name — show district + a farmer persona
    var districtFarmers = {
      'Warangal': 'Ramaiah G.', 'Guntur': 'Kavitha S.', 'Nalgonda': 'Laxmi Devi',
      'Kurnool': 'David Thomas', 'Vidisha': 'Rajendra Yadav', 'Nashik': 'Mangesh Patil',
      'Bijapur': 'Basavaraj', 'Chittoor': 'Venkaiah', 'Solapur': 'Tanaji More',
      'Madhubani': 'Suresh Sah'
    };
    farmerDisplay = districtFarmers[c.district] || ('Farmer, ' + (c.district || ''));
  }

  // RSK — could be: string, object {name, phone}, or missing
  var rskDisplay = '';
  var rskPhone = '';
  var rskOfficer = '';
  var rskVal = c.rsk || c.rsk_center;
  if (typeof rskVal === 'string') {
    rskDisplay = rskVal;
  } else if (rskVal && typeof rskVal === 'object') {
    rskDisplay  = rskVal.name || rskVal.id || 'RSK ' + (c.district || '');
    rskPhone    = rskVal.phone || '';
    rskOfficer  = rskVal.officer_name || rskVal.officer || '';
  } else {
    rskDisplay = 'RSK ' + (c.district || 'Center');
  }

  // diagnosis — backend uses 'disease', mock uses 'diagnosis'
  var diagText = c.diagnosis || c.disease || c.disease_name || 'Under review';

  // crop
  var cropKey = c.crop || c.crop_identified || '';
  var photoUrl = CROP_PHOTO_MAP[cropKey] || CROP_PHOTO_MAP['default'];
  var emoji = CROP_EMOJI_MAP[cropKey] || c.cropEmoji || '🌿';

  // ID — backend uses case_id, mock uses id, fallback uses stable index
  var caseId = c.case_id || c.id || ('CASE-' + String(idx !== undefined ? idx : Math.floor(Math.random()*9000+1000)).padStart(4,'0'));

  return {
    _raw: c,
    id: caseId,
    farmerDisplay: farmerDisplay,
    farmerName: farmerName || farmerDisplay,
    district: c.district || '—',
    cropKey: cropKey,
    photoUrl: photoUrl,
    emoji: emoji,
    diagnosis: diagText,
    severity: (c.severity || 'medium').toLowerCase(),
    rsk: rskDisplay,
    status: c.status || 'pending',
    rsk_phone: c.rsk_phone || rskPhone,
    rsk_officer: c.rsk_officer || rskOfficer,
    treatment: c.treatment || c.treatment_chemical || ''

  };
}

// ---- Flagged Cases Table ----
// Always normalize ONCE, cache by ID, then render from normalized list
function loadAndRender(rawList) {
  _casesCache = {};
  var normalized = rawList.map(function(raw, idx) {
    // Give each a stable index-based ID if none exists
    if (!raw.case_id && !raw.id) raw._idx = idx;
    var n = normalizeCase(raw, idx);
    _casesCache[n.id] = n;
    return n;
  });
  renderFlaggedCases(normalized);
}

function renderFlaggedCases(cases) {
  var tbody = document.getElementById('flagged-tbody');
  tbody.innerHTML = '';

  if (!cases || !cases.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;opacity:0.5;padding:24px">No flagged cases right now</td></tr>';
    return;
  }

  cases.forEach(function(c, idx) {
    // c is already normalized — use directly, no second normalizeCase call
    var isNorm = !!c.farmerDisplay;
    if (!isNorm) c = normalizeCase(c, idx);

    var tr = document.createElement('tr');
    tr.style.animationDelay = (idx * 0.05) + 's';
    tr.setAttribute('data-case-id', c.id);

    var severityBadge = '<span class="badge ' + c.severity + '">' +
      '<span class="badge-dot"></span>' +
      c.severity.toUpperCase() + '</span>';

    var statusPill = '<span class="status-pill ' + c.status + '">' + c.status.replace('_', ' ') + '</span>';

    var photoCell = '<div class="crop-thumb-wrap" title="' + (c.cropKey || 'Crop') + '">' +
      '<img src="' + c.photoUrl + '" alt="' + (c.cropKey || 'crop') + '" ' +
      'style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid rgba(255,255,255,0.1)" ' +
      'onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\'">' +
      '<span style="display:none;font-size:22px">' + c.emoji + '</span>' +
      '</div>';

    tr.innerHTML =
      '<td style="font-size:12px">' + c.farmerDisplay + '</td>' +
      '<td>' + c.district + '</td>' +
      '<td>' + photoCell + '</td>' +
      '<td style="max-width:140px;white-space:normal;font-size:12px">' + c.diagnosis + '</td>' +
      '<td>' + severityBadge + '</td>' +
      '<td style="font-size:12px">' + c.rsk + '</td>' +
      '<td>' + statusPill + '</td>' +
      '<td><button class="action-btn" onclick="openCase(\'' + c.id + '\')">View →</button></td>';

    tbody.appendChild(tr);
  });
}

// Store normalized cases for modal lookup
var _casesCache = {};

async function loadFlaggedCases() {
  var data = await apiGet('/api/cases/flagged');
  var raw = (data && data.cases && data.cases.length) ? data.cases : MOCK_FLAGGED_CASES;
  loadAndRender(raw);
}

function openCase(id) {
  var c = _casesCache[id];
  if (!c) { console.warn('case not found:', id); return; }

  // Build modal HTML
  var existing = document.getElementById('case-modal-overlay');
  if (existing) existing.remove();

  var sevColor = { high: '#ef5350', critical: '#b71c1c', medium: '#ff9800', low: '#4caf50' }[c.severity] || '#888';

  var overlay = document.createElement('div');
  overlay.id = 'case-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease';
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

  overlay.innerHTML =
    '<div style="background:#1a2a1a;border:1px solid rgba(76,175,80,0.3);border-radius:16px;padding:28px;max-width:480px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.6)">' +
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">' +
      '<div>' +
        '<div style="color:#4caf50;font-size:11px;letter-spacing:1px;text-transform:uppercase">Flagged Case</div>' +
        '<div style="color:#e8f5e9;font-size:18px;font-weight:700;margin-top:4px">' + c.id + '</div>' +
      '</div>' +
      '<span style="background:' + sevColor + '22;color:' + sevColor + ';padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;border:1px solid ' + sevColor + '44">' + c.severity.toUpperCase() + '</span>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">' +
      '<div style="background:rgba(76,175,80,0.08);border-radius:10px;padding:12px">' +
        '<div style="color:rgba(232,245,233,0.5);font-size:10px;margin-bottom:4px">FARMER</div>' +
        '<div style="color:#e8f5e9;font-size:13px;font-weight:600">' + (c.farmerName || c.id) + '</div>' +
        '<div style="color:#4caf50;font-size:11px">' + (c.rsk_phone ? 'Ph: ' + c.rsk_phone : '') + '</div>' +
      '</div>' +
      '<div style="background:rgba(76,175,80,0.08);border-radius:10px;padding:12px">' +
        '<div style="color:rgba(232,245,233,0.5);font-size:10px;margin-bottom:4px">DISTRICT</div>' +
        '<div style="color:#e8f5e9;font-size:13px;font-weight:600">' + c.district + '</div>' +
      '</div>' +
      '<div style="background:rgba(76,175,80,0.08);border-radius:10px;padding:12px">' +
        '<div style="color:rgba(232,245,233,0.5);font-size:10px;margin-bottom:4px">DIAGNOSIS</div>' +
        '<div style="color:#ef9a9a;font-size:13px;font-weight:600">' + c.diagnosis + '</div>' +
      '</div>' +
      '<div style="background:rgba(76,175,80,0.08);border-radius:10px;padding:12px">' +
        '<div style="color:rgba(232,245,233,0.5);font-size:10px;margin-bottom:4px">CROP</div>' +
        '<div style="color:#e8f5e9;font-size:13px">' + c.emoji + ' ' + (c.cropKey || 'Unknown') + '</div>' +
      '</div>' +
    '</div>' +
    (c.treatment ? '<div style="background:rgba(255,152,0,0.1);border:1px solid rgba(255,152,0,0.2);border-radius:10px;padding:12px;margin-bottom:16px">' +
      '<div style="color:#ff9800;font-size:10px;letter-spacing:1px;margin-bottom:6px">RECOMMENDED TREATMENT</div>' +
      '<div style="color:#e8f5e9;font-size:12px;line-height:1.5">' + c.treatment + '</div>' +
    '</div>' : '') +
    '<div style="background:rgba(76,175,80,0.08);border-radius:10px;padding:12px;margin-bottom:20px">' +
      '<div style="color:rgba(232,245,233,0.5);font-size:10px;margin-bottom:4px">RSK CENTER ASSIGNED</div>' +
      '<div style="color:#4caf50;font-size:13px;font-weight:600">' + c.rsk + '</div>' +
      (c.rsk_officer ? '<div style="color:rgba(232,245,233,0.6);font-size:11px">Officer: ' + c.rsk_officer + '</div>' : '') +
    '</div>' +
    '<div style="display:flex;gap:10px">' +
      '<button onclick="document.getElementById(\'case-modal-overlay\').remove()" ' +
        'style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(76,175,80,0.3);background:transparent;color:#e8f5e9;cursor:pointer;font-size:13px">Close</button>' +
      '<button onclick="alert(\'Dispatching RSK officer for field visit to ' + c.district + '...\')" ' +
        'style="flex:2;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#2e7d32,#4caf50);color:white;cursor:pointer;font-size:13px;font-weight:600">📞 Dispatch RSK Officer</button>' +
    '</div>' +
    '</div>';

  document.body.appendChild(overlay);
}

function initStatCounters() {
  document.querySelectorAll('.stat-value[data-target]').forEach(function(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    // slight stagger per card
    var delay_ms = parseInt(el.closest('.stat-card').id.replace('stat-', '').length) * 100;
    setTimeout(function() {
      animateCounter(el, target);
    }, delay_ms + 400);
  });
}

// ---- Tab navigation ----
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-pane').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      var pane = document.getElementById('tab-' + tab);
      if (pane) pane.classList.add('active');
    });
  });
}

// ---- Recommendations Tab ----
function renderRecommendations(recs) {
  var grid = document.getElementById('rec-grid');
  grid.innerHTML = '';

  // Rank colors: gold, silver, bronze
  var rankColors = ['#f59e0b', '#94a3b8', '#cd7c3f'];
  var rankLabels = ['#1', '#2', '#3'];

  recs.forEach(function(rec, idx) {
    var card = document.createElement('div');
    card.className = 'rec-card';
    card.style.animationDelay = (idx * 0.07) + 's';

    // Find max score in this district for proportional scaling
    var maxScore = Math.max.apply(null, rec.crops.map(function(c) { return c.score; }));

    var cropsHtml = rec.crops.map(function(c, ci) {
      // Width is proportional relative to the top crop — not just raw %
      // This makes the visual difference obvious even when scores are 88/74/61
      var barWidth = Math.round((c.score / maxScore) * 100);
      var color = rankColors[ci] || '#4ade80';
      var rank  = rankLabels[ci] || '';
      return '<div class="rec-crop-row">' +
        '<span class="rec-rank-badge" style="color:' + color + ';font-size:10px;font-weight:700;width:18px;flex-shrink:0">' + rank + '</span>' +
        '<span class="rec-crop-name">' + c.name + '</span>' +
        '<div class="rec-score-bar">' +
          '<div class="rec-score-fill" style="width:' + barWidth + '%;background:' + color + '"></div>' +
        '</div>' +
        '<span style="font-size:10px;color:rgba(232,245,233,0.6);flex-shrink:0;width:30px;text-align:right">' + c.score + '%</span>' +
      '</div>';
    }).join('');

    card.innerHTML = '<div class="rec-card-header">' +
      '<span class="rec-district">' + rec.district + '</span>' +
      '<span class="rec-count">' + rec.count + ' farmers</span>' +
      '</div>' +
      '<div class="rec-crops">' + cropsHtml + '</div>';

    grid.appendChild(card);
  });
}

// ---- Alerts Tab ----
function renderAlerts(alerts) {
  var list = document.getElementById('alerts-list');
  list.innerHTML = '';

  alerts.forEach(function(a, idx) {
    var item = document.createElement('div');
    item.className = 'alert-item';
    item.style.animationDelay = (idx * 0.06) + 's';

    item.innerHTML = '<div class="alert-icon-wrap ' + a.type + '">' + a.icon + '</div>' +
      '<div class="alert-body">' +
      '<div class="alert-title">' + a.title + '</div>' +
      '<div class="alert-meta">' +
      '<span class="alert-district-tag">📍 ' + a.district + '</span>' +
      '<span>🕐 ' + a.time + '</span>' +
      '</div>' +
      '<div style="font-size:11px;color:rgba(232,245,233,0.5);margin-top:4px;">' + a.detail + '</div>' +
      '</div>';

    list.appendChild(item);
  });
}

// ---- Active Farmers Tab ----
// Generate a consistent color from a name string
function nameToColor(name) {
  var colors = ['#4ade80','#38bdf8','#f59e0b','#a78bfa','#fb7185','#34d399','#60a5fa','#fbbf24'];
  var hash = 0;
  for (var i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function renderFarmers(farmers) {
  if (farmers === MOCK_FARMERS || (_allFarmers.length === 0 && farmers.length > 0)) {
    _allFarmers = farmers;
  }
  var grid = document.getElementById('farmers-grid');
  grid.innerHTML = '';

  farmers.forEach(function(f, idx) {
    var card = document.createElement('div');
    card.className = 'farmer-card';
    card.style.animationDelay = (idx * 0.05) + 's';

    // Initials avatar — two letters, colored circle
    var parts = (f.name || '?').split(' ');
    var initials = parts.length > 1
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].substring(0, 2);
    var bgColor = nameToColor(f.name || '');
    var avatarHtml = '<div style="' +
      'width:38px;height:38px;border-radius:50%;' +
      'background:' + bgColor + '22;' +
      'border:2px solid ' + bgColor + '66;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-size:13px;font-weight:700;color:' + bgColor + ';' +
      'flex-shrink:0;letter-spacing:0.5px' +
    '">' + initials.toUpperCase() + '</div>';

    card.innerHTML = avatarHtml +
      '<div class="farmer-card-name">' + f.name + '</div>' +
      '<div class="farmer-card-district">📍 ' + f.district + '</div>' +
      '<span class="farmer-card-lang">' + f.lang + '</span>';

    grid.appendChild(card);
  });
}

// ---- Refresh flagged cases button ----
function initRefreshBtn() {
  var btn = document.getElementById('refresh-cases-btn');
  if (!btn) return;
  btn.addEventListener('click', function() {
    btn.style.transform = 'rotate(360deg)';
    setTimeout(function() { btn.style.transform = ''; }, 500);
    // Simulate getting a new case after refresh
    loadFlaggedCases().then(function() {
      // maybe add one new fake case
      if (Math.random() > 0.5) {
        addNewFlaggedCase();
      }
    });
  });
}

function addNewFlaggedCase() {
  var newCases = [
    {
      id: 'F-' + (200 + Math.floor(Math.random() * 100)),
      district: 'Solapur',
      cropEmoji: '🌻',
      diagnosis: 'Sunflower Downy Mildew',
      severity: 'medium',
      rsk: 'RSK Solapur-2',
      status: 'pending'
    }
  ];
  var tbody = document.getElementById('flagged-tbody');
  var tr = document.createElement('tr');
  tr.className = 'new-row-flash';
  var c = newCases[0];
  tr.innerHTML = '<td>' + c.id + '</td>' +
    '<td>' + c.district + '</td>' +
    '<td><div class="crop-thumb">' + c.cropEmoji + '</div></td>' +
    '<td>' + c.diagnosis + '</td>' +
    '<td><span class="badge ' + c.severity + '"><span class="badge-dot"></span>' + c.severity.toUpperCase() + '</span></td>' +
    '<td>' + c.rsk + '</td>' +
    '<td><span class="status-pill pending">pending</span></td>' +
    '<td><button class="action-btn" onclick="openCase(\'' + c.id + '\')">View →</button></td>';

  tbody.insertBefore(tr, tbody.firstChild);
  updateStatCounter('stat-val-flagged', 1);
}

// Increment a stat counter by delta
function updateStatCounter(id, delta) {
  var el = document.getElementById(id);
  if (!el) return;
  var current = parseInt(el.textContent.replace(/,/g, ''), 10) || 0;
  animateCounter(el, current + delta);
}

// ============================================================
//  LIVE UPDATE SIMULATION
// ============================================================

var _tickerPaused = false;
var _idleTimer = null;

function pauseTicker() {
  _tickerPaused = true;
  var tickerText = document.getElementById('ticker-text');
  if (tickerText) tickerText.textContent = 'Live monitoring active — paused during interaction';

  // Auto-resume after 30s of no interaction
  clearTimeout(_idleTimer);
  _idleTimer = setTimeout(function() {
    _tickerPaused = false;
    tickerCountdown = 30;
    var t = document.getElementById('ticker-text');
    if (t) t.textContent = 'Live monitoring active — Next update in 30s';
  }, 30000);
}

function startLiveTicker() {
  var tickerText = document.getElementById('ticker-text');
  tickerCountdown = 30;

  // Pause ticker on any user interaction with the dashboard
  ['mousedown', 'keydown', 'touchstart'].forEach(function(evt) {
    document.addEventListener(evt, function() {
      if (!_tickerPaused) pauseTicker();
    }, { passive: true });
  });

  tickerInterval = setInterval(function() {
    if (_tickerPaused) return;
    tickerCountdown--;
    if (tickerText) {
      tickerText.textContent = 'Live monitoring active — Next update in ' + tickerCountdown + 's';
    }
    if (tickerCountdown <= 0) {
      tickerCountdown = 30;
      performLiveUpdate();
    }
  }, 1000);
}

function performLiveUpdate() {
  var tickerText = document.getElementById('ticker-text');
  if (tickerText) tickerText.textContent = '🔄 Fetching latest data...';

  // Guaranteed to resolve in 1.2s regardless of network
  var done = false;
  function finish() {
    if (done) return;
    done = true;
    var alertsEl = document.getElementById('stat-val-alerts');
    if (alertsEl) {
      var cur = parseInt(alertsEl.textContent.replace(/,/g, ''), 10) || 0;
      animateCounter(alertsEl, cur + Math.floor(Math.random() * 4 + 1));
    }
    if (Math.random() > 0.6) {
      var flaggedEl = document.getElementById('stat-val-flagged');
      if (flaggedEl) {
        var fcur = parseInt(flaggedEl.textContent.replace(/,/g, ''), 10) || 0;
        animateCounter(flaggedEl, fcur + 1);
      }
    }
    if (tickerText) tickerText.textContent = '✅ Updated just now';
    setTimeout(function() {
      if (tickerText) tickerText.textContent = 'Live monitoring active — Next update in 30s';
    }, 2000);
  }

  // Always resolve within 1.5s — no way to get stuck
  setTimeout(finish, 1500);
}

// ============================================================
//  CLOCK in Status Bar
// ============================================================

function initClock() {
  function updateClock() {
    var el = document.getElementById('live-clock');
    if (!el) return;
    var now = new Date();
    var opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    el.textContent = now.toLocaleTimeString('en-IN', opts);
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// ============================================================
//  SELECTOR LISTENERS
// ============================================================

function initSelectors() {
  var langSel = document.getElementById('lang-select');
  var distSel = document.getElementById('district-select');

  langSel.addEventListener('change', function() {
    currentLang = langSel.value;
    updatePlaceholder();
    updateFarmerForLang(currentLang);
    reloadChatForLang(currentLang);
  });

  distSel.addEventListener('change', function() {
    currentDistrict = distSel.value;
    updateFarmerForDistrict(currentDistrict);
  });
}

// Farmer names per language for realism
var FARMERS_BY_LANG = {
  hi: { name: 'Ramesh Kumar',   phone: '+91 98765 43210' },
  te: { name: 'Ramaiah',        phone: '+91 94408 12345' },
  kn: { name: 'Basavaraj',      phone: '+91 96325 87410' },
  mr: { name: 'Mangesh Patil',  phone: '+91 90112 34567' },
  en: { name: 'David Thomas',   phone: '+91 99400 11223' }
};

// Greeting message when language switches
var LANG_GREETINGS = {
  hi: 'नमस्ते! मैं KisanAlert हूँ। आपकी खेती से जुड़ी किसी भी समस्या में मदद करूँगा। 🌾\n\nआप पूछ सकते हैं:\n• इस मौसम में कौन सी फसल लगाएं?\n• बारिश का मौसम कैसा रहेगा?\n• फसल में बीमारी की पहचान करें',
  te: 'నమస్కారం! నేను KisanAlert. మీ వ్యవసాయంలో సహాయం చేయడానికి ఇక్కడ ఉన్నాను. 🌾\n\nమీరు అడగవచ్చు:\n• ఈ సీజన్‌లో ఏ పంట వేయాలి?\n• వర్షపాతం ఎంత ఉంటుంది?\n• పంట వ్యాధి నిర్ధారణ చేయండి',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು KisanAlert. ನಿಮ್ಮ ಕೃಷಿಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ. 🌾\n\nನೀವು ಕೇಳಬಹುದು:\n• ಈ ಋತುವಿನಲ್ಲಿ ಯಾವ ಬೆಳೆ ಹಾಕಬೇಕು?\n• ಮಳೆ ಮುನ್ಸೂಚನೆ ಏನು?\n• ಬೆಳೆ ರೋಗ ಪತ್ತೆ ಮಾಡಿ',
  mr: 'नमस्कार! मी KisanAlert. तुमच्या शेतीसाठी मदत करण्यासाठी इथे आहे. 🌾\n\nतुम्ही विचारू शकता:\n• या हंगामात कोणते पीक लावावे?\n• पाऊस किती पडेल?\n• पिकाचा रोग ओळखा',
  en: 'Hello! I am KisanAlert, your AI farming assistant powered by Gemini. 🌾\n\nYou can ask me:\n• What crops to grow this season?\n• Rainfall forecast for your district?\n• Diagnose a crop disease from a photo'
};

function updateFarmerForLang(lang) {
  var farmer = FARMERS_BY_LANG[lang] || FARMERS_BY_LANG['en'];
  currentFarmer = farmer;
  var badge = document.getElementById('farmer-name-display');
  if (badge) badge.textContent = farmer.name + ' (' + farmer.phone + ')';
}

function updateFarmerForDistrict(district) {
  var badge = document.getElementById('farmer-name-display');
  if (badge) badge.textContent = currentFarmer.name + ' (' + currentFarmer.phone + ')';
}

function reloadChatForLang(lang) {
  // Clear chat
  if (chatEl) chatEl.innerHTML = '';

  // Add date separator
  addDateSep(nowDateStr());

  // Show greeting in new language immediately
  addMessage('bot', LANG_GREETINGS[lang] || LANG_GREETINGS['en'], 'KisanAlert 🌿');
}

function updatePlaceholder() {
  var placeholders = {
    hi: 'अपना संदेश टाइप करें...',
    te: 'మీ సందేశాన్ని టైప్ చేయండి...',
    kn: 'ನಿಮ್ಮ ಸಂದೇಶ ಟೈಪ್ ಮಾಡಿ...',
    mr: 'तुमचा संदेश टाइप करा...',
    en: 'Type your message...'
  };
  var input = document.getElementById('chat-input');
  if (input) input.placeholder = placeholders[currentLang] || 'Type your message...';
}


// ============================================================
//  IMAGE UPLOAD / MODAL
// ============================================================

function initImageUpload() {
  var fileInput = document.getElementById('img-upload');
  var modal = document.getElementById('img-modal');
  var modalClose = document.getElementById('modal-close');
  var diagnoseBtn = document.getElementById('modal-diagnose-btn');
  var previewImg = document.getElementById('modal-preview-img');
  var filenameEl = document.getElementById('modal-filename');

  fileInput.addEventListener('change', function() {
    var file = fileInput.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      filenameEl.textContent = file.name;
      modal.style.display = 'flex';
    };
    reader.readAsDataURL(file);
  });

  modalClose.addEventListener('click', function() {
    modal.style.display = 'none';
    fileInput.value = '';
  });

  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
      fileInput.value = '';
    }
  });

  diagnoseBtn.addEventListener('click', async function() {
    modal.style.display = 'none';
    fileInput.value = '';

    addMessage('farmer', '🖼️ [Image Uploaded: ' + (fileInput.files[0] ? fileInput.files[0].name : 'crop_image.jpg') + ']', currentFarmer.name);

    var typing = showTyping();

    // TODO: send actual image data to /api/diagnose
    await delay(2500);
    removeTyping();

    var result = await apiPost('/api/diagnose', { district: currentDistrict, lang: currentLang });
    var responseText = (result && result.diagnosis) ? result.diagnosis : MOCK_CHAT_RESPONSES.diagnose;
    addMessage('bot', responseText, 'KisanAlert 🌿');
  });
}

// ============================================================
//  QUICK ACTIONS & SEND BUTTON
// ============================================================

function initSendButton() {
  var btn = document.getElementById('send-btn');
  var input = document.getElementById('chat-input');

  btn.addEventListener('click', function() {
    var text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendMessage(text, null);
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      btn.click();
    }
  });
}

function initQuickActions() {
  document.querySelectorAll('.quick-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var action = btn.getAttribute('data-action');
      sendMessage(null, action);
    });
  });
}

// ============================================================
//  UTILITY
// ============================================================

function delay(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

// ============================================================
//  INIT — everything kicks off here
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('%c🌾 KisanAlert Dashboard loaded', 'color: #4ade80; font-weight: bold; font-size: 14px;');

  initClock();
  initChat();
  initSelectors();
  initMic();
  initSendButton();
  initQuickActions();
  initImageUpload();
  initConnectivity();
  initDistrictMap();

  // Admin panel setup
  initStatCounters();
  initTabs();
  initRefreshBtn();

  // Populate admin tabs
  loadAndRender(MOCK_FLAGGED_CASES);
  renderRecommendations(MOCK_RECOMMENDATIONS);
  renderAlerts(MOCK_ALERTS);
  renderFarmers(MOCK_FARMERS);

  // Load demo conversation (photo moment at 3.2s)
  setTimeout(loadDemoConversation, 350);

  startLiveTicker();

  setTimeout(function() {
    apiGet('/api/cases/flagged').then(function(data) {
      if (data && data.cases) loadAndRender(data.cases);
    });
    apiGet('/api/messages').then(function(data) {
      if (data && data.alerts) renderAlerts(data.alerts);
    });
  }, 2000);
});

// ============================================================
//  CONNECTIVITY TOGGLE
// ============================================================
var _connMode = 'data';
function initConnectivity() {
  // read badge and set initial state
  var badge = document.getElementById('connectivity-badge');
  if (badge) badge.title = 'Click to toggle SMS/Data mode';
}
function toggleConnectivity() {
  _connMode = _connMode === 'data' ? 'sms' : 'data';
  var badge  = document.getElementById('connectivity-badge');
  var label  = document.getElementById('conn-label');
  if (!badge || !label) return;
  if (_connMode === 'sms') {
    badge.className = 'conn-badge sms-mode';
    label.textContent = 'SMS Fallback';
    // Show a toast-style message in chat
    if (chatEl) {
      var note = document.createElement('div');
      note.style.cssText = 'text-align:center;font-size:11px;color:#f59e0b;padding:6px;margin:4px 0;background:rgba(245,158,11,0.1);border-radius:8px;border:1px solid rgba(245,158,11,0.2)';
      note.textContent = '⚠️ Low connectivity — switching to SMS fallback mode';
      chatEl.appendChild(note);
      scrollChatToBottom();
    }
  } else {
    badge.className = 'conn-badge data-mode';
    label.textContent = 'Data Mode';
    if (chatEl) {
      var note2 = document.createElement('div');
      note2.style.cssText = 'text-align:center;font-size:11px;color:#4ade80;padding:6px;margin:4px 0;background:rgba(74,222,128,0.08);border-radius:8px;border:1px solid rgba(74,222,128,0.15)';
      note2.textContent = '✅ Data connection restored — switching back to full mode';
      chatEl.appendChild(note2);
      scrollChatToBottom();
    }
  }
}

// ============================================================
//  VOICE CALL / IVR SIMULATION
// ============================================================
function triggerVoiceCall() {
  var farmer = currentFarmer || { name: 'Ramaiah', phone: '+91 94408 12345' };

  var overlay = document.createElement('div');
  overlay.className = 'voice-call-overlay';
  overlay.id = 'voice-call-overlay';

  overlay.innerHTML =
    '<div class="voice-call-card">' +
      '<div class="call-avatar">👨‍🌾</div>' +
      '<div class="call-name">' + farmer.name + '</div>' +
      '<div class="call-sub" id="call-status">' + farmer.phone + ' · Incoming IVR Call</div>' +
      '<div class="waveform" id="call-waveform" style="display:none">' +
        '<div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>' +
        '<div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div>' +
        '<div class="wave-bar"></div>' +
      '</div>' +
      '<div class="call-transcript" id="call-transcript"></div>' +
      '<div class="call-actions">' +
        '<button class="call-btn accept" onclick="acceptCall()" id="call-accept">📞</button>' +
        '<button class="call-btn decline" onclick="endCall()">📵</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
}

function acceptCall() {
  var status     = document.getElementById('call-status');
  var waveform   = document.getElementById('call-waveform');
  var transcript = document.getElementById('call-transcript');
  var acceptBtn  = document.getElementById('call-accept');
  if (acceptBtn) acceptBtn.style.display = 'none';

  if (status) status.textContent = 'Connected · Listening...';
  if (waveform) waveform.style.display = 'flex';

  // Simulated IVR voice transcript appears word by word
  var voiceText = '"నా పొలంలో వేరుశెనగ ఆకులు పసుపు పడుతున్నాయి. ఏమి చేయాలో చెప్పండి."\n\n' +
                  '[Transcribed] Leaf yellowing in groundnut crop. Requesting diagnosis and treatment advice.';

  setTimeout(function() {
    if (transcript) {
      transcript.style.display = 'block';
      transcript.innerHTML = '<span style="color:#4ade80;font-size:10px;display:block;margin-bottom:4px">🎙 VOICE TRANSCRIPT</span>';
      var words = voiceText.split(' ');
      var i = 0;
      var interval = setInterval(function() {
        if (i < words.length) {
          transcript.innerHTML += words[i] + ' ';
          i++;
          scrollChatToBottom();
        } else {
          clearInterval(interval);
          // Auto-respond after transcript completes
          setTimeout(function() {
            endCall();
            addMessage('farmer', '📞 [Voice Call] ' + voiceText.split('\n')[0], currentFarmer.name);
            var typing = showTyping();
            setTimeout(function() {
              removeTyping();
              addMessage('bot',
                'నమస్కారం! మీ వేరుశెనగ ఆకుల సమస్య అర్థమైంది.\n\n' +
                '• ఆకు మచ్చ వ్యాధి (Cercospora) అయి ఉండవచ్చు\n' +
                '• Mancozeb 75 WP @ 2g/L పిచికారీ చేయండి\n' +
                '• RSK Chittoor అధికారి మీకు 24 గంటల్లో సంప్రదిస్తారు',
                'KisanAlert 🌿');
            }, 2000);
          }, 1500);
        }
      }, 80);
    }
  }, 1200);
}

function endCall() {
  var overlay = document.getElementById('voice-call-overlay');
  if (overlay) overlay.remove();
}

// ============================================================
//  DISTRICT MAP
// ============================================================
var DISTRICT_PINS = [
  { name: 'Madhubani',  x: 265, y: 115, severity: 'active',  alerts: 3,  crop: 'Wheat' },
  { name: 'Vidisha',   x: 210, y: 195, severity: 'medium',  alerts: 7,  crop: 'Soybean' },
  { name: 'Nashik',    x: 140, y: 240, severity: 'active',  alerts: 4,  crop: 'Grapes' },
  { name: 'Solapur',   x: 155, y: 275, severity: 'medium',  alerts: 5,  crop: 'Jowar' },
  { name: 'Bijapur',   x: 160, y: 315, severity: 'active',  alerts: 2,  crop: 'Maize' },
  { name: 'Warangal',  x: 240, y: 285, severity: 'medium',  alerts: 8,  crop: 'Cotton' },
  { name: 'Nalgonda',  x: 230, y: 305, severity: 'medium',  alerts: 6,  crop: 'Cotton' },
  { name: 'Kurnool',   x: 210, y: 330, severity: 'medium',  alerts: 9,  crop: 'Groundnut' },
  { name: 'Guntur',    x: 245, y: 340, severity: 'medium',  alerts: 11, crop: 'Chilli' },
  { name: 'Chittoor',  x: 225, y: 375, severity: 'high',    alerts: 14, crop: 'Groundnut' }
];

function initDistrictMap() {
  var g = document.getElementById('district-pins');
  var tooltip = document.getElementById('map-tooltip');
  if (!g) return;

  var colors = { high: '#ef4444', medium: '#f59e0b', active: '#4ade80' };

  DISTRICT_PINS.forEach(function(d) {
    var color = colors[d.severity] || '#4ade80';
    var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'district-pin');
    group.setAttribute('transform', 'translate(' + d.x + ',' + d.y + ')');

    // Pulse ring
    var ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('r', '14'); ring.setAttribute('fill', color); ring.setAttribute('opacity', '0.15');

    // Main dot
    var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '7'); dot.setAttribute('fill', color); dot.setAttribute('stroke', '#0a0f0a'); dot.setAttribute('stroke-width', '2');

    // Label
    var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('y', '22'); label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '8'); label.setAttribute('fill', 'rgba(232,245,233,0.7)');
    label.setAttribute('font-family', 'Inter, sans-serif');
    label.textContent = d.name;

    group.appendChild(ring); group.appendChild(dot); group.appendChild(label);

    // Tooltip on hover
    group.addEventListener('mouseenter', function(e) {
      if (!tooltip) return;
      var sevLabel = d.severity === 'high' ? '🔴 HIGH' : d.severity === 'medium' ? '🟡 MEDIUM' : '🟢 ACTIVE';
      tooltip.innerHTML =
        '<strong style="color:#4ade80">' + d.name + '</strong><br>' +
        'Main Crop: ' + d.crop + '<br>' +
        'Alerts Today: <strong>' + d.alerts + '</strong><br>' +
        'Status: ' + sevLabel;
      tooltip.style.display = 'block';
      tooltip.style.left = (d.x + 20) + 'px';
      tooltip.style.top  = (d.y - 10) + 'px';
    });
    group.addEventListener('mouseleave', function() {
      if (tooltip) tooltip.style.display = 'none';
    });

    g.appendChild(group);
  });
}

// ============================================================
//  TABLE FILTERS
// ============================================================
var _allNormalizedCases = [];

// Override loadAndRender to also store for filtering
var _origLoadAndRender = loadAndRender;
function loadAndRender(rawList) {
  _casesCache = {};
  var normalized = rawList.map(function(raw, idx) {
    if (!raw.case_id && !raw.id) raw._idx = idx;
    var n = normalizeCase(raw, idx);
    _casesCache[n.id] = n;
    return n;
  });
  _allNormalizedCases = normalized;
  renderFlaggedCases(normalized);
}

function applyTableFilter() {
  var dist = (document.getElementById('filter-district')  || {}).value || '';
  var sev  = (document.getElementById('filter-severity')  || {}).value || '';
  var stat = (document.getElementById('filter-status')    || {}).value || '';

  var filtered = _allNormalizedCases.filter(function(c) {
    if (dist && c.district !== dist) return false;
    if (sev  && c.severity !== sev)  return false;
    if (stat && c.status.replace(' ','_') !== stat) return false;
    return true;
  });
  renderFlaggedCases(filtered);
}

var _allFarmers = [];
function applyFarmerFilter() {
  var dist = (document.getElementById('filter-farmer-district') || {}).value || '';
  var lang = (document.getElementById('filter-farmer-lang')     || {}).value || '';
  var filtered = _allFarmers.filter(function(f) {
    if (dist && f.district !== dist) return false;
    if (lang && f.lang !== lang)     return false;
    return true;
  });
  renderFarmers(filtered);
}
