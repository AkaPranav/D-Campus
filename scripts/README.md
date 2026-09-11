# 🛠️ COER Retro OS — Python Automation & Diagnostic Scripts

This directory contains standalone Python automation, reverse-engineering, and diagnostic utilities developed during the exploration and reverse-engineering of the COER University ERP portal.

---

## 📌 Scripts Overview

### 🚀 Core Automation
* **`login_assistant.py`:**  
  Launches Chrome for Testing with the isolated persistent profile (`.chrome_testing_profile`), autofills User ID & Password from `credentials`, autofocuses cursor on the CAPTCHA field, and monitors session activation.
* **`auto_login.py`:**  
  Full end-to-end automated launcher using Selenium Manager & CDP connectivity.
* **`inject_overlay.py`:**  
  Direct prototype for client-side injection of the Attendance Auto-Rating global bar and per-faculty rating buttons into jqGrid subgrids.
* **`export_and_download_assignments.py`:**  
  Scrapes all assignment records from `jqgrdStudentAssignment`, exports datasets to `data/`, and downloads all PDF/DOCX assignment sheets via `/Web_Teaching/GetAssignmentImage`.

### 🔍 Diagnostics & Inspection
* **`inspect_current_page.py`:** Inspects active portal tab and loaded jQuery / jqGrid instances via Chrome DevTools Protocol (CDP).
* **`inspect_download_cell.py`:** Dissects the exact HTML and `onclick` handlers in assignment download table cells.
* **`check_all_profs.py`:** Inspects faculty row counts and subgrid identifiers in `#tblfeedBack`.
* **`check_subgrids.py`:** Verifies subgrid table ID patterns (`tblfeedBack_X_t`).
* **`test_rating.py`:** Unit test simulating jqGrid radio button state selection and `setvalue` trigger.

### 🎨 Asset Generation & Testing
* **`generate_icons.py`:** Generates retro pixel-art extension icon assets (16x16, 48x48, 128x128).
* **`capture_calendar_modal.py`:** Headless CDP automation script that launches the in-page HUD, opens the Timetable tab, triggers the Calendar modal, and captures high-res screenshots.

---

## 🚀 How to Run

1. **Activate the Virtual Environment:**
   ```bash
   source venv/bin/activate
   ```
2. **Execute Any Script (from project root or scripts directory):**
   ```bash
   python3 scripts/login_assistant.py
   # Or via root shortcut:
   python3 login_assistant.py
   ```
