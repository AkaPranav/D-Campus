/**
 * COER Retro OS - Master Content Script (Manifest V3)
 * Scoped inside isolated Shadow DOM to avoid ERP CSS bleeding.
 * Implements:
 * 1. Floating Tactical HUD launcher & Quick Hotkey (Alt+C)
 * 2. Unified 3-Module Dashboard: Attendance Gauge, Timetable Schedule, Priority Assignments
 * 3. Irreversible Single-Submission Safety Shield Modal
 * 4. Automatic In-Page Feedback Gate Auto-Rating Bar
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__coerRetroOsInjected) return;
  window.__coerRetroOsInjected = true;

  console.log('[COER OS] Initializing Retro OS Suite...');

  // State
  let appState = {
    activeTab: 'attendance',       // 'attendance' | 'assignments' | 'timetable'
    assignmentSubTab: 'active',     // 'active' | 'study_material'
    assignmentStatusFilter: 'active', // 'active' | 'all' | 'overdue'
    selectedSubjectFilter: 'ALL',
    assignmentSort: 'priority',     // 'priority' | 'marks_desc' | 'title_asc' | 'newest_first'
    searchQuery: '',
    currentDay: getTodayDayName(),
    attendanceData: null,
    assignmentData: null,
    timetableData: null,
    rawTimetableRows: null,
    selectedElectives: {},
    activeSubmitAssignment: null,   // Holds assignment being submitted in safety modal
    selectedFile: null,
    regId: null,
    stuId: null,
    studentName: null,
    syncStatus: 'idle',
    lastSync: null
  };

  // 1. Create Host Element and Shadow DOM
  const host = document.createElement('div');
  host.id = 'coer-retro-os-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // 2. Inject Scoped Stylesheet
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('content/overlay.css');
  shadow.appendChild(styleLink);

  // 3. Inject Floating Launcher Button
  const triggerBtn = document.createElement('div');
  triggerBtn.id = 'coer-hud-trigger';
  triggerBtn.title = 'Open COER Retro OS Dashboard (Alt+C)';
  triggerBtn.innerHTML = `
    <span class="hud-pulse-dot"></span>
    <span>⚡ COER OS // v2.0</span>
  `;
  shadow.appendChild(triggerBtn);

  // 4. Inject Overlay Backdrop & Shell
  const backdrop = document.createElement('div');
  backdrop.id = 'coer-overlay-backdrop';
  backdrop.innerHTML = `
    <div class="retro-main-window">
      <!-- Window Title Bar -->
      <div class="retro-window-bar">
        <div class="retro-window-title">
          <span class="logo-brand">COER-OS</span>
          <span id="retro-window-title-text">STUDENT TERMINAL // v2.0.4</span>
        </div>
        <div class="retro-window-controls">
          <button class="retro-btn retro-btn-gold retro-btn-sm" id="btn-global-sync">⚡ SYNC DATA</button>
          <div class="retro-dot-group">
            <span class="retro-dot min" id="btn-window-min" title="Minimize (Collapse)"></span>
            <span class="retro-dot max" id="btn-window-max" title="Maximize (Full View)"></span>
            <span class="retro-dot close" id="btn-close-overlay" title="Close (ESC)"></span>
          </div>
        </div>
      </div>

      <!-- Quick HUD Status Bar -->
      <div class="retro-hud-subbar">
        <div class="retro-ticker">
          <span class="ticker-item" id="ticker-attendance">ATTENDANCE: <strong>--%</strong></span>
          <span class="ticker-item" id="ticker-next-class">NEXT CLASS: <strong>--</strong></span>
          <span class="ticker-item highlight" id="ticker-assignments">DUE ASSIGNMENTS: <strong>--</strong></span>
        </div>
        <div style="color: var(--text-muted);" id="ticker-last-sync">SYNC: IDLE</div>
      </div>

      <!-- Navigation Tabs -->
      <div class="retro-nav-bar">
        <button class="retro-nav-tab active" data-tab="attendance">
          <span>📊</span> ATTENDANCE
        </button>
        <button class="retro-nav-tab" data-tab="assignments">
          <span>📁</span> ASSIGNMENTS & NOTES
        </button>
        <button class="retro-nav-tab" data-tab="timetable">
          <span>📅</span> TIMETABLE SCHEDULE
        </button>
      </div>

      <!-- View Content Container -->
      <div class="retro-content-container" id="retro-content-view">
        <div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-family:var(--font-mono);">
          ⚡ INITIALIZING RETRO OS...
        </div>
      </div>
    </div>

    <!-- Safety Shield Modal Container -->
    <div id="coer-safety-modal-container"></div>
  `;
  shadow.appendChild(backdrop);

  // Toast Container
  const toastContainer = document.createElement('div');
  toastContainer.id = 'coer-toast-container';
  shadow.appendChild(toastContainer);

  // ----------------------------------------------------------------
  // Event Listeners & UI Wireup
  // ----------------------------------------------------------------
  triggerBtn.addEventListener('click', toggleOverlay);
  
  const mainWindow = backdrop.querySelector('.retro-main-window');
  const minBtn = shadow.getElementById('btn-window-min');
  const maxBtn = shadow.getElementById('btn-window-max');
  const windowBar = backdrop.querySelector('.retro-window-bar');

  // Minimize Window Button
  minBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isMin = mainWindow.classList.toggle('minimized');
    if (isMin) {
      mainWindow.classList.remove('maximized');
      minBtn.title = 'Restore Window';
    } else {
      minBtn.title = 'Minimize (Collapse)';
    }
  });

  // Maximize Window Button
  maxBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (mainWindow.classList.contains('minimized')) {
      mainWindow.classList.remove('minimized');
      minBtn.title = 'Minimize (Collapse)';
    }
    const isMax = mainWindow.classList.toggle('maximized');
    maxBtn.title = isMax ? 'Restore Size' : 'Maximize (Full View)';
  });

  // Click on Title Bar to restore when minimized
  windowBar.addEventListener('click', (e) => {
    if (mainWindow.classList.contains('minimized') && !e.target.closest('.retro-dot-group') && !e.target.closest('button')) {
      mainWindow.classList.remove('minimized');
      minBtn.title = 'Minimize (Collapse)';
    }
  });

  shadow.getElementById('btn-close-overlay').addEventListener('click', closeOverlay);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeOverlay();
  });

  // Global Keyboard Shortcut: Alt+C to toggle, ESC to close
  window.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      toggleOverlay();
    }
    if (e.key === 'Escape' && backdrop.classList.contains('active')) {
      if (appState.activeSubmitAssignment) {
        closeSafetyModal();
      } else {
        closeOverlay();
      }
    }
  });

  function switchNavTab(tabName) {
    shadow.querySelectorAll('.retro-nav-tab').forEach(t => {
      if (t.dataset.tab === tabName) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
    appState.activeTab = tabName;
    renderCurrentView();
  }

  // Tab switching
  shadow.querySelectorAll('.retro-nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchNavTab(tab.dataset.tab);
    });
  });

  // Interactive Quick HUD Tickers
  const tickerAsg = shadow.getElementById('ticker-assignments');
  if (tickerAsg) {
    tickerAsg.style.cursor = 'pointer';
    tickerAsg.title = 'Click to view Active Assignments';
    tickerAsg.addEventListener('click', () => {
      appState.assignmentSubTab = 'active';
      appState.assignmentStatusFilter = 'active';
      appState.selectedSubjectFilter = 'ALL';
      switchNavTab('assignments');
    });
  }

  const tickerNext = shadow.getElementById('ticker-next-class');
  if (tickerNext) {
    tickerNext.style.cursor = 'pointer';
    tickerNext.title = 'Click to view Timetable Schedule';
    tickerNext.addEventListener('click', () => {
      switchNavTab('timetable');
    });
  }

  const tickerAtt = shadow.getElementById('ticker-attendance');
  if (tickerAtt) {
    tickerAtt.style.cursor = 'pointer';
    tickerAtt.title = 'Click to view Attendance Dashboard';
    tickerAtt.addEventListener('click', () => {
      switchNavTab('attendance');
    });
  }

  // Global Sync button in header
  shadow.getElementById('btn-global-sync').addEventListener('click', () => {
    triggerSync();
  });

  function toggleOverlay() {
    if (backdrop.classList.contains('active')) {
      closeOverlay();
    } else {
      openOverlay();
    }
  }

  function openOverlay() {
    backdrop.classList.add('active');
    loadCachedDataAndRender();
  }

  function closeOverlay() {
    backdrop.classList.remove('active');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `retro-toast ${type}`;
    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ----------------------------------------------------------------
  // Dynamic Student Session & Profile Detector (Zero Hardcoding)
  // ----------------------------------------------------------------
  function detectStudentContext() {
    const html = document.documentElement.innerHTML;
    
    // 1. Direct window / script variable check
    let regId = window.RegID || null;
    
    // 2. Multi-pattern scan across page scripts
    if (!regId) {
      const patterns = [
        /var\s+RegID\s*=\s*['"](\d+)['"]/i,
        /var\s+uid\s*=\s*['"](\d+)['"]/i,
        /RegID\s*[:=]\s*['"](\d+)['"]/i,
        /FillGrid\((\d+)\)/i,
        /UploadStudentPhoto\?RegID=(\d+)/i,
        /StudentIDCardPrint.*?RegID:\s*['"](\d+)['"]/is,
        /FillMarksheet.*?uid\s*=\s*['"](\d+)['"]/is
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m && m[1] && m[1] !== '0') {
          regId = m[1];
          break;
        }
      }
    }

    // 3. Student ID (e.g. CU240250963)
    const stuIdEl = document.querySelector('#stuID');
    const stuMatch = html.match(/CU\d+/i);
    const stuId = (stuIdEl && stuIdEl.textContent && stuIdEl.textContent.trim().length > 0)
      ? stuIdEl.textContent.trim()
      : (stuMatch ? stuMatch[0] : null);

    // 4. Student Name
    let studentName = null;
    if (stuIdEl && stuIdEl.previousElementSibling && stuIdEl.previousElementSibling.tagName === 'H4' && stuIdEl.previousElementSibling.textContent.trim()) {
      studentName = stuIdEl.previousElementSibling.textContent.trim();
    } else {
      const h4 = document.querySelector('h4');
      if (h4 && /^[A-Z\s]+$/.test(h4.textContent.trim()) && h4.textContent.trim().length > 3) {
        studentName = h4.textContent.trim();
      }
    }

    return { regId, stuId, studentName };
  }

  // ----------------------------------------------------------------
  // Storage & Sync Engine
  // ----------------------------------------------------------------
  async function loadCachedDataAndRender() {
    try {
      const stored = await chrome.storage.local.get([
        'regId', 'studentName', 'stuId',
        'attendanceData', 'assignmentData', 'timetableData',
        'rawTimetableRows', 'selectedElectives', 'lastSync'
      ]);
      if (stored.regId) appState.regId = stored.regId;
      if (stored.studentName) appState.studentName = stored.studentName;
      if (stored.stuId) appState.stuId = stored.stuId;
      if (stored.attendanceData) appState.attendanceData = stored.attendanceData;
      if (stored.assignmentData) appState.assignmentData = stored.assignmentData;
      if (stored.selectedElectives) appState.selectedElectives = stored.selectedElectives;
      if (stored.rawTimetableRows) appState.rawTimetableRows = stored.rawTimetableRows;

      // Update window title with student identity
      const titleEl = shadow.getElementById('retro-window-title-text');
      if (titleEl) {
        if (appState.studentName) {
          titleEl.textContent = `${appState.studentName.toUpperCase()} ${appState.stuId ? '• ' + appState.stuId : ''}`;
        } else {
          titleEl.textContent = 'STUDENT TERMINAL // v2.0.4';
        }
      }

      if (stored.rawTimetableRows && Array.isArray(stored.rawTimetableRows)) {
        appState.timetableData = parseTimetableJson(
          stored.rawTimetableRows,
          appState.attendanceData?.subjects || [],
          appState.selectedElectives || {}
        );
      } else if (appState.regId) {
        await fetchTimetableDirectly(appState.regId);
      }
      if (stored.lastSync) appState.lastSync = stored.lastSync;

      updateTicker();
      renderCurrentView();
    } catch (e) {
      console.warn('[COER OS] Error loading storage:', e);
    }
  }

  async function fetchTimetableDirectly(regId) {
    if (!regId) return;
    try {
      const res = await fetch('/Web_StudentAcademic/FillStudentTimeTable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: `RegID=${encodeURIComponent(regId)}`
      });
      if (res.ok) {
        const json = await res.json();
        const rows = JSON.parse(json.state || '[]');
        appState.rawTimetableRows = rows;
        const parsed = parseTimetableJson(rows, appState.attendanceData?.subjects || [], appState.selectedElectives || {});
        appState.timetableData = parsed;
        await chrome.storage.local.set({ timetableData: parsed, rawTimetableRows: rows });
        updateTicker();
        renderCurrentView();
      }
    } catch (e) {
      console.warn('[COER OS] Direct timetable fetch warning:', e);
    }
  }

  const SUBJECT_SHORT_MAP = {
    "Mastery in Data Analytics and Visualizations and Career Advancement": "Data Analytics & Career Adv.",
    "Advance Database Management System": "Advance DBMS",
    "Virtualization and Cloud Computing": "Cloud Computing",
    "Computer Vision Lab": "Computer Vision Lab",
    "Computer Vision": "Computer Vision",
    "Cyber Forensic": "Cyber Forensic",
    "Full Stack Lab": "Full Stack Lab",
    "Full Stack": "Full Stack",
    "GATE": "GATE"
  };

  function cleanFacultyName(raw) {
    if (!raw) return "";
    return raw.replace(/\s+/g, ' ').trim();
  }

  function parseElectiveOptions(val) {
    if (!val || typeof val !== 'string') return [];
    const segments = val.split('-').map(s => s.trim()).filter(Boolean);
    return segments.map(seg => {
      const parts = seg.split(',');
      const rawSubj = (parts[0] || '').trim();
      const rawFac = parts.length > 1 ? (parts[1] || '').trim() : '';

      const matchSubj = rawSubj.match(/^(.*?)(?:\s*\((.*?)\))?$/);
      const baseSubj = matchSubj ? matchSubj[1].trim() : rawSubj;
      const code = (matchSubj && matchSubj[2]) ? matchSubj[2].trim() : '';
      const shortSubject = SUBJECT_SHORT_MAP[baseSubj] || baseSubj;
      const faculty = cleanFacultyName(rawFac);

      return {
        raw: seg,
        subject: baseSubj,
        shortSubject,
        code,
        faculty
      };
    });
  }

  function parseTimetableJson(rows, enrolledSubjects = [], userElectives = {}) {
    const result = {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
    };

    if (!Array.isArray(rows)) return result;

    const periodDefs = [
      { keyPattern: /\(P1\)/i, period: 'P1', defaultTime: '09:00 - 09:55' },
      { keyPattern: /\(P2\)/i, period: 'P2', defaultTime: '10:00 - 10:55' },
      { keyPattern: /\(P3\)/i, period: 'P3', defaultTime: '11:00 - 11:55' },
      { keyPattern: /\(P4\)/i, period: 'P4', defaultTime: '12:00 - 12:55' },
      { keyPattern: /\(P5\)/i, period: 'P5', defaultTime: '13:00 - 13:55' },
      { keyPattern: /\(P6\)/i, period: 'P6', defaultTime: '14:00 - 14:55' },
      { keyPattern: /\(P7\)/i, period: 'P7', defaultTime: '15:00 - 15:55' }
    ];

    rows.forEach(row => {
      let dayName = (row['Days/Period'] || '').trim();
      if (dayName.toLowerCase().startsWith('thru') || dayName.toLowerCase().startsWith('thur')) {
        dayName = 'Thursday';
      }

      if (!result[dayName]) return;

      const rowKeys = Object.keys(row);

      periodDefs.forEach(def => {
        const matchKey = rowKeys.find(k => def.keyPattern.test(k));
        let val = matchKey ? row[matchKey] : null;
        let timeStr = def.defaultTime;

        if (matchKey) {
          const timeMatch = matchKey.match(/\d{2}:\d{2}\s*-\s*\d{2}:\d{2}/);
          if (timeMatch) timeStr = timeMatch[0];
        }

        const isFree = !val || val.trim() === '' || val.trim() === '&nbsp;';
        const slotKey = `${dayName}-${def.period}`;

        if (isFree) {
          result[dayName].push({
            period: def.period,
            time: timeStr,
            subject: 'Free / Recess',
            shortSubject: 'Free / Recess',
            code: '',
            faculty: '—',
            content: 'FREE / RECESS',
            options: null,
            slotKey,
            isFree: true
          });
          return;
        }

        val = val.trim();
        const options = parseElectiveOptions(val);

        let chosen = null;

        // 1. Check user manual override from storage
        if (userElectives && userElectives[slotKey]) {
          chosen = options.find(o => o.subject === userElectives[slotKey] || o.code === userElectives[slotKey]);
        }

        // 2. Auto-match against student's enrolled subjects from attendance data (Zero Hardcoding!)
        if (!chosen && enrolledSubjects && enrolledSubjects.length > 0) {
          chosen = options.find(opt => {
            return enrolledSubjects.some(enr => {
              const enrCode = (enr.code || enr.SubjectCode || '').trim();
              const enrSubj = (enr.subject || enr.Subject || '').toLowerCase();
              if (opt.code && enrCode && opt.code.toUpperCase() === enrCode.toUpperCase()) return true;
              if (opt.subject && enrSubj && enrSubj.includes(opt.subject.toLowerCase())) return true;
              return false;
            });
          });
        }

        // 3. Fallback to first option if no match
        if (!chosen) {
          chosen = options[0] || {
            subject: 'Unknown',
            shortSubject: 'Unknown',
            code: '',
            faculty: '—'
          };
        }

        result[dayName].push({
          period: def.period,
          time: timeStr,
          subject: chosen.subject,
          shortSubject: chosen.shortSubject,
          code: chosen.code,
          faculty: chosen.faculty,
          content: `${chosen.shortSubject} • ${chosen.faculty}`,
          options: options.length > 1 ? options : null,
          slotKey,
          isFree: false
        });
      });
    });

    return result;
  }

  async function triggerSync() {
    const syncBtn = shadow.getElementById('btn-global-sync');
    syncBtn.disabled = true;
    syncBtn.textContent = '⏳ SYNCING...';
    showToast('Synchronizing ERP modules...', 'info');

    try {
      const student = detectStudentContext();
      const stored = await chrome.storage.local.get(['regId', 'studentName', 'stuId']);
      const targetRegId = student.regId || stored.regId;

      if (!targetRegId) {
        syncBtn.disabled = false;
        syncBtn.textContent = '⚡ SYNC DATA';
        showToast('Please log in to your COER ERP account first', 'warning');
        return;
      }

      chrome.runtime.sendMessage({
        type: 'SYNC_STUDENT_IDENTITY',
        regId: targetRegId,
        stuId: student.stuId || stored.stuId,
        studentName: student.studentName || stored.studentName
      }, async (response) => {
        syncBtn.disabled = false;
        syncBtn.textContent = '⚡ SYNC DATA';

        if (response && response.success) {
          showToast('Data synchronized successfully!', 'success');
          await loadCachedDataAndRender();
        } else {
          showToast('Sync failed: Check session / login state', 'error');
        }
      });
    } catch (err) {
      syncBtn.disabled = false;
      syncBtn.textContent = '⚡ SYNC DATA';
      showToast('Sync request error: ' + err.message, 'error');
    }
  }

  function updateTicker() {
    // 1. Attendance Ticker
    if (appState.attendanceData && appState.attendanceData.overallPercentage !== undefined) {
      const pct = appState.attendanceData.overallPercentage;
      const el = shadow.getElementById('ticker-attendance');
      if (el) el.innerHTML = `ATTENDANCE: <strong style="color:${pct >= 75 ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">${pct}%</strong>`;
    }

    // 2. Dynamic Next Class Ticker
    const nextInfo = getNextClassInfo();
    const nextEl = shadow.getElementById('ticker-next-class');
    if (nextEl) {
      if (nextInfo) {
        nextEl.innerHTML = `NEXT CLASS: <strong style="color:var(--accent-cyan)">${nextInfo.label} • ${nextInfo.subject}</strong>`;
      } else {
        nextEl.innerHTML = `NEXT CLASS: <strong>SCHEDULE CONCLUDED</strong>`;
      }
    }

    // 3. Urgent Assignments
    if (appState.assignmentData && appState.assignmentData.assignments) {
      const activeCount = appState.assignmentData.assignments.filter(a => !a.isOverdue).length;
      const asgEl = shadow.getElementById('ticker-assignments');
      if (asgEl) asgEl.innerHTML = `ACTIVE ASSIGNMENTS: <strong>${activeCount} DUE</strong>`;
    }

    // 4. Last Sync
    if (appState.lastSync) {
      const d = new Date(appState.lastSync);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const syncEl = shadow.getElementById('ticker-last-sync');
      if (syncEl) syncEl.textContent = `LAST SYNC: ${timeStr}`;
    }
  }

  // ----------------------------------------------------------------
  // Master View Switcher
  // ----------------------------------------------------------------
  function renderCurrentView() {
    const container = shadow.getElementById('retro-content-view');
    container.innerHTML = '';

    if (appState.activeTab === 'attendance') {
      container.appendChild(renderAttendanceView());
    } else if (appState.activeTab === 'assignments') {
      container.appendChild(renderAssignmentView());
    } else if (appState.activeTab === 'timetable') {
      container.appendChild(renderTimetableView());
    }
  }

  // ----------------------------------------------------------------
  // MODULE 1: ATTENDANCE DASHBOARD
  // ----------------------------------------------------------------
  function renderAttendanceView() {
    const wrapper = document.createElement('div');
    wrapper.className = 'attendance-layout';

    const att = appState.attendanceData || {
      overallPercentage: 25.93,
      totalLectures: 216,
      totalPresent: 56,
      subjects: []
    };

    const pct = att.overallPercentage || 0;
    const isSafe = pct >= 75;
    const statusColor = isSafe ? 'var(--accent-emerald)' : 'var(--accent-rose)';

    // Left Column: KPI Radial Gauge & Stats Card
    const leftCard = document.createElement('div');
    leftCard.className = 'retro-card';
    
    // SVG Circular Progress calculation
    // Circle r=70, circumference = 2 * PI * 70 = 439.82
    const circumference = 439.82;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    const classesNeeded = Math.max(0, Math.ceil(3 * att.totalLectures - 4 * att.totalPresent));

    leftCard.innerHTML = `
      <div class="retro-card-header">
        <span class="retro-card-title"><span>★</span> OVERALL ATTENDANCE</span>
        <span class="retro-badge ${isSafe ? 'safe' : 'danger'}">${isSafe ? 'ON TRACK' : 'CRITICAL DEFICIT'}</span>
      </div>
      <div class="retro-card-body kpi-gauge-box">
        <div style="position:relative; width:170px; height:170px; display:flex; align-items:center; justify-content:center;">
          <svg class="kpi-circle-svg" viewBox="0 0 160 160">
            <circle class="kpi-circle-bg" cx="80" cy="80" r="70"></circle>
            <circle class="kpi-circle-bar ${isSafe ? 'safe' : (pct >= 60 ? 'warning' : 'danger')}" 
                    cx="80" cy="80" r="70" 
                    stroke-dasharray="${circumference}" 
                    stroke-dashoffset="${strokeDashoffset}"></circle>
          </svg>
          <div class="kpi-gauge-inner">
            <span class="kpi-val-number" style="color:${statusColor};">${pct}%</span>
            <span class="kpi-val-label">TOTAL ATTENDANCE</span>
          </div>
        </div>

        <div class="kpi-metrics-list">
          <div class="kpi-metric-row">
            <span>Total Delivered:</span>
            <span class="val">${att.totalLectures} Lectures</span>
          </div>
          <div class="kpi-metric-row">
            <span>Total Attended:</span>
            <span class="val" style="color:var(--accent-emerald)">${att.totalPresent} Classes</span>
          </div>
          <div class="kpi-metric-row">
            <span>Total Absent:</span>
            <span class="val" style="color:var(--accent-rose)">${att.totalLectures - att.totalPresent} Classes</span>
          </div>
          <div class="kpi-metric-row" style="border-color:${isSafe ? 'var(--accent-emerald)' : 'var(--accent-rose)'}">
            <span>Req. for 75% Barrier:</span>
            <span class="val" style="color:${isSafe ? 'var(--accent-emerald)' : 'var(--accent-gold)'}">
              ${isSafe ? 'Target Achieved ✓' : `+${classesNeeded} Lectures`}
            </span>
          </div>
        </div>
      </div>
    `;

    // Right Column: Subject-wise Breakdown
    const rightCard = document.createElement('div');
    rightCard.className = 'retro-card';
    rightCard.style.display = 'flex';
    rightCard.style.flexDirection = 'column';

    rightCard.innerHTML = `
      <div class="retro-card-header">
        <span class="retro-card-title"><span>📋</span> SUBJECT-WISE METRICS (${att.subjects.length})</span>
        <input type="text" id="att-subject-search" placeholder="Filter subjects..." 
               style="background:var(--bg-surface-inset); border:1px solid var(--border-base); color:#fff; font-family:var(--font-mono); font-size:11px; padding:4px 10px; border-radius:4px; outline:none; width:180px;">
      </div>
      <div class="retro-card-body" style="flex:1; overflow:hidden;">
        <div class="attendance-subjects-list" id="att-subject-container"></div>
      </div>
    `;

    const subContainer = rightCard.querySelector('#att-subject-container');

    function populateSubjects(filterText = '') {
      subContainer.innerHTML = '';
      const filtered = att.subjects.filter(s => 
        s.subject.toLowerCase().includes(filterText.toLowerCase()) ||
        s.code.toLowerCase().includes(filterText.toLowerCase()) ||
        s.faculty.toLowerCase().includes(filterText.toLowerCase())
      );

      if (filtered.length === 0) {
        subContainer.innerHTML = `
          <div style="text-align:center; padding:40px; color:var(--text-muted); font-family:var(--font-mono);">
            NO MATCHING SUBJECTS FOUND.
          </div>
        `;
        return;
      }

      filtered.forEach(subj => {
        const sCard = document.createElement('div');
        sCard.className = 'subject-row-card';
        const subjSafe = subj.isSafe;

        sCard.innerHTML = `
          <div class="subject-header">
            <div class="subject-title-box">
              <span class="subject-name">${subj.subject}</span>
              <div class="subject-meta">
                <span>CODE: ${subj.code}</span>
                <span>•</span>
                <span>FACULTY: ${subj.faculty}</span>
              </div>
            </div>
            <span class="retro-badge ${subjSafe ? 'safe' : 'danger'}">
              ${subjSafe ? 'SAFE (≥75%)' : 'CRITICAL (<75%)'}
            </span>
          </div>

          <div class="subject-progress-bg">
            <div class="subject-progress-fill ${subjSafe ? 'safe' : 'danger'}" style="width: ${Math.min(100, subj.percentage)}%;"></div>
          </div>

          <div class="subject-stats-bar">
            <span style="color:var(--text-secondary);">ATTENDED: <strong style="color:#fff;">${subj.totalPresent} / ${subj.totalLectures}</strong></span>
            ${!subjSafe && subj.neededFor75 > 0 ? `<span style="color:var(--accent-gold);">NEED: <strong>+${subj.neededFor75}</strong> to hit 75%</span>` : '<span style="color:var(--accent-emerald);">ELIGIBLE FOR EXAMS ✓</span>'}
            <span style="font-weight:800; color:${subjSafe ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">${subj.percentage}%</span>
          </div>
        `;
        subContainer.appendChild(sCard);
      });
    }

    populateSubjects();

    const searchInput = rightCard.querySelector('#att-subject-search');
    searchInput.addEventListener('input', (e) => {
      populateSubjects(e.target.value);
    });

    wrapper.appendChild(leftCard);
    wrapper.appendChild(rightCard);
    return wrapper;
  }

  // ----------------------------------------------------------------
  // MODULE 2: ASSIGNMENT & STUDY MATERIAL CENTER
  // ----------------------------------------------------------------
  function renderAssignmentView() {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';

    const assignData = appState.assignmentData || {
      assignments: [],
      studyMaterials: [],
      totalAssignments: 0,
      activeAssignmentsCount: 0,
      totalStudyMaterials: 0
    };

    const isStudy = appState.assignmentSubTab === 'study_material';
    const allAssignments = assignData.assignments || [];
    const activeAssignments = allAssignments.filter(a => !a.isOverdue);
    const overdueAssignments = allAssignments.filter(a => a.isOverdue);
    const activeCount = assignData.activeAssignmentsCount !== undefined
      ? assignData.activeAssignmentsCount
      : activeAssignments.length;
    const overdueCount = overdueAssignments.length;
    const totalCount = allAssignments.length;

    let targetList;
    if (isStudy) {
      targetList = assignData.studyMaterials || [];
    } else {
      if (appState.assignmentStatusFilter === 'active') {
        targetList = activeAssignments;
      } else if (appState.assignmentStatusFilter === 'overdue') {
        targetList = overdueAssignments;
      } else {
        targetList = allAssignments;
      }
    }

    // Extract unique subjects specific to this subtab
    const subtabSubjects = Array.from(new Set(targetList.map(a => a.subject).filter(Boolean))).sort();
    if (appState.selectedSubjectFilter !== 'ALL' && !subtabSubjects.includes(appState.selectedSubjectFilter)) {
      appState.selectedSubjectFilter = 'ALL';
    }

    // Top Controls Bar (Switcher, Sort, Search)
    const controls = document.createElement('div');
    controls.className = 'assignment-controls-bar';
    controls.innerHTML = `
      <div class="subtab-switcher">
        <button class="subtab-btn ${!isStudy ? 'active' : ''}" data-sub="active">
          📁 ACTIVE ASSIGNMENTS (${activeCount})
        </button>
        <button class="subtab-btn ${isStudy ? 'active' : ''}" data-sub="study_material">
          📚 STUDY MATERIAL (${assignData.totalStudyMaterials || assignData.studyMaterials.length})
        </button>
      </div>

      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        ${!isStudy ? `
          <select id="assignment-status-select" style="background:var(--bg-surface-inset); border:1.5px solid var(--border-base); color:var(--accent-cyan); font-family:var(--font-mono); font-size:11px; padding:6px 10px; border-radius:4px; outline:none; cursor:pointer;">
            <option value="active" ${appState.assignmentStatusFilter === 'active' ? 'selected' : ''}>⚡ Active Due (${activeCount})</option>
            <option value="all" ${appState.assignmentStatusFilter === 'all' ? 'selected' : ''}>📂 All Records (${totalCount})</option>
            <option value="overdue" ${appState.assignmentStatusFilter === 'overdue' ? 'selected' : ''}>🔒 Submission Closed (${overdueCount})</option>
          </select>
        ` : ''}
        <select id="assignment-sort-select" style="background:var(--bg-surface-inset); border:1.5px solid var(--border-base); color:var(--accent-gold); font-family:var(--font-mono); font-size:11px; padding:6px 10px; border-radius:4px; outline:none; cursor:pointer;">
          ${!isStudy ? `
            <option value="priority" ${appState.assignmentSort === 'priority' ? 'selected' : ''}>⚡ Priority: Due Soonest First</option>
            <option value="marks_desc" ${appState.assignmentSort === 'marks_desc' ? 'selected' : ''}>🏆 Max Marks (High to Low)</option>
            <option value="title_asc" ${appState.assignmentSort === 'title_asc' ? 'selected' : ''}>🔤 Title (A-Z)</option>
            <option value="newest_first" ${appState.assignmentSort === 'newest_first' ? 'selected' : ''}>📅 Recently Posted First</option>
          ` : `
            <option value="priority" ${appState.assignmentSort === 'priority' ? 'selected' : ''}>📅 Newest Notes First</option>
            <option value="title_asc" ${appState.assignmentSort === 'title_asc' ? 'selected' : ''}>🔤 Title (A-Z)</option>
          `}
        </select>
        <input type="text" id="assignment-search-input" placeholder="Search title, faculty, keywords..." 
               value="${appState.searchQuery}"
               style="background:var(--bg-surface-inset); border:1.5px solid var(--border-base); color:#fff; font-family:var(--font-mono); font-size:11px; padding:6px 12px; border-radius:4px; outline:none; width:220px;">
      </div>
    `;

    // Filter Chips pinned prominently at the top
    const chipsBar = document.createElement('div');
    chipsBar.className = 'subject-filter-chips';
    
    // "ALL" chip
    const allChip = document.createElement('button');
    allChip.className = `filter-chip ${appState.selectedSubjectFilter === 'ALL' ? 'active' : ''}`;
    allChip.textContent = `ALL SUBJECTS (${targetList.length})`;
    allChip.addEventListener('click', () => {
      appState.selectedSubjectFilter = 'ALL';
      renderCurrentView();
    });
    chipsBar.appendChild(allChip);

    subtabSubjects.forEach(subj => {
      const chip = document.createElement('button');
      const count = targetList.filter(a => a.subject === subj).length;
      const shortName = SUBJECT_SHORT_MAP[subj] || subj;
      chip.className = `filter-chip ${appState.selectedSubjectFilter === subj ? 'active' : ''}`;
      chip.textContent = `${shortName} (${count})`;
      chip.title = subj;
      chip.addEventListener('click', () => {
        appState.selectedSubjectFilter = subj;
        renderCurrentView();
      });
      chipsBar.appendChild(chip);
    });

    // Grid Container
    const grid = document.createElement('div');
    grid.className = 'assignments-grid';

    // Filter items based on subtab, chip, and search query
    let filteredList = targetList.filter(item => {
      const matchesSubj = appState.selectedSubjectFilter === 'ALL' || item.subject === appState.selectedSubjectFilter;
      const q = appState.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.title.toLowerCase().includes(q) || 
        item.faculty.toLowerCase().includes(q) || 
        item.subject.toLowerCase().includes(q) || 
        (item.keywords && item.keywords.toLowerCase().includes(q));
      return matchesSubj && matchesSearch;
    });

    // Apply Sorting with Priority placement
    if (!isStudy) {
      if (appState.assignmentSort === 'priority') {
        // Priority order:
        // 1. Active assignments (not overdue) come FIRST, ordered by nearest deadline ascending
        // 2. Overdue assignments come AFTER, ordered by most recent past deadline descending
        filteredList.sort((a, b) => {
          if (!a.isOverdue && b.isOverdue) return -1;
          if (a.isOverdue && !b.isOverdue) return 1;
          if (!a.isOverdue && !b.isOverdue) {
            return (a.dueDateTimestamp || Infinity) - (b.dueDateTimestamp || Infinity);
          }
          return (b.dueDateTimestamp || 0) - (a.dueDateTimestamp || 0);
        });
      } else if (appState.assignmentSort === 'marks_desc') {
        filteredList.sort((a, b) => (parseInt(b.maxMarks) || 0) - (parseInt(a.maxMarks) || 0));
      } else if (appState.assignmentSort === 'title_asc') {
        filteredList.sort((a, b) => a.title.localeCompare(b.title));
      } else if (appState.assignmentSort === 'newest_first') {
        filteredList.sort((a, b) => (b.dueDateTimestamp || 0) - (a.dueDateTimestamp || 0));
      }
    } else {
      // Study material sorting
      if (appState.assignmentSort === 'title_asc') {
        filteredList.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        filteredList.sort((a, b) => (b.dueDateTimestamp || 0) - (a.dueDateTimestamp || 0) || a.title.localeCompare(b.title));
      }
    }

    if (filteredList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:60px 20px; color:var(--text-muted); font-family:var(--font-mono);">
          NO ITEMS FOUND MATCHING THE SELECTED FILTERS.
        </div>
      `;
    } else {
      filteredList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'assignment-card';

        const shortSubject = SUBJECT_SHORT_MAP[item.subject] || item.subject;

        if (isStudy) {
          // Study Material / Notes: NO DEADLINES, NO PASS MARKS
          card.innerHTML = `
            <div class="assignment-card-top">
              <div class="card-header-line">
                <span class="assignment-subject-tag">${shortSubject}</span>
                <span class="retro-badge info">LECTURE NOTES</span>
              </div>
              <h4 class="assignment-card-title">${item.title}</h4>
              
              <div class="assignment-card-meta">
                <div><strong>FACULTY:</strong> ${item.faculty}</div>
                <div><strong>POSTED ON:</strong> ${item.givenDate || 'N/A'}</div>
                ${item.keywords ? `<div><strong>TOPICS:</strong> <span style="color:var(--accent-purple)">${item.keywords}</span></div>` : ''}
                ${item.references && item.references.startsWith('http') ? `
                  <div style="margin-top:4px;">
                    <a href="${item.references}" target="_blank" style="color:var(--accent-gold); text-decoration:underline;">▶ Open Video / Web Reference</a>
                  </div>` : ''}
              </div>
            </div>

            <div class="assignment-card-actions">
              <button class="retro-btn retro-btn-cyan retro-btn-sm btn-download-spec" data-id="${item.assignmentDetailId}" data-title="${item.title}" data-ext="${item.extension}">
                ⬇ DOWNLOAD NOTES
              </button>
            </div>
          `;
        } else {
          // Assignment: Active vs Overdue state
          let badgeClass = 'warning';
          let badgeText = `⚡ DUE: ${item.dueDate || 'Immediate'}`;
          if (item.isOverdue) {
            badgeClass = 'danger';
            badgeText = 'DEADLINE PASSED';
          }

          card.innerHTML = `
            <div class="assignment-card-top">
              <div class="card-header-line">
                <span class="assignment-subject-tag">${shortSubject}</span>
                <span class="retro-badge ${badgeClass}">${badgeText}</span>
              </div>
              <h4 class="assignment-card-title">${item.title}</h4>
              
              <div class="assignment-card-meta">
                <div><strong>FACULTY:</strong> ${item.faculty}</div>
                <div><strong>GIVEN:</strong> ${item.givenDate || 'N/A'} &nbsp;|&nbsp; <strong>DEADLINE:</strong> ${item.dueDate || 'Immediate'}</div>
                <div><strong>MAX MARKS:</strong> ${item.maxMarks} &nbsp;|&nbsp; <strong>OBTAINED:</strong> ${item.obtainedMarks}</div>
                ${item.keywords ? `<div><strong>TOPICS:</strong> <span style="color:var(--accent-purple)">${item.keywords}</span></div>` : ''}
                ${item.references && item.references.startsWith('http') ? `
                  <div style="margin-top:4px;">
                    <a href="${item.references}" target="_blank" style="color:var(--accent-gold); text-decoration:underline;">▶ Open Video / Web Reference</a>
                  </div>` : ''}
              </div>
            </div>

            <div class="assignment-card-actions">
              <button class="retro-btn retro-btn-cyan retro-btn-sm btn-download-spec" data-id="${item.assignmentDetailId}" data-title="${item.title}" data-ext="${item.extension}">
                ⬇ DOWNLOAD SPEC
              </button>
              ${item.isOverdue ? `
                <button class="retro-btn retro-btn-ghost retro-btn-sm" disabled style="opacity:0.45; cursor:not-allowed; border-color:var(--accent-rose); color:var(--accent-rose);" title="Submission deadline has passed. Uploads are closed.">
                  🔒 SUBMISSION CLOSED
                </button>
              ` : `
                <button class="retro-btn retro-btn-gold retro-btn-sm btn-open-submit" data-id="${item.assignmentDetailId}">
                  ⬆ SUBMIT SOLUTION
                </button>
              `}
            </div>
          `;
        }

        // Wire download action
        card.querySelector('.btn-download-spec').addEventListener('click', () => {
          downloadAssignmentFile(item.assignmentDetailId, item.title, item.extension);
        });

        // Wire submit action if active
        if (!isStudy && !item.isOverdue) {
          const submitBtn = card.querySelector('.btn-open-submit');
          if (submitBtn) {
            submitBtn.addEventListener('click', () => {
              openSafetyModal(item);
            });
          }
        }

        grid.appendChild(card);
      });
    }

    // Wire Controls
    controls.querySelectorAll('.subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        appState.assignmentSubTab = btn.dataset.sub;
        if (btn.dataset.sub === 'active') {
          appState.assignmentStatusFilter = 'active';
        }
        appState.selectedSubjectFilter = 'ALL';
        renderCurrentView();
      });
    });

    const statusSelect = controls.querySelector('#assignment-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        appState.assignmentStatusFilter = e.target.value;
        appState.selectedSubjectFilter = 'ALL';
        renderCurrentView();
      });
    }

    const searchInput = controls.querySelector('#assignment-search-input');
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      renderCurrentView();
    });

    const sortSelect = controls.querySelector('#assignment-sort-select');
    sortSelect.addEventListener('change', (e) => {
      appState.assignmentSort = e.target.value;
      renderCurrentView();
    });

    wrapper.appendChild(controls);
    wrapper.appendChild(chipsBar);
    wrapper.appendChild(grid);
    return wrapper;
  }

  // ----------------------------------------------------------------
  // MODULE 3: TIMETABLE SCHEDULE (MON - FRI ONLY)
  // ----------------------------------------------------------------
  function renderTimetableView() {
    const wrapper = document.createElement('div');
    wrapper.className = 'timetable-container';

    const tt = appState.timetableData || {
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
    };

    // COER runs Monday through Friday only (No Saturday)
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const todayName = getTodayDayName();

    // 1. Dynamic "Now & Next" Live Lecture Card
    const nowNextInfo = getLiveLectureStatus(tt);
    const nowNextCard = document.createElement('div');
    nowNextCard.className = 'now-next-card';
    nowNextCard.innerHTML = `
      <div class="now-box">
        <div class="now-label">
          <span class="hud-pulse-dot" style="background:var(--accent-gold); box-shadow:0 0 8px var(--accent-gold);"></span>
          ACTIVE LECTURE NOW (${todayName})
        </div>
        <div class="now-title">${nowNextInfo.currentClass.subject}</div>
        <div class="now-detail">
          ${nowNextInfo.currentClass.period} &nbsp;•&nbsp; ${nowNextInfo.currentClass.time}
          ${nowNextInfo.currentClass.faculty !== '—' ? `&nbsp;•&nbsp; 👤 ${nowNextInfo.currentClass.faculty}` : ''}
        </div>
      </div>

      <div class="next-box">
        <div class="now-label" style="color:var(--accent-cyan)">
          <span>⏭</span> NEXT UPCOMING CLASS
        </div>
        <div class="now-title">${nowNextInfo.nextClass.subject}</div>
        <div class="now-detail">
          ${nowNextInfo.nextClass.period} &nbsp;•&nbsp; ${nowNextInfo.nextClass.time}
          ${nowNextInfo.nextClass.faculty !== '—' ? `&nbsp;•&nbsp; 👤 ${nowNextInfo.nextClass.faculty}` : ''}
        </div>
      </div>
    `;

    // 2. Day Selector Tabs (Monday - Friday)
    const dayBar = document.createElement('div');
    dayBar.className = 'day-selector-bar';

    days.forEach(day => {
      const btn = document.createElement('button');
      const isToday = day.toLowerCase() === todayName.toLowerCase();
      btn.className = `day-tab-btn ${appState.currentDay.toLowerCase() === day.toLowerCase() ? 'active' : ''}`;
      btn.textContent = isToday ? `${day.toUpperCase()} ★` : day.toUpperCase();
      btn.addEventListener('click', () => {
        appState.currentDay = day;
        renderCurrentView();
      });
      dayBar.appendChild(btn);
    });

    // 3. Period Cards Grid (P1 - P7)
    const grid = document.createElement('div');
    grid.className = 'timetable-periods-grid';

    const periodsForDay = tt[appState.currentDay] || [];
    if (periodsForDay.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--text-muted); font-family:var(--font-mono);">
          NO TIMETABLE PERIOD DATA FOR ${appState.currentDay.toUpperCase()}.
        </div>
      `;
    } else {
      const isToday = appState.currentDay.toLowerCase() === todayName.toLowerCase();
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      periodsForDay.forEach(p => {
        const pCard = document.createElement('div');
        const match = p.time.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);

        let statusBadgeClass = 'safe';
        let statusBadgeText = 'SCHEDULED';
        let statusCardClass = '';

        if (isToday) {
          if (p.isFree) {
            statusBadgeClass = 'muted';
            statusBadgeText = 'RECESS';
          } else if (match) {
            const startMin = parseInt(match[1]) * 60 + parseInt(match[2]);
            const endMin = parseInt(match[3]) * 60 + parseInt(match[4]);

            if (currentMinutes > endMin) {
              statusBadgeClass = 'muted';
              statusBadgeText = 'COMPLETED';
              statusCardClass = 'completed';
            } else if (currentMinutes >= startMin && currentMinutes <= endMin) {
              statusBadgeClass = 'info';
              statusBadgeText = 'NOW RUNNING';
              statusCardClass = 'current-active';
            } else {
              statusBadgeClass = 'safe';
              statusBadgeText = 'UPCOMING';
            }
          }
        } else {
          if (p.isFree) {
            statusBadgeClass = 'muted';
            statusBadgeText = 'RECESS';
          } else {
            statusBadgeClass = 'safe';
            statusBadgeText = 'SCHEDULED';
          }
        }

        pCard.className = `period-card ${statusCardClass} ${p.isFree ? 'is-free' : ''}`;

        pCard.innerHTML = `
          <div class="period-card-top">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="period-badge">${p.period}</span>
              <span class="period-time">${p.time}</span>
            </div>
            <span class="retro-badge ${statusBadgeClass}">${statusBadgeText}</span>
          </div>

          <div class="period-subject-name" title="${p.subject}">
            ${p.shortSubject || p.subject}
          </div>

          <div class="period-details-grid" style="grid-template-columns: ${p.code ? 'repeat(2, 1fr)' : '1fr'};">
            <div class="period-detail-item">
              <span class="detail-label">TEACHER:</span>
              <span class="detail-value">${p.faculty || '—'}</span>
            </div>
            ${p.code ? `
              <div class="period-detail-item">
                <span class="detail-label">CODE:</span>
                <span class="detail-value" style="color:var(--accent-cyan);">${p.code}</span>
              </div>
            ` : ''}
          </div>

          ${p.options && p.options.length > 1 ? `
            <div style="margin-top:10px; padding-top:8px; border-top:1px dashed var(--border-base); display:flex; align-items:center; justify-content:space-between; gap:6px;">
              <span class="detail-label" style="color:var(--accent-gold); font-size:10px;">ELECTIVE:</span>
              <select class="elective-dropdown" data-slot="${p.slotKey}" style="background:var(--bg-surface-inset); border:1.5px solid var(--border-base); color:var(--accent-gold); font-family:var(--font-mono); font-size:10px; padding:3px 8px; border-radius:4px; outline:none; cursor:pointer; max-width:210px;">
                ${p.options.map(opt => `
                  <option value="${opt.subject}" ${opt.subject === p.subject ? 'selected' : ''}>
                    ${opt.shortSubject} (${opt.code}) • ${opt.faculty}
                  </option>
                `).join('')}
              </select>
            </div>
          ` : ''}
        `;
        grid.appendChild(pCard);
      });

      // Wire interactive elective switcher dropdowns
      grid.querySelectorAll('.elective-dropdown').forEach(sel => {
        sel.addEventListener('change', async (e) => {
          const slotKey = sel.dataset.slot;
          const chosenSubj = e.target.value;
          appState.selectedElectives = appState.selectedElectives || {};
          appState.selectedElectives[slotKey] = chosenSubj;
          await chrome.storage.local.set({ selectedElectives: appState.selectedElectives });

          if (appState.rawTimetableRows) {
            appState.timetableData = parseTimetableJson(
              appState.rawTimetableRows,
              appState.attendanceData?.subjects || [],
              appState.selectedElectives
            );
            await chrome.storage.local.set({ timetableData: appState.timetableData });
          } else if (appState.timetableData) {
            Object.keys(appState.timetableData).forEach(day => {
              appState.timetableData[day].forEach(period => {
                if (period.slotKey === slotKey && period.options) {
                  const opt = period.options.find(o => o.subject === chosenSubj);
                  if (opt) {
                    period.subject = opt.subject;
                    period.shortSubject = opt.shortSubject;
                    period.code = opt.code;
                    period.faculty = opt.faculty;
                    period.content = `${opt.shortSubject} • ${opt.faculty}`;
                  }
                }
              });
            });
            await chrome.storage.local.set({ timetableData: appState.timetableData });
          }
          updateTicker();
          renderCurrentView();
          showToast(`Elective updated to ${chosenSubj}`, 'success');
        });
      });
    }

    wrapper.appendChild(nowNextCard);
    wrapper.appendChild(dayBar);
    wrapper.appendChild(grid);
    return wrapper;
  }

  // ----------------------------------------------------------------
  // SINGLE-SUBMISSION SAFETY SHIELD MODAL
  // ----------------------------------------------------------------
  function openSafetyModal(assignment) {
    if (assignment.isOverdue) {
      showToast('Submission closed: The deadline for this assignment has passed.', 'error');
      return;
    }

    appState.activeSubmitAssignment = assignment;
    appState.selectedFile = null;

    const modalContainer = shadow.getElementById('coer-safety-modal-container');
    modalContainer.innerHTML = `
      <div id="coer-safety-modal-backdrop">
        <div class="safety-modal-box">
          <div class="safety-modal-header">
            <div class="safety-modal-title">
              <span>⚠</span> FINAL IRREVERSIBLE SUBMISSION SHIELD
            </div>
            <span class="retro-dot close" id="btn-close-safety-modal" title="Cancel"></span>
          </div>

          <div class="safety-modal-body">
            <div class="safety-alert-banner">
              <strong>CRITICAL COER POLICY WARNING:</strong> Submitting an answer on COER ERP is strictly irreversible. Once you upload your file, the portal permanently locks your record. Re-submissions, replacements, or edits are NOT allowed by the server.
            </div>

            <table class="safety-meta-table">
              <tr><td>Assignment:</td><td>${assignment.title}</td></tr>
              <tr><td>Subject:</td><td>${SUBJECT_SHORT_MAP[assignment.subject] || assignment.subject}</td></tr>
              <tr><td>Faculty:</td><td>${assignment.faculty}</td></tr>
              <tr><td>Deadline:</td><td style="color:var(--accent-gold);">${assignment.dueDate || 'Immediate'}</td></tr>
              <tr><td>Max Marks:</td><td>${assignment.maxMarks}</td></tr>
            </table>

            <!-- Drag & Drop File Picker -->
            <div class="file-dropzone" id="safety-file-dropzone">
              <input type="file" id="safety-file-input" accept=".pdf,.doc,.docx" style="display:none;">
              <div class="drop-title" id="safety-drop-title">📂 Click or Drag & Drop Solution File</div>
              <div class="drop-subtitle" id="safety-drop-sub">Supported: PDF, DOC, DOCX (Max size: 5MB)</div>
            </div>

            <!-- Mandatory Verification Checkbox -->
            <label class="safety-checkbox-label">
              <input type="checkbox" id="safety-confirm-checkbox">
              <span>I verify that this document is my complete and final answer. I understand that COER ERP will reject any re-upload attempts.</span>
            </label>
          </div>

          <div class="safety-modal-footer">
            <button class="retro-btn retro-btn-ghost retro-btn-sm" id="btn-cancel-submit">CANCEL</button>
            <button class="retro-btn retro-btn-danger" id="btn-execute-submit" disabled>
              🚨 UPLOAD & LOCK SUBMISSION
            </button>
          </div>
        </div>
      </div>
    `;

    // Wire Modal Handlers
    const backdropEl = modalContainer.querySelector('#coer-safety-modal-backdrop');
    const closeBtn = modalContainer.querySelector('#btn-close-safety-modal');
    const cancelBtn = modalContainer.querySelector('#btn-cancel-submit');
    const submitBtn = modalContainer.querySelector('#btn-execute-submit');
    const chkConfirm = modalContainer.querySelector('#safety-confirm-checkbox');
    const dropzone = modalContainer.querySelector('#safety-file-dropzone');
    const fileInput = modalContainer.querySelector('#safety-file-input');
    const dropTitle = modalContainer.querySelector('#safety-drop-title');
    const dropSub = modalContainer.querySelector('#safety-drop-sub');

    closeBtn.addEventListener('click', closeSafetyModal);
    cancelBtn.addEventListener('click', closeSafetyModal);

    dropzone.addEventListener('click', () => fileInput.click());

    // Drag-and-drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelected(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelected(e.target.files[0]);
      }
    });

    function handleFileSelected(file) {
      // Validate format
      const name = file.name;
      const ext = name.substring(name.lastIndexOf('.')).toLowerCase();
      if (!['.pdf', '.doc', '.docx'].includes(ext)) {
        showToast('Invalid format. Only .pdf, .doc, .docx supported', 'error');
        return;
      }
      // Validate size (< 5MB)
      if (file.size > 5242880) {
        showToast('File exceeds 5MB limit', 'error');
        return;
      }

      appState.selectedFile = file;
      dropTitle.innerHTML = `<span style="color:var(--accent-emerald)">✓ Selected:</span> ${file.name}`;
      dropSub.textContent = `Size: ${(file.size / 1024).toFixed(1)} KB | Format: ${ext.toUpperCase()}`;
      validateSubmitReady();
    }

    chkConfirm.addEventListener('change', validateSubmitReady);

    function validateSubmitReady() {
      const ready = !!appState.selectedFile && chkConfirm.checked;
      submitBtn.disabled = !ready;
    }

    submitBtn.addEventListener('click', async () => {
      if (!appState.selectedFile || !chkConfirm.checked) return;

      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ UPLOADING SOLUTION...';

      // Read file to Base64
      const reader = new FileReader();
      reader.onload = async function () {
        const base64Data = reader.result.split(',')[1];
        const fileName = appState.selectedFile.name.substring(0, appState.selectedFile.name.lastIndexOf('.'));
        const fileExt = appState.selectedFile.name.substring(appState.selectedFile.name.lastIndexOf('.'));

        chrome.runtime.sendMessage({
          type: 'SUBMIT_ASSIGNMENT_FILE',
          detailId: assignment.assignmentDetailId,
          fileName: fileName,
          fileExt: fileExt,
          regId: assignment.regId,
          base64Data: base64Data
        }, (res) => {
          if (res && res.success) {
            showToast('✓ Assignment uploaded successfully!', 'success');
            closeSafetyModal();
            triggerSync();
          } else {
            showToast('✕ Upload failed: ' + (res?.message || 'Server error'), 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = '🚨 UPLOAD & LOCK SUBMISSION';
          }
        });
      };
      reader.readAsDataURL(appState.selectedFile);
    });
  }

  function closeSafetyModal() {
    appState.activeSubmitAssignment = null;
    appState.selectedFile = null;
    const modalContainer = shadow.getElementById('coer-safety-modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
  }

  // ----------------------------------------------------------------
  // DOWNLOAD PIPELINE
  // ----------------------------------------------------------------
  function downloadAssignmentFile(detailId, title, defaultExt) {
    showToast(`Fetching ${title}...`, 'info');

    chrome.runtime.sendMessage({
      type: 'FETCH_ASSIGNMENT_FILE',
      detailId: detailId
    }, (res) => {
      if (res && res.success && res.base64) {
        try {
          const ext = res.ext || defaultExt || '.pdf';
          const byteCharacters = atob(res.base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const mimeType = ext.includes('pdf') ? 'application/pdf' : 'application/octet-stream';
          const blob = new Blob([byteArray], { type: mimeType });
          const blobUrl = URL.createObjectURL(blob);

          const safeTitle = title.replace(/[\\/*?:"<>|]/g, '_');
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `${safeTitle}${ext.startsWith('.') ? ext : '.' + ext}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

          showToast(`✓ Downloaded: ${safeTitle}${ext}`, 'success');
        } catch (e) {
          showToast('Failed to parse downloaded file: ' + e.message, 'error');
        }
      } else {
        showToast('File download unavailable: ' + (res?.reason || 'No response'), 'error');
      }
    });
  }

  // ----------------------------------------------------------------
  // IN-ERP COMPULSORY ATTENDANCE GATE HELPER
  // ----------------------------------------------------------------
  function checkAndInjectAttendanceGateBar() {
    const feedbackGrid = document.getElementById('gbox_tblfeedBack');
    if (feedbackGrid && !document.getElementById('coer-retro-feedback-bar')) {
      console.log('[COER OS] Detected Attendance Feedback Gate. Injecting 1-Click Auto-Rating Bar...');
      
      const bar = document.createElement('div');
      bar.id = 'coer-retro-feedback-bar';
      bar.style.cssText = `
        background: #11151e;
        border: 2px solid #fbbf24;
        color: #f8fafc;
        padding: 12px 18px;
        margin: 15px 0;
        border-radius: 6px;
        box-shadow: 4px 4px 0 #000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: 'Space Grotesk', -apple-system, sans-serif;
      `;

      bar.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:16px;">⚡</span>
          <div>
            <strong style="color:#fbbf24; font-size:13px; letter-spacing:0.05em;">COER-OS // BATCH RATING CONTROL BAR</strong>
            <div style="font-size:11px; color:#94a3b8;">Batch-rate all 14 professors in 1-click to bypass compulsory gate</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="display:flex; gap:6px;">
            <button type="button" class="coer-rate-all" data-rate="Xlnt" style="background:#10b981; color:#000; border:1.5px solid #000; padding:6px 12px; font-weight:800; border-radius:4px; cursor:pointer; box-shadow:2px 2px 0 #000;">★ All Xlnt</button>
            <button type="button" class="coer-rate-all" data-rate="Good" style="background:#06b6d4; color:#000; border:1.5px solid #000; padding:6px 12px; font-weight:800; border-radius:4px; cursor:pointer; box-shadow:2px 2px 0 #000;">All Good</button>
            <button type="button" class="coer-rate-all" data-rate="Avg"  style="background:#fbbf24; color:#000; border:1.5px solid #000; padding:6px 12px; font-weight:800; border-radius:4px; cursor:pointer; box-shadow:2px 2px 0 #000;">All Avg</button>
            <button type="button" class="coer-rate-all" data-rate="Poor" style="background:#f43f5e; color:#fff; border:1.5px solid #000; padding:6px 12px; font-weight:800; border-radius:4px; cursor:pointer; box-shadow:2px 2px 0 #000;">All Poor</button>
          </div>
          <button type="button" id="coer-save-feedback-btn" style="background:#10b981; color:#000; border:2px solid #000; padding:8px 16px; font-weight:800; border-radius:5px; cursor:pointer; box-shadow:3px 3px 0 #000;">
            💾 SAVE & UNLOCK ATTENDANCE
          </button>
        </div>
      `;

      feedbackGrid.parentNode.insertBefore(bar, feedbackGrid);

      // Event listener for rating all
      bar.querySelectorAll('.coer-rate-all').forEach(btn => {
        btn.addEventListener('click', () => {
          const rating = btn.dataset.rate;
          batchRateAllProfessors(rating);
        });
      });

      bar.querySelector('#coer-save-feedback-btn').addEventListener('click', () => {
        const btnSave = document.getElementById('btnSave');
        if (btnSave) btnSave.click();
      });
    }
  }

  function batchRateAllProfessors(ratingName) {
    if (window.$ && window.$('#tblfeedBack').length) {
      const rowIds = window.$('#tblfeedBack').jqGrid('getDataIDs') || [];
      rowIds.forEach(rId => {
        const subgrid = window.$(`#tblfeedBack_${rId}_t`);
        if (subgrid.length) {
          const radios = subgrid.find(`input[type='radio'][id$='_${ratingName}']`);
          radios.each(function () {
            this.checked = true;
            window.$(this).trigger('change');
          });
        }
      });
      showToast(`Selected "${ratingName}" for all faculty topics! Click Save to submit.`, 'success');
    }
  }

  // Periodic check for dynamic ERP subgrid renders
  setInterval(checkAndInjectAttendanceGateBar, 1500);

  // ----------------------------------------------------------------
  // TIMETABLE UTILITY HELPERS
  // ----------------------------------------------------------------
  function getTodayDayName() {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = new Date().getDay();
    // Default to Monday on weekends (COER runs Mon-Fri)
    return (d === 0 || d === 6) ? "Monday" : dayNames[d];
  }

  function getLiveLectureStatus(timetable) {
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const d = new Date().getDay();
    const isWeekday = d >= 1 && d <= 5;
    const todayName = isWeekday ? weekdays[d - 1] : "Monday";
    const periods = timetable[todayName] || [];
    
    let currentClass = { period: 'NONE', time: 'Recess', subject: isWeekday ? 'No lecture currently running' : 'Weekend (Classes resume Mon)', faculty: '—' };
    let nextClass = { period: 'END', time: '--', subject: 'Classes concluded today', faculty: '—' };

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (isWeekday) {
      for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        const match = p.time.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
        if (match) {
          const startMin = parseInt(match[1]) * 60 + parseInt(match[2]);
          const endMin = parseInt(match[3]) * 60 + parseInt(match[4]);

          if (currentMinutes >= startMin && currentMinutes <= endMin) {
            if (!p.isFree) {
              currentClass = {
                period: p.period,
                time: p.time,
                subject: p.shortSubject || p.subject,
                faculty: p.faculty
              };
            }
            // Look for next non-free class today
            for (let j = i + 1; j < periods.length; j++) {
              if (!periods[j].isFree) {
                nextClass = {
                  period: periods[j].period,
                  time: periods[j].time,
                  subject: periods[j].shortSubject || periods[j].subject,
                  faculty: periods[j].faculty
                };
                break;
              }
            }
            break;
          } else if (currentMinutes < startMin) {
            if (!p.isFree) {
              nextClass = {
                period: p.period,
                time: p.time,
                subject: p.shortSubject || p.subject,
                faculty: p.faculty
              };
              break;
            }
          }
        }
      }
    } else {
      // Weekend -> point to Monday P1
      const mon = timetable["Monday"] || [];
      const first = mon.find(p => !p.isFree);
      if (first) {
        nextClass = {
          period: `MON ${first.period}`,
          time: first.time,
          subject: first.shortSubject || first.subject,
          faculty: first.faculty
        };
      }
    }

    return { currentClass, nextClass };
  }

  function isPeriodCurrentlyActive(timeString) {
    const match = timeString.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    if (!match) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMin = parseInt(match[1]) * 60 + parseInt(match[2]);
    const endMin = parseInt(match[3]) * 60 + parseInt(match[4]);
    return currentMinutes >= startMin && currentMinutes <= endMin;
  }

  function getNextClassInfo() {
    if (!appState.timetableData) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dayIndex = now.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    // Weekend
    if (dayIndex === 0 || dayIndex === 6) {
      const mon = appState.timetableData["Monday"] || [];
      const first = mon.find(p => !p.isFree);
      return first ? { label: `MON ${first.period} (${first.time})`, subject: `${first.shortSubject || first.subject} [${first.faculty}]` } : null;
    }

    const todayName = weekdays[dayIndex - 1];
    const periods = appState.timetableData[todayName] || [];

    // Search today's schedule
    for (let i = 0; i < periods.length; i++) {
      const p = periods[i];
      const match = p.time.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
      if (match) {
        const startMin = parseInt(match[1]) * 60 + parseInt(match[2]);
        const endMin = parseInt(match[3]) * 60 + parseInt(match[4]);

        if (currentMinutes >= startMin && currentMinutes <= endMin) {
          // Current class running -> find subsequent class today
          for (let j = i + 1; j < periods.length; j++) {
            if (!periods[j].isFree) {
              return {
                label: `${periods[j].period} (${periods[j].time})`,
                subject: `${periods[j].shortSubject || periods[j].subject} [${periods[j].faculty}]`
              };
            }
          }
          break;
        } else if (currentMinutes < startMin) {
          if (!p.isFree) {
            return {
              label: `${p.period} (${p.time})`,
              subject: `${p.shortSubject || p.subject} [${p.faculty}]`
            };
          }
        }
      }
    }

    // Today's classes have finished -> find next day's first class
    const nextDayIdx = dayIndex; // If Monday (1), next day in weekdays array is Tuesday (index 1)
    if (nextDayIdx < 5) {
      const nextDayName = weekdays[nextDayIdx];
      const nextPeriods = appState.timetableData[nextDayName] || [];
      const first = nextPeriods.find(p => !p.isFree);
      if (first) {
        return {
          label: `TOMORROW ${first.period} (${first.time})`,
          subject: `${first.shortSubject || first.subject} [${first.faculty}]`
        };
      }
    } else {
      // Friday evening -> Next is Monday
      const mon = appState.timetableData["Monday"] || [];
      const first = mon.find(p => !p.isFree);
      if (first) {
        return {
          label: `MON ${first.period} (${first.time})`,
          subject: `${first.shortSubject || first.subject} [${first.faculty}]`
        };
      }
    }

    return null;
  }

  // Auto-detect student identity and sync if on an authenticated page
  async function checkAndSyncStudentSession() {
    const path = window.location.pathname.toLowerCase();
    
    // Login page helper: autofocus cursor intelligently
    if (path === '/' || path.includes('/account/login')) {
      const userInp = document.getElementById('UserName');
      const passInp = document.getElementById('Password');
      const capInp = document.getElementById('captcha');
      if (userInp && passInp && capInp) {
        if (userInp.value && passInp.value && !capInp.value) {
          capInp.focus();
        } else if (!userInp.value) {
          userInp.focus();
        }
      }
      return;
    }

    // Authenticated page session check
    const student = detectStudentContext();
    if (student.regId) {
      console.log('[COER OS] Active student session detected:', student);
      const stored = await chrome.storage.local.get(['regId', 'studentName', 'stuId', 'lastSync']);
      
      const isNewStudent = !stored.regId || stored.regId !== student.regId || !stored.studentName || !stored.stuId;
      const isStale = !stored.lastSync || (Date.now() - new Date(stored.lastSync).getTime() > 15 * 60 * 1000);

      if (isNewStudent || isStale) {
        chrome.runtime.sendMessage({
          type: 'SYNC_STUDENT_IDENTITY',
          regId: student.regId,
          stuId: student.stuId,
          studentName: student.studentName
        }, async (res) => {
          if (res && res.success) {
            await loadCachedDataAndRender();
            if (isNewStudent && student.studentName) {
              showToast(`Welcome, ${student.studentName}! ERP Synced.`, 'success');
            }
          }
        });
      }
    }
  }

  // Auto-initialize cached storage and check student session on script run
  loadCachedDataAndRender();
  checkAndSyncStudentSession();
})();
