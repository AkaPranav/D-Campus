# ⚡ COER Retro OS — Modern ERP Suite

[![Manifest V3](https://img.shields.io/badge/Chrome_Extension-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/)
[![Version](https://img.shields.io/badge/Version-v1.2.0-06b6d4?style=for-the-badge)](#)
[![Technical Analysis](https://img.shields.io/badge/ERP_Impact-Engineering_Report-10b981?style=for-the-badge)](./ANALYSIS.md)
[![Design System](https://img.shields.io/badge/Theme-Retro_Dark_Neo--Brutalist-a855f7?style=for-the-badge)](#-design-system)
[![Privacy Policy](https://img.shields.io/badge/Privacy_Policy-100%25_On--Device-10b981?style=for-the-badge)](./PRIVACY_POLICY.md)
[![License](https://img.shields.io/badge/License-MIT-f59e0b?style=for-the-badge)](LICENSE)

> A cyberpunk retro-dark augmentation suite for the **COER University ERP Student Portal**, transforming clunky legacy tables into a high-contrast, tactical dashboard with real-time academic synchronization, priority assignment queues, and single-click workflows.

> [!TIP]
> **Technical Deep Dive:** Read our full engineering report on server bottlenecks, payload measurements, and balanced trade-offs:  
> 👉 **[Technical & Quantitative ERP Impact Analysis (`ANALYSIS.md`)](./ANALYSIS.md)**

---

## 📸 Showcase & Visual Tour

### 1. Active Priority Assignments Queue
*Active assignments sorted with urgency priority (nearest due date first), overdue upload protections, subject filter chips, and instant Base64 spec downloads.*
![Active Assignments Queue](assets/screenshots/02_active_assignments.png)

---

### 2. Lecture Notes & Study Material Center
*Curated repository of 37+ faculty lecture notes, topic keywords, and direct download links — with clutter and deadline badges cleanly removed.*
![Study Materials & Notes](assets/screenshots/03_study_materials.png)

---

### 3. Real-Time Attendance Gauge & Threshold Monitor
*Instant retro KPI radial gauge showing overall attendance percentage, safe (≥75%) vs. critical status, and the exact count of classes needed to reach eligibility.*
![Attendance Gauge](assets/screenshots/01_attendance_gauge.png)

---

### 4. Dynamic Monday–Friday Timetable Schedule
*Interactive weekly class schedule featuring real-time period status indicators (`COMPLETED`, `NOW RUNNING`, `UPCOMING`), next lecture ticker, and an in-card elective track switcher (GATE, CAT, Study Abroad, Competitive Coding).*
![Timetable Schedule](assets/screenshots/04_timetable_electives.png)

---

### 5. Irreversible Single-Submission Safety Shield
*Pre-flight verification modal with hazard stripes, assignment metadata review, file format validator (.pdf/.doc/.docx <5MB), and a mandatory confirmation lock to protect against irreversible portal uploads.*
![Submission Safety Shield](assets/screenshots/05_submission_safety_shield.png)

---

### 6. Google Calendar / iCal (.ics) Timetable Sync
*One-click schedule exporter generating RFC 5545 compliant `.ics` calendar files with automatic 10-minute class alerts, embedded `Asia/Kolkata` timezone specifications, and 2-click synchronization with Google Calendar, Apple Calendar, and Outlook.*
![Google Calendar Timetable Sync](assets/screenshots/06_calendar_sync_modal.png)

---

### 7. 24/7 Session Keep-Alive Heartbeat & HUD
*Continuous background sliding-window heartbeat preventing untimely ERP logouts and eliminating annoying CAPTCHA prompts throughout the day, complete with real-time pulse feedback in both Popup and In-Page Overlay.*
![Session Keep-Alive Heartbeat](assets/screenshots/07_session_keepalive.png)

---

## 🌟 Core Capabilities

### 📊 1. Attendance Intelligence Module
- **Retro Radial KPI Gauge:** Live overall attendance calculation with visual color-coded thresholds (`≥75%` safe emerald vs. `<75%` danger rose).
- **Shortfall & Bunking Math Engine:** Automatically calculates consecutive classes required to reach 75% (`3T - 4P`) when in deficit, or exact safe bunk allowance (`floor((4P - 3T) / 3)`) when on track (≥75%) before falling below the exam eligibility threshold.
- **Subject-by-Subject Breakdown:** Searchable table with lecture deliveries, presences, percentages, and faculty details.

### 📁 2. Priority Assignment & Notes Hub
- **Urgency Sort Queue:** Automatically promotes active pending assignments due soonest to the top with warning badges (`⚡ DUE: <Date>`).
- **Overdue Guard:** Disables upload actions for closed assignments (`🔒 SUBMISSION CLOSED`) to prevent futile network requests.
- **Lecture Notes View:** Clean catalog of faculty course materials with `POSTED ON` dates and topic keywords.
- **Direct Spec Downloader:** Bypasses expired frontend checks to download assignment sheets directly via Base64 stream decoding.

### 📅 3. Dynamic Mon–Fri Timetable & Elective Selector
- **Scope-Aligned Calendar:** Scoped specifically to Monday–Friday following COER University's academic week.
- **Dynamic Multi-Elective Dropdown:** Parses merged multi-track elective periods and provides an in-card switcher (GATE, CAT, Study Abroad, Competitive Coding, Project V, Internship) with persistent local memory.
- **Dynamic "Now & Next" Ticker:** Continuously tracks the currently running period and predicts the next upcoming class today or next weekday morning.

### ⚡ 4. 1-Click Feedback Gate Auto-Rater
- **Compulsory Feedback Bypass:** Injects a tactile floating control bar onto the ERP's compulsory feedback lockout gate (`/Web_StudentAcademic/Cyborg_StudentAttendanceAcademic`).
- **Batch Faculty Rating:** 1-click batch rating (`★ All Xlnt`, `All Good`, `All Avg`, `All Poor`) across all 14 faculty subgrids simultaneously to unlock attendance data in under 2 seconds.

### 🔒 5. Zero-Config Multi-User Authentication
- **Session-Based Profile Resolution:** Automatically resolves student identity (`RegID`, `StudentID`, `StudentName`, `Branch`, `Year`) via session cookies without hardcoded IDs.
- **Account Switch Detection:** Automatically flushes stale caches and re-synchronizes when a different student logs in on the same workstation.
- **CAPTCHA Helper:** Detects autofilled credentials on the login page and automatically autofocuses the cursor onto the CAPTCHA entry box.

### 📅 6. Google Calendar / iCal (.ics) Timetable Sync
- **RFC 5545 iCalendar Engine:** Standalone client-side generator (`utils/calendar.js`) producing standard `.ics` calendar files with embedded `Asia/Kolkata` timezone specifications.
- **Automated 10-Minute Phone Alerts:** Every lecture includes `VALARM` triggers (`TRIGGER:-PT10M`) ensuring Google Calendar pushes automatic notifications to the student's mobile phone and university email before every class starts.
- **Semester Recurrence Rules:** Generates recurring weekly events (`RRULE:FREQ=WEEKLY;BYDAY=...`) automatically bounded by the academic semester end date.
- **1-Click Google Calendar Import:** Direct link to Google Calendar's import interface for 2-click desktop or mobile synchronization.

### 💓 7. 24/7 Session Keep-Alive Heartbeat (Anti-Logout Shield)
- **Sliding-Window Timeout Shield:** Reverse-engineers Microsoft IIS / ASP.NET MVC's sliding session expiration by automatically pinging `/Account/GetStudentDetail` every 5 minutes in the background, continuously resetting the 20-minute server timer.
- **Zero-CAPTCHA Workflow:** Keeps student sessions alive indefinitely across browser usage so they never get abruptly kicked out to the login page or forced to solve CAPTCHAs during study sessions.
- **Persistent MV3 Alarms:** Leverages `chrome.alarms` and `chrome.runtime.onStartup` to guarantee alarm health across browser reboots without battery or memory drain.
- **Live Pulse Feedback:** Features a visual retro heartbeat indicator (`💓 SESSION: ALIVE (5m) • Pulse #X`) on both Popup HUD and In-Page Overlay, with tactile click-to-pulse testing.
- **Assisted Login Autofocus:** Automatically detects browser-autofilled credentials on the login screen and shifts cursor focus instantly to the CAPTCHA entry box for frictionless 3-second logins.

---

## 📊 Quantitative ERP Impact & Performance

For an in-depth, mathematically grounded analysis of how this extension reduces server bandwidth by **98.5%**, eliminates routine timetable requests for 1,000+ students, and compares legacy ERP bottlenecks against local caching:

👉 **[Read the Full Technical & Quantitative Impact Analysis (`ANALYSIS.md`)](./ANALYSIS.md)**

| Dimension | Legacy ERP Workflow | COER Retro OS Suite | Measured Gain |
| :--- | :--- | :--- | :--- |
| **Payload Per Session** | ~2.4 MB (HTML + scripts + CSS) | ~36.6 KB JSON / **0 KB** (Cache) | **~98.5% Bandwidth Reduction** |
| **Schedule Lookups** | 20,000 weekly hits / 1,000 students | **0 requests** (Migrated to G-Cal) | **99.96% Server Offloading** |
| **Feedback Gate Delay** | 2.5 to 4 minutes active HTTP hold | **~450ms** single batch POST | **>80% Faster Connection Release** |
| **Query Latency** | 2,500ms – 8,000ms server roundtrips | **<50ms** local storage read | **Instantaneous UI Rendering** |

---

## 🛠️ Architecture & Tech Stack

```
extension/
├── manifest.json              # Chrome Manifest V3 configuration & scoped permissions
├── icons/                     # Neo-brutalist pixelated icons (16px, 48px, 128px)
├── utils/
│   └── calendar.js            # RFC 5545 iCalendar (.ics) generator engine & scheduler
├── background/
│   └── service-worker.js      # Background sync engine, alarms, cookie-authenticated fetchers
├── content/
│   ├── content.js             # Isolated Shadow DOM UI injection, event handlers, modals
│   └── overlay.css            # Scoped retro-dark design system (zero leakage into ERP styles)
└── popup/
    ├── popup.html             # Compact toolbar HUD popup
    ├── popup.css              # HUD visual styling
    └── popup.js               # Toolbar live stats & quick sync dispatcher
```

* **Chrome Manifest V3:** Built entirely on modern V3 specifications with service worker lifecycle management and `chrome.storage.local`.
* **Zero-Leakage Shadow DOM:** The entire dashboard UI and retro style system are encapsulated inside an isolated Shadow Root (`#coer-retro-os-host`), ensuring zero styling conflicts with COER's native Bootstrap 3 portal.
* **Local-First & Offline Ready:** All academic records are cached locally on device for instant rendering without lag.

---

## 🎨 Design System

COER Retro OS adheres to a cohesive **Retro-Dark Neo-Brutalist** visual standard:

| Token | Hex Value | Role |
| :--- | :--- | :--- |
| `--bg-base` | `#0b0f19` | Deep space console background |
| `--bg-surface` | `#111827` | Panel card surface |
| `--accent-gold` | `#f59e0b` | Industrial amber: primary buttons, active alerts |
| `--accent-cyan` | `#06b6d4` | CRT Cyan: downloads, timetable cards |
| `--accent-emerald` | `#10b981` | Phosphor Green: safe attendance, success states |
| `--accent-rose` | `#f43f5e` | Hazard Red: critical attendance, closed submissions |
| `--accent-purple` | `#a855f7` | Synthwave Violet: study material tags |
| `--border-base` | `#374151` | Hard 1.5px structural borders |

*Design specifications feature 3px tactile retro button offsets, CRT amber highlights, and monospace data scales.*

---

## 📥 Installation

### Method A: Load Unpacked (Developer Mode)
1. Clone this repository:
   ```bash
   git clone https://github.com/akapandey/coer.git
   cd coer
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click **Load unpacked** and select the [`extension/`](./extension) folder.
5. Navigate to `https://erp.coeruniversity.in/` and log in. The **⚡ COER OS** HUD launcher will appear automatically!

---

## 🔒 Privacy & Security

* **100% On-Device:** Zero data is sold, tracked, or transmitted to third-party servers.
* **Direct Communication:** All network requests travel directly between your local browser and `https://erp.coeruniversity.in/*`.
* **Zero Analytics:** Contains no Google Analytics, trackers, or advertising libraries.
* **Ephemeral Sessions:** Logging in as a different student immediately purges local caches and syncs the new account.

👉 **Read our comprehensive [Privacy Policy (`PRIVACY_POLICY.md`)](./PRIVACY_POLICY.md)** for detailed data handling disclosures and single-purpose specifications.

---

## 📜 License & Disclaimer
 
*Disclaimer: COER Retro OS is an independent student project developed to augment usability. It is not officially affiliated with or endorsed by COER University.*

