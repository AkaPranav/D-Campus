# Privacy Policy for COER Retro OS - Modern ERP Suite

**Last Updated:** September 10, 2026

COER Retro OS ("the Extension") is committed to protecting the privacy of its users. This Privacy Policy describes how the Extension handles information when you use it with the COER University ERP portal (`https://erp.coeruniversity.in/`).

---

## 1. Single Purpose & Scope
The sole purpose of COER Retro OS is to augment and modernize the user interface and student experience on the official COER University ERP portal. It provides an accessible retro-dark dashboard, real-time timetable tracking, priority assignment management, and attendance threshold calculations.

---

## 2. Information We Handle

### A. Academic & Profile Information
When you access the ERP portal, the Extension reads academic information already accessible in your logged-in session:
- **Student Profile:** Student Name, Student ID (e.g. `CU240250963`), Registration ID (RegID), Course, Branch, Year, and Section.
- **Academic Metrics:** Subject-wise and cumulative attendance percentages, total lectures delivered, and total lectures attended.
- **Assignments & Study Materials:** Assignment titles, deadlines, submission status, grades, faculty names, and lecture notes.
- **Timetable Data:** Weekly class schedules and course periods (P1–P7).

### B. User Preferences
- Selected elective tracks (e.g. GATE, CAT, Study Abroad, Competitive Coding).
- Active filter views (e.g., Active Due, All Records, Submission Closed).

---

## 3. How Information is Stored
- **100% On-Device Storage:** All fetched profile, attendance, assignment, and schedule data is cached strictly locally in the browser sandbox using Chrome's native `chrome.storage.local` API.
- **No Third-Party Transmission:** No data is ever sent to, collected by, or stored on external servers, cloud databases, or third-party tracking services.
- **No Analytics / Telemetry:** The Extension contains no trackers, telemetry, or advertising SDKs.

---

## 4. Network Communications & Data Flow
- **Direct ERP Communication:** The Extension makes HTTP requests directly to official COER ERP endpoints (`https://erp.coeruniversity.in/*`) using the user's existing authenticated session cookies.
- **No Intermediary Proxies:** Requests travel directly between your device and COER University's servers.

---

## 5. User Control & Data Retention
- All cached data is immediately purged when:
  1. A different student account is detected logging in on the same browser.
  2. You click the "Sync" button to re-fetch fresh data.
  3. You uninstall the extension from Chrome (`chrome://extensions`).

---

## 6. Children's Privacy & Educational Use
The Extension is designed for students enrolled at COER University. It does not collect any personally identifiable information from any user for commercial purposes.

---

## 7. Contact Information
If you have any questions or concerns regarding this Privacy Policy or the security of COER Retro OS, please contact the developer via GitHub or email:
- **Developer Email:** `heypranavpandey@gmail.com`
- **Repository:** `https://github.com/akapandey/coer`
