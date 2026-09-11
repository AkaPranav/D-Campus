# Chrome Web Store Listing & Metadata: COER Retro OS

**Extension Name:** COER Retro OS - Modern ERP Suite  
**Version:** 1.2.0  
**Target Browser:** Google Chrome (Manifest V3)  
**Last Updated:** September 11, 2026  

---

## 1. Store Metadata

### Short Description (Max 132 chars)
Unified retro-dark dashboard syncing Attendance, Priority Assignments, Timetable, G-Cal export, and 24/7 keep-alive heartbeat.

### Detailed Description
Transform your COER University ERP student portal experience with **COER Retro OS** — a high-contrast, cyberpunk retro-dark augmentation suite designed to eliminate clunky navigation, bypass repetitive forms, and keep your academic life in sync.

#### 🌟 Key Modules & Capabilities:
1. **Real-time Attendance Dashboard:**
   - Instant KPI radial gauge displaying overall attendance percentage with safe (≥75%) and danger (<75%) threshold alerts.
   - Exact lecture metrics: Total Delivered, Attended, Absent, classes needed to reach 75% (`3T - 4P`), or safe bunk allowance (`floor((4P - 3T) / 3)`).
   - Comprehensive subject-wise breakdown with fractional attendance counts and instant search filters.

2. **Priority Assignment & Study Material Hub:**
   - Priority queue sorting active pending assignments by nearest submission deadline first.
   - Status filter toggle (`⚡ Active Due`, `📂 All Records`, `🔒 Submission Closed`) and per-subject count chips.
   - Direct one-click Base64 file downloader bypassing expired frontend download restrictions.
   - Dedicated Study Material tab with 37+ faculty lecture notes, topic tags, and clickable video reference links (with deadline badges cleanly removed).
   - **Irreversible Single-Submission Safety Shield:** Pre-flight modal with checklist, file format validation (.pdf, .doc, .docx <5MB), and a mandatory confirmation checkbox protecting you against accidental, irreversible portal submissions.

3. **Dynamic Mon–Fri Timetable Schedule:**
   - Real-time period status detection marking classes as `COMPLETED`, `NOW RUNNING`, or `UPCOMING`.
   - Top ticker (`NEXT CLASS: ...`) dynamically tracking the next upcoming lecture today or next weekday morning.
   - **Dynamic Multi-Elective Track Selector:** Injects an interactive in-card selector on periods with parallel tracks (e.g. GATE, CAT, Study Abroad, Competitive Coding, Project V, Internship), allowing students to switch tracks on the fly with persistent preference storage.
   - Clean schedule view showing subject names and faculty assignments tailored to COER's Monday to Friday academic calendar.

4. **1-Click Attendance Feedback Gate Auto-Rater:**
   - Injects a tactile control bar directly onto compulsory feedback lockout pages.
   - Batch-rate all 14 faculty rows in a single click (All Xlnt, All Good, All Avg, All Poor) and submit immediately to unlock your attendance summary.

5. **Google Calendar / iCal (.ics) Timetable Sync:**
   - One-click exporter producing RFC 5545 standard `.ics` calendar files with embedded `Asia/Kolkata` timezone and automated 10-minute phone/email alerts before each lecture.
   - Directly imports into Google Calendar, Apple Calendar, and Microsoft Outlook.

6. **24/7 Session Keep-Alive Heartbeat:**
   - Background sliding-window heartbeat pinging the server every 5 minutes, preventing unwanted portal timeouts and eliminating repetitive CAPTCHA prompts throughout the study day.
   - Live pulse feedback badge in Popup HUD and In-Page Overlay with tactile click-to-pulse verification.

---

## 2. Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `storage` | Required to cache normalized attendance, assignments, and timetable data locally on device for instant offline availability and faster dashboard rendering. |
| `alarms` | Required to schedule periodic 15-minute background sync jobs and the 5-minute session keep-alive heartbeat. |
| `tabs` | Required to switch focus to existing COER ERP tabs or open the portal directly from the toolbar popup action button. |
| `host_permissions` (`https://erp.coeruniversity.in/*`) | Required to make authenticated API requests to COER ERP endpoints (`GetSubjectDetailStudentAcademicFromLive`, `GetStudentAssignment`, `FillStudentTimeTable`, `GetAssignmentImage`, `UploadStudentAssignment`, `GetStudentDetail`) using native session cookies. |

---

## 3. Privacy & Data Use Disclosures

- **Data Collection:** Zero personal data is sold, collected, or transferred to third-party servers. All ERP communications take place strictly between the student's browser and `https://erp.coeruniversity.in/`.
- **Local Storage:** Academic data (grades, attendance %, timetable) is stored exclusively within Chrome's sandboxed `chrome.storage.local` on the user's computer.
- **Single-Purpose Compliance:** The extension exclusively augments and modernizes the COER University ERP student experience.
- **Privacy Policy:** See [`PRIVACY_POLICY.md`](./PRIVACY_POLICY.md).

---

## 4. Submission Package & Assets

- **ZIP Package:** `dist/coer-retro-os-webstore-v1.2.0.zip` (48 KB, `manifest.json` at archive root).
- **Store Icon:** `extension/icons/icon-128.png` (128×128 PNG).
- **Screenshots (1280×800):**
  - `assets/screenshots/01_attendance_gauge.png`
  - `assets/screenshots/02_active_assignments.png`
  - `assets/screenshots/03_study_materials.png`
  - `assets/screenshots/04_timetable_electives.png`
  - `assets/screenshots/05_submission_safety_shield.png`
  - `assets/screenshots/06_calendar_sync_modal.png`
  - `assets/screenshots/07_session_keepalive.png`

---

## 5. Version History

- **v1.2.0 (2026-09-11):** 24/7 Session Keep-Alive Heartbeat engine preventing IIS session timeouts, live heartbeat pulse indicator, Google Calendar (.ics) export modal with 10-minute alerts, dynamic safe bunk allowance calculator for attendance ≥ 75%, and login page autofocus helper.
- **v1.1.0 (2026-09-11):** Mon–Fri timetable refinement, in-card multi-track elective selector with auto-matching, room inference removal, and active assignments priority sorting.
- **v1.0.0 (2026-09-10):** Initial Manifest V3 release. Modular architecture featuring Shadow DOM overlay, retro-dark neo-brutalist styling, 3-module dashboard (Attendance, Assignments, Timetable), dynamic multi-elective selector, safety submission shield, and popup toolbar preview.
