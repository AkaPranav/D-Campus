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

    const targetRegId = regId || 'CU240250963';
    const targetCookies = sessionCookies || '';

    // Fetch all 3 modules concurrently
    const [attendance, timetable, assignments] = await Promise.all([
      fetchAttendanceData(targetRegId, targetCookies),
      fetchTimetableData(targetRegId, targetCookies),
      fetchAssignmentsData(targetRegId, targetCookies),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
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
