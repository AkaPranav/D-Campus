# RETRO-DARK UI DESIGN SYSTEM & STYLEGUIDE
**Project:** COER ERP Modernization & Augmentation Extension  
**Aesthetic:** Retro Dark Neo-Brutalist / Cyber-Retro OS  
**Status:** Active Design Specification  

---

## 1. Visual Philosophy & Core Pillars

This design system synthesizes **Retro OS aesthetics** (Win95/Mac Classic window bars, beveled tabs, pixelated accents) with **Modern Dark Neo-Brutalism** (crisp high-contrast borders, solid offset drop-shadows, monospaced metrics, vibrant functional accents).

### The 4 Core Tenets:
1. **Pitch-Dark Contrast (No Murky Grays):** Deep charcoal/void backgrounds paired with stark white text and electric retro accent blocks.
2. **Tactile Hardware Feel:** Every button, card, and tab features bold 1.5px–2px borders and hard offset shadows (`box-shadow: 3px 3px 0px #000`). Buttons physically press down on `:active` (`translate(2px, 2px)`).
3. **Information Density & Clarity:** Monospaced data displays (`JetBrains Mono` / `Space Mono`) for timestamps, percentages, marks, and codes. Clean borders rather than bloated paddings.
4. **Deliberate Functional Color Coding:** Colors are not decorative; they immediately communicate state (e.g. Green = Safe Attendance, Red = Urgent/Danger, Cyan = Timetable/Info, Amber = Pending).

---

## 2. Color Palette & Design Tokens

### Backgrounds & Surfaces (Retro Void)
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--bg-canvas` | `#0b0d11` | Primary screen canvas / extension background |
| `--bg-surface` | `#13171f` | Cards, panels, dashboard containers |
| `--bg-surface-elevated`| `#1b202b` | Hovered rows, active modals, elevated windows |
| `--bg-surface-inset` | `#080a0d` | Inset input fields, code blocks, recessed data areas |
| `--border-base` | `#2d3545` | Standard 1px–1.5px crisp card borders |
| `--border-hard` | `#000000` | High-contrast outline & shadow anchor |

### High-Contrast Functional Accents
| Token | Hex | Role & Meaning |
| :--- | :--- | :--- |
| `--accent-gold` | `#fbbf24` | **Retro Gold/Amber:** Hero metric highlights, primary warnings, active tab indicator |
| `--accent-emerald` | `#10b981` | **Terminal Emerald:** Safe Attendance (`≥75%`), Excellent ratings, submitted status |
| `--accent-cyan` | `#06b6d4` | **Cyber Cyan:** Timetable periods, file downloads, interactive links |
| `--accent-rose` | `#f43f5e` | **Hot Crimson:** Critical attendance alert (`<75%`), urgent deadlines, irreversible action guards |
| `--accent-purple` | `#a855f7` | **Synthwave Violet:** Study material tags, secondary filters, lecture plans |

### Typography Colors
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `--text-primary` | `#f8fafc` | Primary titles, metrics, bold values |
| `--text-secondary` | `#94a3b8` | Subtitles, table headers, faculty labels |
| `--text-muted` | `#64748b` | Timestamps, inactive tabs, helper text |
| `--text-inverse` | `#05070a` | Text on vibrant accent buttons/badges |

---

## 3. Typography Hierarchy

```
Headings & Display: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif
Monospace Data:     'JetBrains Mono', 'Space Mono', 'Courier New', monospace
Body & UI Text:     -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

* **Module Title (Window Header):** `14px`, Uppercase, Bold (`font-weight: 800`), Letter-spacing `0.1em`.
* **Hero Numbers / KPI Metrics:** `32px – 40px`, Monospace, Bold (`font-weight: 800`).
* **Section Headers (H2/H3):** `16px – 18px`, Bold, Letter-spacing `-0.02em`.
* **Table Data & Timestamps:** `12px – 13px`, Monospace for dates/percentages.
* **Micro-Badges & Tags:** `10px – 11px`, Uppercase, Bold (`font-weight: 700`), Letter-spacing `0.05em`.

---

## 4. Component Library & Patterns

### 1. Retro Window Card (`.retro-card`)
Every major section (Attendance gauge, Assignment list, Timetable grid) sits inside a retro window container:
```css
.retro-card {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-base);
  border-radius: 8px;
  box-shadow: 4px 4px 0px var(--border-hard);
  overflow: hidden;
}
.retro-window-bar {
  background: #191f2b;
  border-bottom: 1.5px solid var(--border-base);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.retro-window-title {
  font-family: 'Space Grotesk', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
}
.retro-window-controls {
  display: flex;
  gap: 6px;
}
.retro-dot {
  width: 10px;
  height: 10px;
  border: 1px solid #000;
  border-radius: 2px;
}
.retro-dot.close { background: #f43f5e; }
.retro-dot.min   { background: #fbbf24; }
.retro-dot.max   { background: #10b981; }
```

### 2. Tactile Retro Buttons (`.retro-btn`)
Chunky buttons with physical press mechanics:
```css
.retro-btn {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 12px;
  padding: 8px 16px;
  border: 1.5px solid #000;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 3px 3px 0px #000;
  transition: all 0.1s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.retro-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px #000;
}
.retro-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px #000;
}

/* Color Variants */
.retro-btn-gold    { background: var(--accent-gold); color: #000; }
.retro-btn-emerald { background: var(--accent-emerald); color: #000; }
.retro-btn-cyan    { background: var(--accent-cyan); color: #000; }
.retro-btn-danger  { background: var(--accent-rose); color: #fff; }
.retro-btn-ghost   { background: var(--bg-surface-elevated); color: var(--text-primary); border-color: var(--border-base); }
```

### 3. Retro Folder Tabs (`.retro-tabs`)
Tabs styled after vintage OS folder tabs with top-angled or beveled active borders:
```css
.retro-tab {
  padding: 8px 16px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 700;
  background: var(--bg-surface-inset);
  color: var(--text-muted);
  border: 1.5px solid var(--border-base);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
}
.retro-tab.active {
  background: var(--bg-surface);
  color: var(--accent-gold);
  border-color: var(--border-base);
  border-bottom: 2px solid var(--bg-surface); /* Merges with panel */
  box-shadow: 0 -2px 0 var(--accent-gold);
}
```

### 4. Status Badges & Pills (`.retro-badge`)
Compact, crisp pills with solid 1px borders:
```css
.retro-badge {
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid currentColor;
}
.retro-badge.safe    { background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); }
.retro-badge.danger  { background: rgba(244, 63, 94, 0.15);  color: var(--accent-rose); }
.retro-badge.warning { background: rgba(251, 191, 36, 0.15); color: var(--accent-gold); }
.retro-badge.info    { background: rgba(6, 182, 212, 0.15);  color: var(--accent-cyan); }
```

---

## 5. Screen-Specific Layout Architecture

### A. Top Navigation Bar (HUD Header)
* **Left:** Terminal-style prompt logo `[>] COER-OS // v2.0` with status indicator dot (pulsing green: `ONLINE`).
* **Center:** Real-time summary ticker (`ATTENDANCE: 25.93% | NEXT CLASS: 11:00 AM | DUE ASSIGNMENTS: 4`).
* **Right:** Quick action buttons (`⚡ SYNC NOW`, `[X] CLOSE OVERLAY`).

### B. Module 1: Attendance Dashboard
* **Left Column (Bento KPI 1):** Large radial progress circle showing Overall Attendance `%`. Below it:
  * "Total Lectures: 197"
  * "Attended: 50"
  * "Classes to reach 75%: +12 classes"
* **Right Column (Subject Breakdown):** Clean, high-density retro list:
  * Subject Name & Code (`BTCS301T`)
  * Faculty Name
  * Progress Bar with solid striped pattern
  * Fractional count (`6 / 28`)
  * Dynamic Badge: `CRITICAL (<75%)` or `ON TRACK (≥75%)`

### C. Module 2: Assignment & Study Material Center
* **Folder Tabs:** `[ 📁 ACTIVE ASSIGNMENTS (38) ]` | `[ 📚 STUDY MATERIAL ]`
* **Filter Pills:** Horizontal scrollable subject chips (`[ ALL ]` `[ Computer Vision ]` `[ Full Stack Lab ]` ...)
* **Priority Queue (Urgency Sorter):**
  * Cards sorted by nearest submission deadline.
  * **Card Elements:**
    * Urgency tag: `🚨 DUE IN 2 DAYS` (Hot Crimson) vs `📅 DUE 21/09` (Cyan).
    * Assignment Code & Title (`Tutorial 1: BTCS301T-AS01`).
    * Marks Display: `[10 MAX / NA OBTAINED]`.
    * Actions:
      * `[ ⬇ DOWNLOAD SPEC ]` (Direct Base64 downloader)
      * `[ ⬆ SUBMIT SOLUTION ]` (Opens Single-Submit Safe Modal)

#### **Single-Submit Safety Guard Modal (Critical Rule):**
* Diagonal caution stripes header: `⚠ WARNING: FINAL IRREVERSIBLE SUBMISSION`.
* Details summary table: Subject, Assignment Title, Faculty, Max Marks.
* File drop area with validation check (`.pdf`, `.docx`, size `< 10MB`).
* Mandatory verification checkbox:  
  `[ ] I confirm that this is my final answer. I understand COER ERP DOES NOT allow re-submission or edits.`
* Submit button remains locked until checkbox is checked and valid file is staged.

### D. Module 3: Modern Timetable Schedule
* **Dynamic "Now & Next" Banner:**
  * Displays today's active day (e.g. `WEDNESDAY`).
  * Shows current running period with live time remaining countdown.
  * Shows next immediate period and classroom.
* **Day Selector:** Horizontal tab bar: `[ MON ] [ TUE ] [ WED* ] [ THU ] [ FRI ] [ SAT ]`.
* **Period Timeline Cards:**
  * Cards for Periods 1 through 7 (`09:00 - 09:55`, `10:00 - 10:55`, etc.).
  * Subject name highlighted in high-contrast Cyan/Gold.
  * Faculty name and course code in secondary monospace.

---

## 6. Implementation Checklist & Quality Standards
- [x] All styles isolated using Shadow DOM to eliminate conflicts with the ERP's legacy Bootstrap 3 CSS.
- [x] Strict 1.5px/2px borders with hard offset drop shadows (`#000000`).
- [x] High-contrast retro dark palette with functional colors (Rose, Emerald, Gold, Cyan).
- [x] Monospace typography for numbers, codes, dates, and percentages.
- [x] Double-layer safety modal for one-time assignment uploads.
- [x] Fast background JSON caching via `chrome.storage.local`.
