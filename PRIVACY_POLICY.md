# Privacy Policy for D-Campus - Modern ERP Suite

**Version:** 1.4.0  
**Effective Date:** September 16, 2026  

D-Campus ("the Extension") is an open-source, student-focused browser extension developed to augment and modernize the user interface of the official COER University ERP portal (`https://erp.coeruniversity.in/`). 

Your privacy is paramount. This Privacy Policy details how the Extension handles information, our strict on-device data isolation, and why we do not collect, transmit, or monetize any user data.

---

## 1. Single Purpose & Architecture
The sole purpose of D-Campus is to enhance accessibility, navigation, and usability on the COER University ERP student portal. It introduces a high-contrast retro-dark dashboard, dynamic timetable schedule tracking, priority assignment management, irreversible submission safety verification, and attendance shortfall/bunk calculations.

All features operate **100% client-side** directly inside the user's browser sandbox.

---

## 2. Information Handled & Scope

### A. Academic Records (Read-Only via Session)
When active on the ERP portal, the Extension processes academic information already available to your authenticated session:
- **Student Profile:** Student Name, Student ID (e.g., `CU24025XXXX`), Registration ID (RegID), Program, Course, Branch, Year, and Section.
- **Attendance Metrics:** Cumulative and subject-wise attendance percentages, total lectures delivered, and total lectures attended.
- **Assignments & Course Notes:** Assignment titles, deadlines, submission status, grades, faculty names, and lecture material links.
- **Class Schedule:** Weekly periods (P1–P7) and faculty details for Monday through Friday.

### B. User Interface Preferences
- Selected elective tracks (e.g., GATE, CAT, Study Abroad, Competitive Coding).
- Active filter views (e.g., Active Due, All Records, Submission Closed).
- Window state preferences (minimized HUD vs. full dashboard view).

### C. What We NEVER Handle
- **No Credentials:** The Extension **never** stores, reads, or records your portal password. Passwords remain exclusively within your browser's native autofill or manual input.
- **No Financial Data:** The Extension does not touch or process payment gateways or fee transaction details.
- **No Analytics / Identifiers:** The Extension contains **zero** trackers, telemetry, advertising SDKs, or unique device fingerprints.

---

## 3. Storage & On-Device Security

- **Strictly Local Sandbox:** All fetched student profile and timetable records are cached exclusively inside Chrome's sandboxed `chrome.storage.local` on your local machine.
- **No Cloud Transmission:** No data is ever transmitted to, backed up on, or processed by external cloud servers, databases, or third-party APIs.
- **Automatic Account Purge:** If a different student logs into the portal on the same computer, the Extension automatically detects the account transition and immediately purges all previously cached profile and attendance data.

---

## 4. Network Communications & Data Flow

- **Direct University Communication:** All network requests travel directly and securely over HTTPS between your browser and official COER ERP servers (`https://erp.coeruniversity.in/*`).
- **No Intermediary Proxies:** There are no proxy servers, relay nodes, or external endpoints involved.
- **24/7 Session Keep-Alive Heartbeat:** The optional session heartbeat pings the official endpoint `POST /Account/GetStudentDetail` every 5 minutes using your existing session cookie to prevent IIS idle session expiration. This request contains no tracking payload and runs entirely between your browser and the ERP server.
- **Client-Side Calendar Generation:** Google Calendar / iCal (`.ics`) files are generated entirely in browser memory using standard RFC 5545 specifications. No schedule information is transmitted over the network during calendar generation.

---

## 5. Chrome Permissions Justification

| Permission | Purpose & Scope |
| :--- | :--- |
| `storage` | Required to cache timetable, attendance, and assignment records locally on device for sub-50ms loading and offline availability. |
| `alarms` | Required to schedule the periodic 15-minute background academic sync and 5-minute session keep-alive heartbeat. |
| `tabs` | Required to detect open COER ERP tabs and focus or navigate to them when clicking the extension toolbar icon. |
| `host_permissions` (`https://erp.coeruniversity.in/*`) | Required to read and display academic data using your active authenticated ERP session cookies. |

---

## 6. User Control & Data Deletion

You have complete control over your data:
1. **Instant Sync:** Clicking the "Sync" button flushes local caches and fetches fresh records directly from the ERP.
2. **Account Switching:** Logging in as another student immediately wipes stored local data.
3. **Complete Removal:** Uninstalling the Extension from `chrome://extensions` permanently deletes all associated local storage and cached records from your device.

---

## 7. Open-Source Transparency & Contact

D-Campus is open-source under the MIT License. You can review the complete source code, audit all network calls, and verify our privacy guarantees on GitHub:

- **Author:** Pranav Pandey (AkaPranav)
- **Developer Email:** `heypranavpandey@gmail.com`
- **Source Repository:** `https://github.com/AkaPranav/D-Campus`
- **Issue Tracker:** `https://github.com/AkaPranav/D-Campus/issues`
