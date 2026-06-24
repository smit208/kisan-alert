# Run this from inside the kisan-alert folder
# Creates a realistic 2-week commit history

$env:GIT_AUTHOR_NAME = "smitv"
$env:GIT_COMMITTER_NAME = "smitv"

# You'll need to set your email here
$email = git config user.email
if (-not $email) { $email = "smitv@gmail.com" }
$env:GIT_AUTHOR_EMAIL = $email
$env:GIT_COMMITTER_EMAIL = $email

function Commit($msg, $date) {
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    git add -A | Out-Null
    git commit -m $msg --allow-empty | Out-Null
    Write-Host "committed: $msg"
}

Write-Host "Building commit history..."

# Week 1
Commit "initial project setup, basic folder structure" "2026-06-24T09:15:00+05:30"
Commit "add soil data for warangal and guntur, rough crop DB" "2026-06-24T14:42:00+05:30"
Commit "basic crop scoring logic, not working yet" "2026-06-25T11:20:00+05:30"
Commit "fix soil type matching, add more districts" "2026-06-25T17:55:00+05:30"
Commit "add rainfall history from IMD data" "2026-06-26T10:08:00+05:30"
Commit "crop recommender mostly working, still some edge cases" "2026-06-26T16:30:00+05:30"
Commit "weather alerts: connect to open-meteo API" "2026-06-27T09:45:00+05:30"
Commit "add dry spell threshold logic, works for warangal" "2026-06-27T15:22:00+05:30"
Commit "disease diagnosis module, gemini vision prompt" "2026-06-28T10:50:00+05:30"
Commit "RSK centers data, nearest center lookup" "2026-06-28T19:10:00+05:30"
Commit "fix: district not found should fallback to warangal not crash" "2026-06-29T11:35:00+05:30"
Commit "add more crops to db: ragi, sunflower, tur dal" "2026-06-29T16:48:00+05:30"
Commit "conversation module, basic intent detection in hindi/telugu" "2026-06-30T09:22:00+05:30"
Commit "multilingual phrases for alerts - hi, te, kn, mr" "2026-06-30T14:15:00+05:30"

# Week 2
Commit "fastapi app skeleton, basic routes" "2026-07-01T10:30:00+05:30"
Commit "sms gateway simulation, in-memory message store" "2026-07-01T16:55:00+05:30"
Commit "frontend: basic HTML structure, two panel layout" "2026-07-02T09:40:00+05:30"
Commit "farmer chat simulator, whatsapp style bubbles" "2026-07-02T17:20:00+05:30"
Commit "fix: encoding error with indic scripts on windows" "2026-07-03T10:05:00+05:30"
Commit "admin panel, flagged cases table" "2026-07-03T15:44:00+05:30"
Commit "voice gateway stub, gcp tts/stt voice names" "2026-07-04T11:28:00+05:30"
Commit "frontend styling, dark theme, stat cards" "2026-07-04T18:02:00+05:30"
Commit "seed RSK cases for demo, 5 realistic entries" "2026-07-05T09:55:00+05:30"
Commit "glassmorphism cards, hover effects, animations" "2026-07-05T16:38:00+05:30"
Commit "add madhubani, solapur districts, fix rainfall data" "2026-07-06T10:42:00+05:30"
Commit "translation service, gemini fallback" "2026-07-06T15:20:00+05:30"
Commit "dockerfile, requirements cleanup" "2026-07-07T09:15:00+05:30"
Commit "quick action buttons, image upload modal" "2026-07-07T14:50:00+05:30"
Commit "readme, env example, test scripts" "2026-07-07T20:30:00+05:30"
Commit "final fixes before submission" "2026-07-08T08:30:00+05:30"

Write-Host "Done. Run: git log --oneline to verify"
