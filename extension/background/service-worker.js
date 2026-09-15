/**
 * D-Campus - Background Service Worker (Manifest V3) (v1.4.0)
 * Handles background synchronization, API calls using native session cookies,
 * periodic alarms, and chrome.storage management.
 */

// Dynamic per-student registration ID (resolved at runtime from authenticated session)

// Alarm & Heartbeat Constants
const ALARM_SESSION_HEARTBEAT = 'COER_SESSION_HEARTBEAT';
const ALARM_PERIODIC_SYNC = 'COER_PERIODIC_SYNC';
const HEARTBEAT_INTERVAL_MINUTES = 5; // Resets IIS ASP.NET 20-min sliding expiration window
const SYNC_INTERVAL_MINUTES = 15;

/**
 * Ensures required periodic alarms are registered with Chrome.
 */
async function setupAlarms() {
  const alarms = await chrome.alarms.getAll();
  const names = alarms.map(a => a.name);

  // 1. Keep-Alive Heartbeat (every 5 minutes)
  if (!names.includes(ALARM_SESSION_HEARTBEAT)) {
    await chrome.alarms.create(ALARM_SESSION_HEARTBEAT, {
      periodInMinutes: HEARTBEAT_INTERVAL_MINUTES,
      delayInMinutes: 0.2 // Initial pulse in ~12 seconds
    });
    console.log(`[D-Campus] Registered ${ALARM_SESSION_HEARTBEAT} alarm (every ${HEARTBEAT_INTERVAL_MINUTES} min).`);
  }

  // 2. Periodic Data Synchronization (every 15 minutes)
  if (!names.includes(ALARM_PERIODIC_SYNC)) {
    await chrome.alarms.create(ALARM_PERIODIC_SYNC, {
      periodInMinutes: SYNC_INTERVAL_MINUTES,
      delayInMinutes: 1
    });
    console.log(`[D-Campus] Registered ${ALARM_PERIODIC_SYNC} alarm (every ${SYNC_INTERVAL_MINUTES} min).`);
  }
}

/**
 * Pings ERP session via /Account/GetStudentDetail with authenticated session cookies.
 * Resets the 20-minute sliding expiration window in IIS / ASP.NET MVC so the student
 * stays logged in continuously throughout the day without CAPTCHA re-prompts.
 */
async function touchSession() {
  const timestamp = new Date().toISOString();
  console.log(`[D-Campus] 💓 Heartbeat pulse triggered at ${new Date().toLocaleTimeString()}...`);

  try {
    const res = await fetch('https://erp.coeruniversity.in/Account/GetStudentDetail', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: ''
    });

    if (!res.ok) {
      console.warn(`[D-Campus] Heartbeat pulse returned HTTP ${res.status}`);
      await chrome.storage.local.set({
        sessionStatus: 'error',
        lastHeartbeat: timestamp,
        lastHeartbeatSuccess: false
      });
      return { success: false, status: res.status };
    }

    const json = await res.json();
    const list = JSON.parse(json.state || '[]');

    if (list.length > 0) {
      const s = list[0];
      const regId = String(s.RegID);
      const studentName = (s.StudentName || '').replace(/\s+/g, ' ').trim();
      const stuId = (s.StudentID || '').trim();

      const current = await chrome.storage.local.get(['heartbeatCount']);
      const nextCount = (current.heartbeatCount || 0) + 1;

      await chrome.storage.local.set({
        sessionStatus: 'active',
        lastHeartbeat: timestamp,
        lastHeartbeatSuccess: true,
        heartbeatCount: nextCount,
        regId,
        studentName,
        stuId,
        course: (s.Course || '').trim(),
        yearSem: (s.YearSem || '').trim(),
        branch: (s.Branch || '').trim(),
        section: (s.Section || '').trim()
      });

      console.log(`[D-Campus] 💓 Session kept alive for ${studentName} (${stuId}). Pulse #${nextCount}`);
      return {
        success: true,
        sessionStatus: 'active',
        studentName,
        stuId,
        regId,
        timestamp,
        heartbeatCount: nextCount
      };
    } else {
      console.log('[D-Campus] Heartbeat: No active student session (logged out / awaiting login).');
      await chrome.storage.local.set({
        sessionStatus: 'needs_login',
        lastHeartbeat: timestamp,
        lastHeartbeatSuccess: false
      });
      return { success: false, sessionStatus: 'needs_login' };
    }
  } catch (err) {
    console.warn('[D-Campus] Heartbeat network/offline exception:', err.message);
    await chrome.storage.local.set({
      sessionStatus: 'offline',
      lastHeartbeat: timestamp,
      lastHeartbeatSuccess: false,
      heartbeatError: err.message
    });
    return { success: false, error: err.message };
  }
}

// 1. Extension Lifecycle: onInstalled & onStartup
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[D-Campus] Service Worker installed/updated. Reason:', details?.reason);
  await setupAlarms();

  if (details?.reason === 'install') {
    // First-time install: queue welcome & Chai popup
    await chrome.storage.local.set({
      hasSeenChaiModal: false,
      chaiFirstInstall: true
    });
  }

  const data = await chrome.storage.local.get(['regId']);
  if (!data.regId) {
    await chrome.storage.local.set({
      lastSync: null,
      syncStatus: 'needs_login',
      sessionStatus: 'needs_login'
    });
  } else {
    // Immediate heartbeat pulse and sync if already authenticated
    await touchSession();
    try {
      await syncAllData();
    } catch (e) {
      console.warn('[D-Campus] Initial sync skipped:', e);
    }
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[D-Campus] Browser startup: verifying alarms & refreshing ERP session...');
  await setupAlarms();
  try {
    await touchSession();
  } catch (e) {
    console.warn('[D-Campus] Startup session touch error:', e);
  }
});

// 2. Alarm Listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_SESSION_HEARTBEAT) {
    console.log('[D-Campus] 💓 Session keep-alive alarm triggered...');
    await touchSession();
  } else if (alarm.name === ALARM_PERIODIC_SYNC) {
    console.log('[D-Campus] Scheduled background sync firing...');
    try {
      await syncAllData();
    } catch (err) {
      console.error('[D-Campus] Scheduled sync failed:', err);
    }
  }
});

// 3. Runtime Message Router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TRIGGER_HEARTBEAT') {
    (async () => {
      try {
        const result = await touchSession();
        sendResponse(result);
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'SYNC_STUDENT_IDENTITY') {
    (async () => {
      try {
        const { regId, stuId, studentName } = message;
        if (!regId) {
          sendResponse({ success: false, error: 'No RegID provided' });
          return;
        }
        const stored = await chrome.storage.local.get(['regId']);
        const isDifferentStudent = stored.regId && stored.regId !== regId;
        
        if (isDifferentStudent) {
          console.log(`[D-Campus] Detected student account switch: ${stored.regId} -> ${regId}. Resetting cache...`);
          await chrome.storage.local.remove([
            'attendanceData',
            'assignmentData',
            'timetableData',
            'rawTimetableRows',
            'selectedElectives'
          ]);
        }
        
        await chrome.storage.local.set({
          regId,
          stuId: stuId || null,
          studentName: studentName || null
        });
        
        const result = await syncAllData(regId);
        sendResponse({ success: true, result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'TRIGGER_SYNC') {
    (async () => {
      try {
        const result = await syncAllData(message.regId);
        sendResponse({ success: true, result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open for async response
  }
  
  if (message.type === 'GET_STORAGE_DATA') {
    (async () => {
      try {
        const data = await chrome.storage.local.get(null);
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'FETCH_ASSIGNMENT_FILE') {
    (async () => {
      try {
        const res = await fetch('https://erp.coeruniversity.in/Web_Teaching/GetAssignmentImage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: `AssignmentDetailID=${encodeURIComponent(message.detailId)}`
        });
        const json = await res.json();
        const parsed = JSON.parse(json.data || '[]');
        if (parsed.length > 0 && parsed[0].Assignment) {
          sendResponse({
            success: true,
            base64: parsed[0].Assignment,
            ext: (parsed[0].AssignmentExt || '').trim() || '.pdf',
            serialNo: (parsed[0].SerialNo || '').trim()
          });
        } else {
          sendResponse({ success: false, reason: 'File content not found on server' });
        }
      } catch (err) {
        sendResponse({ success: false, reason: err.message });
      }
    })();
    return true;
  }

  if (message.type === 'SUBMIT_ASSIGNMENT_FILE') {
    (async () => {
      try {
        const { detailId, fileName, fileExt, regId, base64Data } = message;
        // Convert base64 back to Blob
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray]);

        const formData = new FormData();
        formData.append('helpSectionImages', blob, fileName + fileExt);

        const stored = await chrome.storage.local.get(['regId']);
        const targetRegId = regId || stored.regId || '';
        const url = `https://erp.coeruniversity.in/Web_Teaching/UploadStudentAssignment?AssignmentDetailID=${encodeURIComponent(detailId)}&fileName=${encodeURIComponent(fileName)}&fileExtension=${encodeURIComponent(fileExt)}&RegID=${encodeURIComponent(targetRegId)}`;
        
        const uploadRes = await fetch(url, {
          method: 'POST',
          body: formData
        });
        const resultText = await uploadRes.text();

        // 1: success, 2: already exist
        if (resultText === '1' || resultText.includes('1')) {
          await syncAllData(targetRegId); // refresh
          sendResponse({ success: true, message: 'Answer uploaded successfully!' });
        } else if (resultText === '2' || resultText.includes('2')) {
          sendResponse({ success: false, message: 'Answer already exists for this assignment.' });
        } else {
          sendResponse({ success: false, message: `Upload response: ${resultText}` });
        }
      } catch (err) {
        sendResponse({ success: false, message: err.message });
      }
    })();
    return true;
  }
});

/**
 * Main Sync Engine: Aggregates Attendance, Assignments, Study Material & Timetable
 */
async function syncAllData(customRegId) {
  await chrome.storage.local.set({ syncStatus: 'syncing' });

  // 1. Fetch authenticated student profile directly from active session
  let profile = null;
  try {
    const profRes = await fetch('https://erp.coeruniversity.in/Account/GetStudentDetail', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: ''
    });
    if (profRes.ok) {
      const profJson = await profRes.json();
      const list = JSON.parse(profJson.state || '[]');
      if (list.length > 0) {
        const s = list[0];
        profile = {
          regId: String(s.RegID),
          studentName: (s.StudentName || '').replace(/\s+/g, ' ').trim(),
          stuId: (s.StudentID || '').trim(),
          course: (s.Course || '').trim(),
          yearSem: (s.YearSem || '').trim(),
          branch: (s.Branch || '').trim(),
          section: (s.Section || '').trim()
        };
        await chrome.storage.local.set({
          sessionStatus: 'active',
          lastHeartbeat: new Date().toISOString(),
          lastHeartbeatSuccess: true
        });
      }
    }
  } catch (e) {
    console.warn('[D-Campus] Profile fetch warning:', e);
  }

  // 2. Resolve RegID dynamically
  const stored = await chrome.storage.local.get(['regId', 'selectedElectives']);
  const regId = (customRegId && typeof customRegId === 'string' && customRegId.trim().length > 0) 
    ? customRegId.trim() 
    : (profile?.regId || stored.regId || null);

  if (!regId) {
    console.warn('[D-Campus] Cannot sync: RegID not found. Awaiting student login on erp.coeruniversity.in');
    await chrome.storage.local.set({ syncStatus: 'needs_login' });
    return { success: false, reason: 'needs_login' };
  }

  // Detect student account switch and clear cache
  if (stored.regId && stored.regId !== regId) {
    console.log(`[D-Campus] Detected account switch: ${stored.regId} -> ${regId}. Resetting cache...`);
    await chrome.storage.local.remove([
      'attendanceData',
      'assignmentData',
      'timetableData',
      'rawTimetableRows',
      'selectedElectives'
    ]);
  }

  let attendanceData = null;
  let assignmentData = null;
  let timetableData = null;
  let rawTimetableRows = null;

  // 2. Fetch Attendance API
  try {
    const attRes = await fetch('https://erp.coeruniversity.in/Web_StudentAcademic/GetSubjectDetailStudentAcademicFromLive', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: `RegID=${encodeURIComponent(regId)}`
    });

    // Check if session has expired or redirected to login
    const contentType = attRes.headers.get('content-type') || '';
    if (attRes.redirected || contentType.includes('text/html')) {
      console.warn('[D-Campus] Session appears to be expired (HTML/Redirect received).');
      await chrome.storage.local.set({ syncStatus: 'needs_login' });
      return { success: false, reason: 'session_expired' };
    }

    if (attRes.ok) {
      const json = await attRes.json();
      const rawSubjects = JSON.parse(json.state || '[]');
      const rawAvg = JSON.parse(json.data || '[]');
      
      const overall = rawAvg.length > 0 ? rawAvg[0] : null;
      const subjects = rawSubjects.map(s => {
        const total = parseInt(s.TotalLecture) || 0;
        const present = parseInt(s.TotalPresent) || 0;
        const pct = parseFloat(s.Percentage) || (total > 0 ? parseFloat(((present / total) * 100).toFixed(2)) : 0);
        return {
          subject: (s.Subject || '').trim(),
          code: (s.SubjectCode || '').trim(),
          faculty: (s.Employee || s.EMPNAME || '').replace(/\s+/g, ' ').trim(),
          totalLectures: total,
          totalPresent: present,
          percentage: pct,
          isSafe: pct >= 75,
          neededFor75: Math.max(0, Math.ceil(3 * total - 4 * present)),
          canBunk: pct >= 75 ? Math.max(0, Math.floor((4 * present - 3 * total) / 3)) : 0
        };
      });

      const overallTotal = overall ? parseInt(overall.TotalLecture) : 0;
      const overallPresent = overall ? parseInt(overall.TotalPresent) : 0;
      const overallPct = overall ? parseFloat(overall.TotalPercentage) : 0;
      const overallSafe = overallPct >= 75;

      attendanceData = {
        overallPercentage: overallPct,
        totalLectures: overallTotal,
        totalPresent: overallPresent,
        dateFrom: overall ? overall.DateFrom : null,
        dateTo: overall ? overall.DateTo : null,
        isSafe: overallSafe,
        neededFor75: Math.max(0, Math.ceil(3 * overallTotal - 4 * overallPresent)),
        canBunk: overallSafe ? Math.max(0, Math.floor((4 * overallPresent - 3 * overallTotal) / 3)) : 0,
        subjects
      };
    }
  } catch (e) {
    console.warn('[D-Campus] Attendance sync warning:', e);
  }

  // 3. Fetch Assignments & Study Material API
  try {
    const asgRes = await fetch('https://erp.coeruniversity.in/Web_StudentAcademic/GetStudentAssignment', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: `RegID=${encodeURIComponent(regId)}`
    });
    if (asgRes.ok) {
      const json = await asgRes.json();
      const rawList = JSON.parse(json.state || '[]');
      
      const assignments = [];
      const studyMaterials = [];

      rawList.forEach((item, index) => {
        const isAssignment = item.Assignmenttype === 'Assignment' || item.Assignmenttype === 'Tutorial' || item.Assignmenttype === 'Quiz' || item.Assignmenttype === 'Class Test';
        
        // Parse due date DD/MM/YYYY into sortable Date
        let dueDateObj = null;
        if (item.DATETO) {
          const parts = item.DATETO.split('/');
          if (parts.length === 3) {
            dueDateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          }
        }

        const isOverdue = String(item.DateTimeValidation) === '2';

        const normalized = {
          index: index + 1,
          type: item.Assignmenttype,
          title: (item.ASSIGNMENTSUBJECT || '').trim(),
          subject: (item.CLASSSUBJECT || '').trim(),
          faculty: (item.EMPLOYEENAME || '').replace(/\s+/g, ' ').trim(),
          givenDate: item.DATEFROM,
          dueDate: item.DATETO,
          dueDateTimestamp: dueDateObj ? dueDateObj.getTime() : 0,
          maxMarks: item.MaxMarks !== null ? item.MaxMarks : '0',
          obtainedMarks: item.Obtainmarks || 'NA',
          extension: (item.Extension || '').trim() || '.pdf',
          assignId: item.AssignID,
          assignmentDetailId: item.AssignmentDetailID,
          empId: item.EMPID,
          subjectId: item.SUBJECTID,
          keywords: item.Keywords || '',
          references: item.References || '',
          validationStatus: item.DateTimeValidation, // 0 = active, 2 = passed
          isOverdue: isOverdue
        };

        if (item.Assignmenttype === 'Study Material') {
          studyMaterials.push(normalized);
        } else {
          assignments.push(normalized);
        }
      });

      // Sort assignments by nearest deadline first
      assignments.sort((a, b) => {
        if (!a.dueDateTimestamp) return 1;
        if (!b.dueDateTimestamp) return -1;
        return a.dueDateTimestamp - b.dueDateTimestamp;
      });

      const activeAssignments = assignments.filter(a => !a.isOverdue);

      assignmentData = {
        assignments,
        studyMaterials,
        totalAssignments: assignments.length,
        activeAssignmentsCount: activeAssignments.length,
        overdueAssignmentsCount: assignments.length - activeAssignments.length,
        totalStudyMaterials: studyMaterials.length
      };
    }
  } catch (e) {
    console.warn('[D-Campus] Assignment sync warning:', e);
  }

  // 4. Fetch Timetable API
  try {
    const ttRes = await fetch('https://erp.coeruniversity.in/Web_StudentAcademic/FillStudentTimeTable', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: `RegID=${encodeURIComponent(regId)}`
    });
    if (ttRes.ok) {
      const json = await ttRes.json();
      rawTimetableRows = JSON.parse(json.state || '[]');
      const enrolled = attendanceData?.subjects || [];
      timetableData = parseTimetableJson(rawTimetableRows, enrolled, stored.selectedElectives || {});
    }
  } catch (e) {
    console.warn('[D-Campus] Timetable sync warning:', e);
  }

  // 5. Store in local storage
  const updates = {
    regId,
    syncStatus: 'synced',
    lastSync: new Date().toISOString()
  };
  if (profile) {
    updates.studentName = profile.studentName;
    updates.stuId = profile.stuId;
    updates.studentProfile = profile;
  }
  if (attendanceData) updates.attendanceData = attendanceData;
  if (assignmentData) updates.assignmentData = assignmentData;
  if (timetableData) updates.timetableData = timetableData;
  if (rawTimetableRows) updates.rawTimetableRows = rawTimetableRows;

  await chrome.storage.local.set(updates);

  // 6. Update action badge with attendance %
  if (attendanceData && attendanceData.overallPercentage !== undefined) {
    const pctText = `${Math.round(attendanceData.overallPercentage)}%`;
    await chrome.action.setBadgeText({ text: pctText });
    await chrome.action.setBadgeBackgroundColor({
      color: attendanceData.overallPercentage >= 75 ? '#10b981' : '#f43f5e'
    });
  }

  console.log('[D-Campus] Sync complete:', {
    attendance: !!attendanceData,
    assignments: assignmentData?.totalAssignments,
    studyMaterials: assignmentData?.totalStudyMaterials,
    timetable: !!timetableData
  });

  return updates;
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

/**
 * Parses Timetable rows from FillStudentTimeTable JSON response
 * Only processes Monday - Friday (COER runs Mon-Fri)
 * Supports dynamic multi-elective selection with zero hardcoding
 */
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
