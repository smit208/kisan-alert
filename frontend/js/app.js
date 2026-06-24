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
  { name: 'Ramaiah', district: 'Chittoor', lang: 'తెలుగు', avatar: '👨‍🌾' },
  { name: 'Suresh Kumar', district: 'Warangal', lang: 'हिंदी', avatar: '🧑‍🌾' },
  { name: 'Basavaraj', district: 'Bijapur', lang: 'ಕನ್ನಡ', avatar: '👴' },
  { name: 'Mangesh Patil', district: 'Nashik', lang: 'मराठी', avatar: '👨' },
  { name: 'David Thomas', district: 'Kurnool', lang: 'English', avatar: '🧔' },
  { name: 'Laxmi Devi', district: 'Nalgonda', lang: 'తెలుగు', avatar: '👩‍🌾' },
  { name: 'Rajendra Yadav', district: 'Madhubani', lang: 'हिंदी', avatar: '🧑' },
  { name: 'Kavitha S', district: 'Guntur', lang: 'తెలుగు', avatar: '👩' }
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
  diagnose: `🔬 **Gemini Vision Analysis Complete**\n\nCrop: Groundnut\nDisease Detected: **Leaf Spot (Cercospora arachidicola)**\nConfidence: 91%\nSeverity: MEDIUM-HIGH\n\n💊 **Treatment Protocol:**\n• Mancozeb 75 WP @ 2g/L — spray immediately\n• Remove infected leaves\n• Avoid overhead irrigation\n\n🚩 Case flagged to RSK center for field visit.`
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
  // Bold **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Bullet points
  text = text.replace(/^• (.+)/gm, '<span style="display:flex;gap:6px;align-items:flex-start;margin:2px 0"><span style="color:#4ade80;font-size:14px;line-height:1.4">•</span><span>$1</span></span>');
  // Line breaks
  text = text.replace(/\n/g, '<br/>');
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

  // Turn 1: Telugu message about yellowing leaves
  addMessage('farmer', 'నా పత్తి ఆకులు పసుపు రంగుకు మారుతున్నాయి 😟', 'Ramaiah (+91 94408 12345)');

  setTimeout(function() {
    addMessage('bot', MOCK_CHAT_RESPONSES.default_te, 'KisanAlert 🌿');
  }, 600);

  // Turn 2: Hindi crop advice question
  setTimeout(function() {
    addMessage('farmer', 'इस बार कौन सी फसल लगाऊं? मेरे पास 3 एकड़ है', 'Suresh (+91 98440 67890)');
  }, 1200);

  setTimeout(function() {
    addMessage('bot', MOCK_CHAT_RESPONSES.default_hi, 'KisanAlert 🌿');
  }, 2000);

  // Turn 3: Disease diagnosis result
  setTimeout(function() {
    addMessage('farmer', '🖼️ [Image Uploaded: groundnut_leaf.jpg]', 'David Thomas (+91 99400 11223)');
  }, 2800);

  setTimeout(function() {
    addMessage('bot', MOCK_CHAT_RESPONSES.diagnose, 'KisanAlert 🌿');
  }, 3600);
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

// ---- Flagged Cases Table ----
function renderFlaggedCases(cases) {
  var tbody = document.getElementById('flagged-tbody');
  tbody.innerHTML = '';

  cases.forEach(function(c, idx) {
    var tr = document.createElement('tr');
    tr.style.animationDelay = (idx * 0.05) + 's';

    var severityBadge = '<span class="badge ' + c.severity + '">' +
      '<span class="badge-dot"></span>' +
      c.severity.toUpperCase() + '</span>';

    var statusMap = { pending: 'pending', contacted: 'contacted', resolved: 'resolved' };
    var statusPill = '<span class="status-pill ' + (statusMap[c.status] || 'pending') + '">' + c.status + '</span>';

    var cropCell = '<div class="crop-thumb">' + c.cropEmoji + '</div>';

    tr.innerHTML = '<td>' + c.id + '</td>' +
      '<td>' + c.district + '</td>' +
      '<td>' + cropCell + '</td>' +
      '<td>' + c.diagnosis + '</td>' +
      '<td>' + severityBadge + '</td>' +
      '<td>' + c.rsk + '</td>' +
      '<td>' + statusPill + '</td>' +
      '<td><button class="action-btn" onclick="openCase(\'' + c.id + '\')">View →</button></td>';

    tbody.appendChild(tr);
  });
}

async function loadFlaggedCases() {
  var data = await apiGet('/api/cases/flagged');
  var cases = (data && data.cases) ? data.cases : MOCK_FLAGGED_CASES;
  renderFlaggedCases(cases);
}

function openCase(id) {
  // TODO: open a detailed case modal — for now just alert
  alert('Case ' + id + ' — Field visit being coordinated with RSK center.\n\n(In production: opens a detailed case management view)');
}

// ---- Recommendations Tab ----
function renderRecommendations(recs) {
  var grid = document.getElementById('rec-grid');
  grid.innerHTML = '';

  recs.forEach(function(rec, idx) {
    var card = document.createElement('div');
    card.className = 'rec-card';
    card.style.animationDelay = (idx * 0.07) + 's';

    var cropsHtml = rec.crops.map(function(c) {
      return '<div class="rec-crop-row">' +
        '<span class="rec-crop-name">' + c.name + '</span>' +
        '<div class="rec-score-bar"><div class="rec-score-fill" style="width:' + c.score + '%"></div></div>' +
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
function renderFarmers(farmers) {
  var grid = document.getElementById('farmers-grid');
  grid.innerHTML = '';

  farmers.forEach(function(f, idx) {
    var card = document.createElement('div');
    card.className = 'farmer-card';
    card.style.animationDelay = (idx * 0.05) + 's';

    card.innerHTML = '<div class="farmer-card-avatar">' + f.avatar + '</div>' +
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

function startLiveTicker() {
  var tickerText = document.getElementById('ticker-text');
  tickerCountdown = 30;

  tickerInterval = setInterval(function() {
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

  // Simulate network fetch then update
  setTimeout(function() {
    // Bump alerts sent counter slightly
    var alertsEl = document.getElementById('stat-val-alerts');
    if (alertsEl) {
      var cur = parseInt(alertsEl.textContent.replace(/,/g, ''), 10) || 0;
      animateCounter(alertsEl, cur + Math.floor(Math.random() * 4 + 1));
    }

    // Maybe flag a new case
    if (Math.random() > 0.6) {
      var flaggedEl = document.getElementById('stat-val-flagged');
      if (flaggedEl) {
        var fcur = parseInt(flaggedEl.textContent.replace(/,/g, ''), 10) || 0;
        animateCounter(flaggedEl, fcur + 1);
      }
    }

    if (tickerText) tickerText.textContent = '✅ Updated — Next refresh in 30s';
    setTimeout(function() {
      if (tickerText) tickerText.textContent = 'Live monitoring active — Next update in 30s';
    }, 2000);
  }, 1200);
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
  });

  distSel.addEventListener('change', function() {
    currentDistrict = distSel.value;
    // update weather alert mock text
    MOCK_CHAT_RESPONSES.weather_alert = MOCK_CHAT_RESPONSES.weather_alert.replace(/District:.*?\n/, 'District: ' + currentDistrict + '\n');
  });
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

  // Admin panel setup
  initStatCounters();
  initTabs();
  initRefreshBtn();

  // Populate admin tabs with mock data
  renderFlaggedCases(MOCK_FLAGGED_CASES);
  renderRecommendations(MOCK_RECOMMENDATIONS);
  renderAlerts(MOCK_ALERTS);
  renderFarmers(MOCK_FARMERS);

  // Load demo conversation in chat (slight delay for polish)
  setTimeout(loadDemoConversation, 350);

  // Start the live update ticker
  startLiveTicker();

  // Also try to pull real flagged cases from backend (silently falls back)
  setTimeout(function() {
    apiGet('/api/cases/flagged').then(function(data) {
      if (data && data.cases) {
        renderFlaggedCases(data.cases);
      }
    });
    apiGet('/api/messages').then(function(data) {
      if (data && data.alerts) {
        renderAlerts(data.alerts);
      }
    });
  }, 2000);
});
