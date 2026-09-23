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
          regId: regId || '',
          sessionCookies: cookies || '',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.attendance) setAttendance(data.attendance);
        if (data.timetable) setTimetable(data.timetable);
        if (data.assignments) setAssignments(data.assignments);
        
        const now = new Date().toISOString();
        setLastSync(now);

        // Cache synced data to localStorage for instant subsequent loads
        try {
          localStorage.setItem(
            'dcampus_cache',
            JSON.stringify({
              attendance: data.attendance,
              timetable: data.timetable,
              assignments: data.assignments,
              lastSync: now,
            })
          );
        } catch (e) {
          console.warn('Storage save failed:', e);
        }
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
      if (res.ok && data.success && data.student) {
        setStudent(data.student);
        setSessionCookies(data.sessionCookies || '');
        setIsAuthenticated(true);

        try {
          localStorage.setItem('dcampus_reg_id', data.student.regId);
          localStorage.setItem('dcampus_student', JSON.stringify(data.student));
        } catch (e) {
          console.warn('Could not cache student profile', e);
        }

        // Sync full records using the student's real numeric RegID
        await syncAcademicData(data.student.regId, data.sessionCookies || '');
      } else {
        // If login failed, show login screen
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    } catch (e) {
      console.error('Auto-login exception:', e);
      setIsAuthenticated(true);
      const storedRegId = localStorage.getItem('dcampus_reg_id') || userId;
      await syncAcademicData(storedRegId, '');
    }
  }, [syncAcademicData]);

  // Initial check on mount: Read credentials & cache from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Try loading cached data first for instantaneous rendering
      try {
        const cachedRaw = localStorage.getItem('dcampus_cache');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached.attendance) setAttendance(cached.attendance);
          if (cached.timetable) setTimetable(cached.timetable);
          if (cached.assignments) setAssignments(cached.assignments);
          if (cached.lastSync) setLastSync(cached.lastSync);
        }

        const cachedStudent = localStorage.getItem('dcampus_student');
        if (cachedStudent) {
          setStudent(JSON.parse(cachedStudent));
        }
      } catch (e) {
        console.warn('Cache restore skipped:', e);
      }

      // 2. Check credentials
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

    try {
      localStorage.setItem('dcampus_reg_id', studentData.regId || userId);
      localStorage.setItem('dcampus_student', JSON.stringify(studentData));
    } catch (e) {
      console.warn('Storage error on login success:', e);
    }

    syncAcademicData(studentData.regId || userId, cookies);
  };

  // Handle Logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dcampus_user');
      localStorage.removeItem('dcampus_pass');
      localStorage.removeItem('dcampus_auto_login');
      localStorage.removeItem('dcampus_reg_id');
      localStorage.removeItem('dcampus_student');
      localStorage.removeItem('dcampus_cache');
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
    <div className="min-h-[100dvh] bg-[#0b0d11] text-[#f8fafc] flex flex-col font-mono select-none">
      {/* Top Persistent HUD */}
      <TopHUD
        student={student}
        onRefresh={() => syncAcademicData(student?.regId || '', sessionCookies)}
        isSyncing={isSyncing}
        lastSync={lastSync}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {isLoading && !attendance ? (
          /* High-Fidelity Retro Skeleton Layout (Only shown when no cached data exists) */
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
