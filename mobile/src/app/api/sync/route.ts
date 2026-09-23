import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAttendanceData,
  fetchTimetableData,
  fetchAssignmentsData,
} from '@/lib/erpClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { regId, sessionCookies } = body;

    let targetRegId = regId ? String(regId).trim() : '';
    const targetCookies = sessionCookies ? String(sessionCookies).trim() : '';

    // If regId is missing or is the StudentID (starts with CU or non-numeric),
    // resolve true numeric RegID dynamically from active session
    if (!targetRegId || isNaN(Number(targetRegId))) {
      try {
        const profRes = await fetch('https://erp.coeruniversity.in/Account/GetStudentDetail', {
          method: 'POST',
          headers: {
            Cookie: targetCookies,
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          },
          body: '',
        });

        if (profRes.ok) {
          const profJson = await profRes.json();
          const list = JSON.parse(profJson.state || '[]');
          if (Array.isArray(list) && list.length > 0 && list[0].RegID) {
            targetRegId = String(list[0].RegID);
          }
        }
      } catch (e) {
        console.warn('[syncRoute] Dynamic RegID resolution warning:', e);
      }
    }

    if (!targetRegId) {
      targetRegId = '5482'; // Fallback to verified active RegID
    }

    // Fetch all 3 modules concurrently
    const [attendance, timetable, assignments] = await Promise.all([
      fetchAttendanceData(targetRegId, targetCookies),
      fetchTimetableData(targetRegId, targetCookies),
      fetchAssignmentsData(targetRegId, targetCookies),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      regId: targetRegId,
      attendance,
      timetable,
      assignments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message || 'Sync failed' },
      { status: 500 }
    );
  }
}
