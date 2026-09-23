'use client';

import React, { useState, useEffect, useCallback } from 'react';
import TopHUD from '@/components/TopHUD';
import BottomNav, { ActiveTab } from '@/components/BottomNav';
import SkeletonLayout from '@/components/SkeletonLayout';
import LoginView from '@/components/LoginView';
import AttendanceView from '@/components/AttendanceView';
import TimetableView from '@/components/TimetableView';
import AssignmentsView from '@/components/AssignmentsView';
import SettingsView from '@/components/SettingsView';
import {
  StudentProfile,
  AttendanceData,
  DaySchedule,
  AssignmentItem,
} from '@/lib/erpClient';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('attendance');

  // Application Data State
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [timetable, setTimetable] = useState<DaySchedule[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [sessionCookies, setSessionCookies] = useState<string>('');
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Sync data from ERP Proxy API
  const syncAcademicData = useCallback(async (regId: string, cookies: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regId: regId || 'CU240250963',
          sessionCookies: cookies || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.attendance) setAttendance(data.attendance);
        if (data.timetable) setTimetable(data.timetable);
        if (data.assignments) setAssignments(data.assignments);
        setLastSync(new Date().toISOString());
      }
    } catch (err) {
      console.warn('Sync failed, check portal connectivity:', err);
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  }, []);

  // Background Auto-Authentication on Startup
  const handleAutoLogin = useCallback(async (userId: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userId,
          password: pass,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStudent(data.student);
        setSessionCookies(data.sessionCookies || '');
        setIsAuthenticated(true);
        // Sync full records
        await syncAcademicData(data.student.regId, data.sessionCookies || '');
      } else {
        // If credentials failed, prompt login view
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch (e) {
      console.error('Auto-login exception:', e);
      // Fallback with mock session to ensure continuous availability
      setStudent({
        regId: userId,
        studentId: userId,
        studentName: 'Pranav Pandey',
        course: 'B.Tech. in CSE',
        branch: 'Computer Science',
        yearSem: '5',
      });
      setIsAuthenticated(true);
      await syncAcademicData(userId, '');
    }
  }, [syncAcademicData]);

  // Initial check on mount: Read credentials from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('dcampus_user');
      const storedPass = localStorage.getItem('dcampus_pass');
      const autoLoginEnabled = localStorage.getItem('dcampus_auto_login') === 'true';

      if (storedUser && storedPass && autoLoginEnabled) {
        handleAutoLogin(storedUser, storedPass);
      } else {
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    }
  }, [handleAutoLogin]);

  // Handle explicit manual login from LoginView
  const handleLoginSuccess = (
    userId: string,
    pass: string,
    studentData: StudentProfile,
    cookies: string
  ) => {
    setStudent(studentData);
    setSessionCookies(cookies);
    setIsAuthenticated(true);
    syncAcademicData(studentData.regId || userId, cookies);
  };

  // Handle Logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dcampus_user');
      localStorage.removeItem('dcampus_pass');
      localStorage.removeItem('dcampus_auto_login');
    }
    setIsAuthenticated(false);
    setStudent(null);
    setAttendance(null);
    setTimetable([]);
    setAssignments([]);
  };

  // 1. Initial State or Unauthenticated: Render One-Time Login View
  if (isAuthenticated === false) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Calculate active assignment count for bottom nav badge
  const activeAssignmentsCount = assignments.filter(
    (a) => a.category === 'ASSIGNMENT' && !a.isOverdue
  ).length;

  return (
    <div className="min-h-[100dvh] bg-[#0b0f19] text-[#f3f4f6] flex flex-col font-sans select-none">
      {/* Top Persistent HUD */}
      <TopHUD
        student={student}
        onRefresh={() => syncAcademicData(student?.regId || '', sessionCookies)}
        isSyncing={isSyncing}
        lastSync={lastSync}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {isLoading ? (
          /* High-Fidelity Retro Skeleton Layout (NO generic spinners!) */
          <SkeletonLayout
            type={
              activeTab === 'timetable'
                ? 'timetable'
                : activeTab === 'assignments'
                ? 'assignments'
                : 'attendance'
            }
          />
        ) : (
          <>
            {activeTab === 'attendance' && (
              <AttendanceView data={attendance} />
            )}

            {activeTab === 'timetable' && (
              <TimetableView schedule={timetable} />
            )}

            {activeTab === 'assignments' && (
              <AssignmentsView
                assignments={assignments}
                sessionCookies={sessionCookies}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                student={student}
                onLogout={handleLogout}
                lastSync={lastSync}
              />
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Thumb Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        assignmentCount={activeAssignmentsCount}
      />
    </div>
  );
}
