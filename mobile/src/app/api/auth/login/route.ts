import { NextRequest, NextResponse } from 'next/server';
import { loginToErp } from '@/lib/erpClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Student ID and Password are required.' },
        { status: 400 }
      );
    }

    // Solve CAPTCHA automatically in background and authenticate with ERP
    const result = await loginToErp(username.trim(), password.trim());

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Authentication failed. Please verify credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      student: result.student,
      sessionCookies: result.sessionCookies,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message || 'Server error occurred during authentication.' },
      { status: 500 }
    );
  }
}
