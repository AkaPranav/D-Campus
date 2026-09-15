/**
 * D-Campus - iCalendar (.ics) Generator Utility (v1.4.0)
 * Generates RFC 5545 compliant .ics files for Google Calendar, Apple Calendar, Outlook.
 */
(function (global) {
  'use strict';

  function escapeIcsText(str) {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function getSemesterEndDate(now = new Date()) {
    const currentMonth = now.getMonth(); // 0 = Jan, 11 = Dec
    const currentYear = now.getFullYear();
    // Odd semester (July - Dec): ends Dec 31
    // Even semester (Jan - June): ends June 30
    if (currentMonth < 6) {
      return {
        year: currentYear,
        month: 6, // June
        day: 30,
        label: `June 30, ${currentYear} (Even Semester)`
      };
    } else {
      return {
        year: currentYear,
        month: 12, // Dec
        day: 31,
        label: `December 31, ${currentYear} (Odd Semester)`
      };
    }
  }

  function countScheduledClasses(timetableData) {
    if (!timetableData) return 0;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    let count = 0;
    days.forEach(day => {
      const periods = timetableData[day] || [];
      periods.forEach(p => {
        if (!p.isFree) count++;
      });
    });
    return count;
  }

  function generateIcs(timetableData, options = {}) {
    const reminderMin = options.reminderMin !== undefined ? parseInt(options.reminderMin, 10) : 10;
    const studentName = options.studentName || 'Student';
    const studentId = options.studentId || '';

    const daysMap = {
      'Monday': { offset: 1, byDay: 'MO' },
      'Tuesday': { offset: 2, byDay: 'TU' },
      'Wednesday': { offset: 3, byDay: 'WE' },
      'Thursday': { offset: 4, byDay: 'TH' },
      'Friday': { offset: 5, byDay: 'FR' }
    };

    const now = new Date();
    const d = now.getDay();
    // Calculate Monday of the current reference week
    const distToMon = (d === 0 ? -6 : 1 - d);
    const mon = new Date(now);
    mon.setDate(now.getDate() + distToMon);

    const semEnd = getSemesterEndDate(now);
    // Until string formatted as UTC: YYYYMMDDTHHmmssZ
    // 18:29:59Z corresponds to 23:59:59 IST
    const untilStr = `${semEnd.year}${String(semEnd.month).padStart(2, '0')}${String(semEnd.day).padStart(2, '0')}T182959Z`;
    const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//D-Campus//Timetable v1.4.0//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:D-Campus Timetable - ${escapeIcsText(studentName)}`,
      'X-WR-TIMEZONE:Asia/Kolkata',
      'BEGIN:VTIMEZONE',
      'TZID:Asia/Kolkata',
      'X-LIC-LOCATION:Asia/Kolkata',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0530',
      'TZOFFSETTO:+0530',
      'TZNAME:IST',
      'DTSTART:19700101T000000',
      'END:STANDARD',
      'END:VTIMEZONE'
    ];

    let totalClasses = 0;

    for (const [dayName, dayMeta] of Object.entries(daysMap)) {
      const periods = timetableData[dayName] || [];
      const classDate = new Date(mon);
      classDate.setDate(mon.getDate() + (dayMeta.offset - 1));

      const yyyymmdd = classDate.getFullYear() +
        String(classDate.getMonth() + 1).padStart(2, '0') +
        String(classDate.getDate()).padStart(2, '0');

      periods.forEach(p => {
        if (p.isFree) return;
        const match = (p.time || '').match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
        if (!match) return;

        totalClasses++;
        const dtstart = `${yyyymmdd}T${match[1]}${match[2]}00`;
        const dtend = `${yyyymmdd}T${match[3]}${match[4]}00`;
        const uid = `${yyyymmdd}T${match[1]}${match[2]}00-${dayMeta.byDay}-${p.period || 'P'}-${(p.code || 'CLS').replace(/[^a-zA-Z0-9]/g, '')}@d-campus`;

        const summary = `${p.shortSubject || p.subject}${p.code ? ' (' + p.code + ')' : ''}`;
        const description = [
          `Period: ${p.period} (${p.time})`,
          `Subject: ${p.subject}`,
          `Faculty: ${p.faculty || '—'}`,
          p.code ? `Course Code: ${p.code}` : '',
          studentName ? `Student: ${studentName}${studentId ? ' (' + studentId + ')' : ''}` : '',
          'COER University ERP Sync'
        ].filter(Boolean).join('\n');

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:${uid}`);
        lines.push(`DTSTAMP:${dtstamp}`);
        lines.push(`SUMMARY:${escapeIcsText(summary)}`);
        lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
        lines.push('LOCATION:COER University');
        lines.push(`DTSTART;TZID=Asia/Kolkata:${dtstart}`);
        lines.push(`DTEND;TZID=Asia/Kolkata:${dtend}`);
        lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayMeta.byDay};UNTIL=${untilStr}`);

        if (reminderMin > 0) {
          lines.push('BEGIN:VALARM');
          lines.push('ACTION:DISPLAY');
          lines.push(`DESCRIPTION:Upcoming Class: ${escapeIcsText(summary)}`);
          lines.push(`TRIGGER:-PT${reminderMin}M`);
          lines.push('END:VALARM');
        }

        lines.push('END:VEVENT');
      });
    }

    lines.push('END:VCALENDAR');
    return {
      icsText: lines.join('\r\n'),
      totalClasses,
      semesterEndLabel: semEnd.label
    };
  }

  function downloadIcsFile(icsText, filename) {
    const cleanName = filename || 'COER_Timetable.ics';
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', cleanName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const GOOGLE_CALENDAR_IMPORT_URL = 'https://calendar.google.com/calendar/u/0/r/settings/export';

  global.CoerCalendar = {
    generateIcs,
    downloadIcsFile,
    getSemesterEndDate,
    countScheduledClasses,
    GOOGLE_CALENDAR_IMPORT_URL
  };
})(typeof window !== 'undefined' ? window : this);
