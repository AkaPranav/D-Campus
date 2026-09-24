/**
 * D-Campus - Popup Script (v1.4.0)
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

  // Wire Chai Support Modal in popup
  const popupChaiBtn = document.getElementById('btn-popup-chai');
  const popupChaiModal = document.getElementById('popup-chai-modal');
  const closePopupChaiBtn = document.getElementById('btn-close-popup-chai');
  const copyPopupUpiBtn = document.getElementById('btn-copy-popup-upi');
  const upiId = '6396950805@slc';

  if (popupChaiBtn && popupChaiModal) {
    popupChaiBtn.addEventListener('click', () => {
      popupChaiModal.style.display = 'flex';
    });

    if (closePopupChaiBtn) {
      closePopupChaiBtn.addEventListener('click', () => {
        popupChaiModal.style.display = 'none';
      });
    }

    popupChaiModal.addEventListener('click', (e) => {
      if (e.target === popupChaiModal) {
        popupChaiModal.style.display = 'none';
      }
    });

    if (copyPopupUpiBtn) {
      copyPopupUpiBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(upiId);
          copyPopupUpiBtn.innerText = '✓ COPIED';
          setTimeout(() => { copyPopupUpiBtn.innerText = '📋 COPY'; }, 2500);
        } catch (e) {
          prompt('UPI ID:', upiId);
        }
      });
    }
  }

  // Wire Calendar Export buttons
  const calBtn = document.getElementById('btn-export-cal');
  const calMiniBtn = document.getElementById('btn-export-cal-mini');

  async function handleCalendarExport(openGoogleCal = true) {
    const data = await chrome.storage.local.get(['timetableData', 'studentName', 'stuId', 'regId']);
    if (!data.timetableData || !window.CoerCalendar) {
      alert('Timetable data not found. Please log in or sync first.');
      return;
    }

    const cleanName = (data.studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Timetable_${cleanName}.ics`;

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

  // Wire manual Heartbeat pulse on clicking heartbeat bar
  const hbBar = document.getElementById('heartbeat-bar');
  if (hbBar) {
    hbBar.addEventListener('click', () => {
      const hbBadge = document.getElementById('hb-badge');
      const hbTime = document.getElementById('hb-time');
      if (hbBadge) hbBadge.textContent = 'PULSING...';
      if (hbTime) hbTime.textContent = 'Touching session...';

      chrome.runtime.sendMessage({ type: 'TRIGGER_HEARTBEAT' }, async () => {
        await loadAndRenderData();
      });
    });
  }

  // ==================== Auto-Login Settings & Header Toggle ====================
  const autologinCard = document.getElementById('card-autologin');
  const autologinHeader = document.getElementById('autologin-accordion-header');
  const userInput = document.getElementById('erp-user');
  const passInput = document.getElementById('erp-pass');
  const autoLoginToggle = document.getElementById('auto-login-toggle');
  const passEyeBtn = document.getElementById('btn-toggle-pass');
  const saveStatus = document.getElementById('save-status');

  // Load stored credentials & accordion state
  const saved = await chrome.storage.local.get(['erp_user', 'erp_password', 'auto_login_enabled', 'autologin_open']);
  if (userInput) userInput.value = saved.erp_user || '';
  if (passInput) passInput.value = saved.erp_password || '';
  if (autoLoginToggle) autoLoginToggle.checked = !!saved.auto_login_enabled;

  // Set initial accordion open/close state (default open for easy credential access)
  const shouldBeOpen = saved.autologin_open !== undefined
    ? !!saved.autologin_open
    : true;

  if (autologinCard && shouldBeOpen) {
    autologinCard.classList.add('open');
  }

  if (autologinHeader && autologinCard) {
    autologinHeader.addEventListener('click', (e) => {
      // Don't toggle accordion if clicking on the toggle switch or its label
      if (e.target.closest('.retro-toggle') || e.target.closest('#autologin-toggle-container')) {
        return;
      }
      const isOpen = autologinCard.classList.toggle('open');
      chrome.storage.local.set({ autologin_open: isOpen });
      if (isOpen) {
        setTimeout(() => {
          autologinCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
      }
    });
    autologinHeader.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        autologinHeader.click();
      }
    });
  }

  // Toggle password visibility
  if (passEyeBtn) {
    passEyeBtn.addEventListener('click', () => {
      const isHidden = passInput.type === 'password';
      passInput.type = isHidden ? 'text' : 'password';
      passEyeBtn.textContent = isHidden ? '🙈' : '👁';
    });
  }

  // Save credentials on change
  let saveTimer = null;
  const saveCredentials = async (showToast = true) => {
    const creds = {
      erp_user: (userInput ? userInput.value : '').trim(),
      erp_password: passInput ? passInput.value : '',
      auto_login_enabled: autoLoginToggle ? autoLoginToggle.checked : false
    };
    await chrome.storage.local.set(creds);

    // Notify active ERP tabs immediately so live page auto-fills/solves without reload
    try {
      chrome.tabs.query({ url: '*://erp.coeruniversity.in/*' }, (tabs) => {
        if (tabs && tabs.length) {
          tabs.forEach(t => {
            chrome.tabs.sendMessage(t.id, { type: 'CREDENTIALS_UPDATED', creds }).catch(() => {});
          });
        }
      });
    } catch (e) {}

    if (saveStatus) {
      if (creds.erp_user && creds.erp_password) {
        saveStatus.textContent = creds.auto_login_enabled ? '✓ SAVED — ARMED' : '✓ SAVED (AUTO-LOGIN OFF)';
        saveStatus.className = 'save-status saved';
      } else {
        saveStatus.textContent = creds.auto_login_enabled ? '⚠ ENTER STUDENT ID & PASS' : '';
        saveStatus.className = 'save-status warn';
      }
      if (showToast) {
        setTimeout(() => {
          if (saveStatus.textContent.includes('✓') || saveStatus.textContent.includes('⚠')) {
            saveStatus.textContent = creds.auto_login_enabled && creds.erp_user && creds.erp_password
              ? 'STATUS: AUTO-LOGIN ARMED' : (creds.erp_user && creds.erp_password ? 'STATUS: AUTO-LOGIN OFF' : '');
          }
        }, 2600);
      }
    }
  };

  if (userInput && passInput) {
    const scheduleSave = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveCredentials(true), 200);
    };
    userInput.addEventListener('input', scheduleSave);
    passInput.addEventListener('input', scheduleSave);
    userInput.addEventListener('change', () => saveCredentials(true));
    passInput.addEventListener('change', () => saveCredentials(true));
    userInput.addEventListener('blur', () => saveCredentials(true));
    passInput.addEventListener('blur', () => saveCredentials(true));
  }
  if (autoLoginToggle) {
    autoLoginToggle.addEventListener('change', () => saveCredentials(true));
  }

  window.addEventListener('beforeunload', () => {
    clearTimeout(saveTimer);
    saveCredentials(false);
  });

  // Initialize save-status display on open
  if (saveStatus && saved.erp_user && saved.erp_password) {
    saveStatus.textContent = saved.auto_login_enabled ? 'STATUS: AUTO-LOGIN ARMED' : 'STATUS: AUTO-LOGIN OFF';
    saveStatus.className = 'save-status saved';
  }
});

async function loadAndRenderData() {
  const data = await chrome.storage.local.get([
    'regId', 'studentName', 'stuId', 'syncStatus',
    'attendanceData', 'assignmentData', 'timetableData', 'lastSync',
    'sessionStatus', 'lastHeartbeat', 'heartbeatCount'
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

  // Render Session Keep-Alive Heartbeat Status
  const hbBadge = document.getElementById('hb-badge');
  const hbTime = document.getElementById('hb-time');
  const hbIcon = document.getElementById('hb-icon');

  if (data.sessionStatus === 'active') {
    if (hbBadge) {
      hbBadge.textContent = 'ALIVE (5m)';
      hbBadge.className = 'hb-badge active';
    }
    if (hbIcon) hbIcon.textContent = '💓';
    if (hbTime) {
      if (data.lastHeartbeat) {
        const diffSec = Math.max(0, Math.round((Date.now() - new Date(data.lastHeartbeat).getTime()) / 1000));
        let timeStr = 'Just now';
        if (diffSec >= 60) {
          timeStr = `${Math.floor(diffSec / 60)}m ago`;
        }
        const pulseInfo = data.heartbeatCount ? ` #${data.heartbeatCount}` : '';
        hbTime.textContent = `Pulse${pulseInfo}: ${timeStr}`;
      } else {
        hbTime.textContent = 'Pulse: OK';
      }
    }
  } else if (data.sessionStatus === 'needs_login' || !data.regId) {
    if (hbBadge) {
      hbBadge.textContent = 'LOGIN REQ';
      hbBadge.className = 'hb-badge needs-login';
    }
    if (hbIcon) hbIcon.textContent = '🔒';
    if (hbTime) hbTime.textContent = 'Awaiting login';
  } else {
    if (hbBadge) {
      hbBadge.textContent = 'EXPIRED';
      hbBadge.className = 'hb-badge expired';
    }
    if (hbIcon) hbIcon.textContent = '⚠️';
    if (hbTime) hbTime.textContent = 'Session timed out';
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

    if (isSafe) {
      const canBunk = Math.max(0, Math.floor((4 * att.totalPresent - 3 * att.totalLectures) / 3));
      if (canBunk > 0) {
        document.getElementById('att-target-text').textContent = `Can bunk: ${canBunk} class${canBunk > 1 ? 'es' : ''} ✓`;
        document.getElementById('att-target-text').style.color = 'var(--accent-emerald)';
      } else {
        document.getElementById('att-target-text').textContent = 'Safe margin: 0 (75% edge)';
        document.getElementById('att-target-text').style.color = 'var(--accent-gold)';
      }
    } else {
      const needed = Math.max(0, Math.ceil(3 * att.totalLectures - 4 * att.totalPresent));
      document.getElementById('att-target-text').textContent = `Need: +${needed} classes`;
      document.getElementById('att-target-text').style.color = 'var(--accent-gold)';
    }
  }

  // 3. Render Timetable
  if (data.timetableData) {
    sanitizeTimetableData(data.timetableData);
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const actualDayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const d = new Date().getDay();
    const isWeekday = d >= 1 && d <= 5;
    const today = isWeekday ? weekdays[d - 1] : "Monday";

    document.getElementById('today-name-badge').textContent = isWeekday ? today.toUpperCase() : `WEEKEND (${actualDayNames[d].toUpperCase().slice(0, 3)}) • OFF`;

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

    if (activePeriod && isWeekday) {
      const subTag = activePeriod.isSubstituted ? ' [⚡ SUB]' : '';
      document.getElementById('tt-now-val').textContent = `${activePeriod.period}: ${activePeriod.shortSubject || activePeriod.subject} (👤 ${cleanFacultyName(activePeriod.faculty)}${subTag})`;
    } else {
      document.getElementById('tt-now-val').textContent = isWeekday ? 'No class running right now' : `Weekend (${actualDayNames[d]}) — Campus closed`;
    }

    if (nextPeriod) {
      const prefix = !isWeekday ? 'Mon ' : (nextPeriod.isTomorrow ? 'Tomorrow ' : (nextPeriod.isMonday ? 'Mon ' : ''));
      const subTag = nextPeriod.isSubstituted ? ' [⚡ SUB]' : '';
      document.getElementById('tt-next-val').textContent = `${prefix}${nextPeriod.period} (${nextPeriod.time}): ${nextPeriod.shortSubject || nextPeriod.subject} (👤 ${cleanFacultyName(nextPeriod.faculty)}${subTag})`;
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

function sanitizeTimetableData(ttData) {
  if (!ttData || typeof ttData !== 'object') return;
  for (const day of Object.keys(ttData)) {
    if (Array.isArray(ttData[day])) {
      for (const period of ttData[day]) {
        if (period.faculty) {
          const rawFac = String(period.faculty);
          if (/lecture\s+substituted|substituted|<div\s+style="color:\s*red|\[sub:|\(sub:/i.test(rawFac)) {
            period.isSubstituted = true;
            if (rawFac.includes(':')) {
              const orig = cleanFacultyName(rawFac.split(':')[0]);
              if (orig && orig !== cleanFacultyName(rawFac)) {
                period.originalFaculty = orig;
              }
            }
          }
          period.faculty = cleanFacultyName(period.faculty);
        }
        if (period.content && period.content.includes('•')) {
          period.content = `${period.shortSubject || period.subject} • ${period.faculty}`;
        }
        if (Array.isArray(period.options)) {
          for (const opt of period.options) {
            if (opt.faculty) {
              if (/lecture\s+substituted|substituted|<div\s+style="color:\s*red|\[sub:|\(sub:/i.test(opt.faculty)) {
                opt.isSubstituted = true;
              }
              opt.faculty = cleanFacultyName(opt.faculty);
            }
          }
        }
      }
    }
  }
}

function cleanFacultyName(raw) {
  if (!raw) return "—";

  // 1. Check for any variation of substitution notice
  const subPatterns = [
    /Lecture\s+Substituted(?:[\s\S]*?,\s*|\s+(?:by\s+)?|\s*-\s*|\s*:\s*)([^<:]+)/i,
    /Substituted\s+(?:by\s+)?([^<:]+)/i,
    /[(\[]?\s*(?:Sub|Substitute|Substitution)\s*:\s*([^)\],<:]+)[)\]]?/i
  ];

  for (const pat of subPatterns) {
    const match = raw.match(pat);
    if (match && match[1]) {
      let name = match[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .replace(/[;,.\])]+$/, '')
        .replace(/^[(\[]+/, '')
        .replace(/^[-–—\s]+/, '')
        .replace(/^by\s+/i, '')
        .trim();
      if (name && name.length > 1 && !name.toLowerCase().includes('lecture')) {
        return name;
      }
    }
  }

  // 2. Strip all HTML tags and entities
  let cleaned = raw
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. If there is a colon with extra text after it
  if (cleaned.includes(':')) {
    cleaned = cleaned.split(':')[0].trim();
  }

  // 4. Strip any cached "(Sub: ...)" or "[Sub: ...]" label
  cleaned = cleaned.replace(/\s*[(\[]\s*Sub\s*:.*?[)\]]/gi, '').trim();

  return cleaned || "—";
}
