/**
 * COER Retro OS - Popup Script
 * Reads local storage data, formats KPI cards, and dispatches actions.
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadAndRenderData();

  // Wire Sync button
  const syncBtn = document.getElementById('btn-sync-now');
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncBtn.textContent = '⏳ SYNCING...';
    document.getElementById('sync-status-text').textContent = 'STATUS: SYNCING...';

    chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' }, async (response) => {
      syncBtn.disabled = false;
      syncBtn.textContent = '⚡ SYNC';
      document.getElementById('sync-status-text').textContent = response?.success ? 'STATUS: SYNCED' : 'STATUS: ERROR';
      await loadAndRenderData();
    });
  });

  // Wire Open ERP button
  const openErpBtn = document.getElementById('btn-open-erp');
  openErpBtn.addEventListener('click', async () => {
    const erpUrl = 'https://erp.coeruniversity.in/Account/Cyborg_StudentMenu';
    const tabs = await chrome.tabs.query({ url: '*://erp.coeruniversity.in/*' });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { active: true });
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url: erpUrl });
    }
  });

  // Wire Calendar Export buttons
  const calBtn = document.getElementById('btn-export-cal');
  const calMiniBtn = document.getElementById('btn-export-cal-mini');

  async function handleCalendarExport(openGoogleCal = true) {
    const data = await chrome.storage.local.get(['timetableData', 'studentName', 'stuId', 'regId']);
    if (!data.timetableData || !window.CoerCalendar) {
      alert('Timetable data not found. Please log in or sync with ERP first.');
      return;
    }

    const cleanName = (data.studentName || 'COER').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `COER_Timetable_${cleanName}.ics`;

    const res = window.CoerCalendar.generateIcs(data.timetableData, {
      studentName: data.studentName,
      studentId: data.stuId || data.regId,
      reminderMin: 10
    });

    if (res.totalClasses === 0) {
      alert('No active scheduled classes found in timetable.');
      return;
    }

    window.CoerCalendar.downloadIcsFile(res.icsText, filename);

    const statusEl = document.getElementById('sync-status-text');
    if (statusEl) {
      statusEl.textContent = `EXPORTED ${res.totalClasses} CLASSES!`;
      setTimeout(() => { statusEl.textContent = 'STATUS: SYNCED'; }, 4000);
    }

    if (openGoogleCal) {
      chrome.tabs.create({ url: window.CoerCalendar.GOOGLE_CALENDAR_IMPORT_URL });
    }
  }

  if (calBtn) calBtn.addEventListener('click', () => handleCalendarExport(true));
  if (calMiniBtn) calMiniBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    handleCalendarExport(false);
  });
});

async function loadAndRenderData() {
  const data = await chrome.storage.local.get([
    'regId', 'studentName', 'stuId', 'syncStatus',
    'attendanceData', 'assignmentData', 'timetableData', 'lastSync'
  ]);

  // 1. Render Student Identity & Connection Status
  const studentTag = document.getElementById('student-tag');
  const syncStatusText = document.getElementById('sync-status-text');

  if (data.regId && data.studentName) {
    if (studentTag) studentTag.textContent = `${data.studentName} (${data.stuId || data.regId})`;
    if (syncStatusText) syncStatusText.textContent = data.syncStatus === 'syncing' ? 'STATUS: SYNCING...' : 'STATUS: SYNCED';
  } else if (data.regId) {
    if (studentTag) studentTag.textContent = `ID: ${data.stuId || data.regId}`;
    if (syncStatusText) syncStatusText.textContent = 'STATUS: SYNCED';
  } else {
    if (studentTag) studentTag.textContent = 'AWAITING LOGIN';
    if (syncStatusText) syncStatusText.textContent = 'STATUS: LOGIN REQUIRED';
  }

  // 2. Render Login Required fallback if not authenticated
  if (!data.regId || data.syncStatus === 'needs_login') {
    document.getElementById('att-pct-val').textContent = '--';
    const badge = document.getElementById('att-badge');
    if (badge) {
      badge.textContent = 'AUTH REQ';
      badge.className = 'mini-badge warning';
    }
    document.getElementById('att-total-lec').textContent = '--';
    document.getElementById('att-pres-lec').textContent = '--';
    document.getElementById('att-target-text').textContent = 'Sign in on ERP';
    document.getElementById('tt-now-val').textContent = 'Please log in at erp.coeruniversity.in';
    document.getElementById('tt-next-val').textContent = 'Click OPEN ERP below to sign in';
    const asgList = document.getElementById('asg-mini-list');
    if (asgList) asgList.innerHTML = '<div class="asg-empty" style="color:var(--accent-gold);">Sign in to ERP to view your assignments.</div>';
    return;
  }

  // 3. Render Attendance
  if (data.attendanceData) {
    const att = data.attendanceData;
    const pct = att.overallPercentage !== undefined ? att.overallPercentage : 0;
    const isSafe = pct >= 75;

    document.getElementById('att-pct-val').textContent = `${pct}%`;
    document.getElementById('att-pct-val').style.color = isSafe ? 'var(--accent-emerald)' : 'var(--accent-rose)';

    const badge = document.getElementById('att-badge');
    badge.textContent = isSafe ? 'ON TRACK' : 'CRITICAL';
    badge.className = `mini-badge ${isSafe ? 'safe' : 'danger'}`;

    document.getElementById('att-total-lec').textContent = `${att.totalLectures} Classes`;
    document.getElementById('att-pres-lec').textContent = `${att.totalPresent} Present`;

    const needed = Math.max(0, Math.ceil(3 * att.totalLectures - 4 * att.totalPresent));
    document.getElementById('att-target-text').textContent = isSafe ? 'Target achieved ✓' : `Need: +${needed} classes`;
  }

  // 3. Render Timetable
  if (data.timetableData) {
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const d = new Date().getDay();
    const isWeekday = d >= 1 && d <= 5;
    const today = isWeekday ? weekdays[d - 1] : "Monday";

    document.getElementById('today-name-badge').textContent = isWeekday ? today.toUpperCase() : 'WEEKEND (MON)';

    const periods = data.timetableData[today] || [];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let activePeriod = null;
    let nextPeriod = null;

    if (isWeekday) {
      for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        const match = p.time.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
        if (match) {
          const startMin = parseInt(match[1]) * 60 + parseInt(match[2]);
          const endMin = parseInt(match[3]) * 60 + parseInt(match[4]);
          if (currentMinutes >= startMin && currentMinutes <= endMin) {
            if (!p.isFree) activePeriod = p;
            for (let j = i + 1; j < periods.length; j++) {
              if (!periods[j].isFree) {
                nextPeriod = periods[j];
                break;
              }
            }
            break;
          } else if (currentMinutes < startMin) {
            if (!p.isFree) {
              nextPeriod = p;
              break;
            }
          }
        }
      }

      // If no upcoming class today, look for tomorrow or Monday
      if (!nextPeriod) {
        const nextDayIdx = d; // If Mon (1), next day in weekdays array is index 1 (Tue)
        if (nextDayIdx < 5) {
          const nextDayPeriods = data.timetableData[weekdays[nextDayIdx]] || [];
          nextPeriod = nextDayPeriods.find(p => !p.isFree);
          if (nextPeriod) nextPeriod.isTomorrow = true;
        } else {
          const monPeriods = data.timetableData["Monday"] || [];
          nextPeriod = monPeriods.find(p => !p.isFree);
          if (nextPeriod) nextPeriod.isMonday = true;
        }
      }
    } else {
      const monPeriods = data.timetableData["Monday"] || [];
      nextPeriod = monPeriods.find(p => !p.isFree);
      if (nextPeriod) nextPeriod.isMonday = true;
    }

    if (activePeriod) {
      document.getElementById('tt-now-val').textContent = `${activePeriod.period}: ${activePeriod.shortSubject || activePeriod.subject} (👤 ${activePeriod.faculty})`;
    } else {
      document.getElementById('tt-now-val').textContent = isWeekday ? 'No class running right now' : 'Weekend - No classes today';
    }

    if (nextPeriod) {
      const prefix = nextPeriod.isTomorrow ? 'Tomorrow ' : (nextPeriod.isMonday ? 'Mon ' : '');
      document.getElementById('tt-next-val').textContent = `${prefix}${nextPeriod.period} (${nextPeriod.time}): ${nextPeriod.shortSubject || nextPeriod.subject} (👤 ${nextPeriod.faculty})`;
    } else {
      document.getElementById('tt-next-val').textContent = 'Classes concluded for today';
    }
  }

  // 4. Render Priority Assignments (Active & Due Soonest)
  if (data.assignmentData && data.assignmentData.assignments) {
    const asgs = data.assignmentData.assignments;
    const activeAssignments = asgs.filter(a => !a.isOverdue);
    const badge = document.getElementById('asg-count-badge');
    badge.textContent = `${activeAssignments.length} DUE`;

    const miniList = document.getElementById('asg-mini-list');
    miniList.innerHTML = '';

    // Nearest due active assignments first
    const displayItems = activeAssignments.length > 0 ? activeAssignments.slice(0, 3) : asgs.slice(0, 3);
    if (displayItems.length === 0) {
      miniList.innerHTML = '<div class="asg-empty">No assignments pending.</div>';
    } else {
      displayItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'asg-item-row';
        row.innerHTML = `
          <span class="asg-title" title="${item.title}">${item.title}</span>
          <span class="asg-due" style="color:${item.isOverdue ? 'var(--accent-rose)' : 'var(--accent-gold)'}; font-weight:700;">
            ${item.isOverdue ? 'CLOSED' : item.dueDate || 'Immediate'}
          </span>
        `;
        miniList.appendChild(row);
      });
    }
  }
}
