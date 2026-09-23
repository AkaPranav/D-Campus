'use client';

import React, { useState } from 'react';
import {
  User,
  Key,
  LogOut,
  Coffee,
  Activity,
  CheckCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { StudentProfile } from '@/lib/erpClient';
import ChaiModal from './ChaiModal';

interface SettingsViewProps {
  student: StudentProfile | null;
  onLogout: () => void;
  lastSync: string | null;
}

export default function SettingsView({ student, onLogout, lastSync }: SettingsViewProps) {
  const [showChaiModal, setShowChaiModal] = useState(false);
  const [savedUser, setSavedUser] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dcampus_user') || student?.studentId || '';
    }
    return '';
  });
  const [savedPass, setSavedPass] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dcampus_pass') || '';
    }
    return '';
  });
  const [showPass, setShowPass] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('dcampus_user', savedUser.trim());
      localStorage.setItem('dcampus_pass', savedPass.trim());
      localStorage.setItem('dcampus_auto_login', 'true');
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    }
  };

  return (
    <div className="space-y-4 px-3.5 py-4 pb-28 max-w-md mx-auto">
      {/* Student Profile Card */}
      <div className="retro-card overflow-hidden">
        <div className="retro-card-header py-1.5 px-3">
          <div className="flex items-center gap-1.5">
            <span className="retro-dot min" />
            <span className="font-mono text-xs font-black text-[#f8fafc] uppercase">
              STUDENT PROFILE
            </span>
          </div>
          <span className="retro-badge safe text-[9px]">
            ACTIVE
          </span>
        </div>

        <div className="p-3.5 flex items-start gap-3">
          <div className="w-11 h-11 bg-[#080a0d] border-2 border-[#000000] shadow-[2px_2px_0px_#000000] flex items-center justify-center font-mono font-black text-lg text-[#fbbf24] shrink-0">
            {student?.studentName ? student.studentName.charAt(0) : 'P'}
          </div>

          <div className="space-y-0.5 flex-1 min-w-0">
            <h2 className="font-mono font-black text-xs text-[#f8fafc] truncate uppercase">
              {student?.studentName || 'PRANAV PANDEY'}
            </h2>
            <p className="font-mono text-[11px] text-[#06b6d4] font-bold">
              ID: {student?.studentId || 'CU240250963'}
            </p>
            <p className="text-[10px] font-mono text-[#94a3b8] truncate">
              {student?.course || 'B.Tech.'} • {student?.branch || 'CSE'} (SEM {student?.yearSem || '5'})
            </p>
          </div>
        </div>
      </div>

      {/* On-Device Auto-Login Credentials */}
      <div className="retro-card overflow-hidden">
        <div className="retro-card-header py-1.5 px-3">
          <div className="flex items-center gap-1.5">
            <Key size={13} className="text-[#fbbf24]" />
            <span className="font-mono text-xs font-black text-[#f8fafc] uppercase">
              STORED CREDENTIALS
            </span>
          </div>
          <span className="retro-badge safe text-[9px]">
            ARMED
          </span>
        </div>

        <div className="p-3.5 space-y-3">
          <p className="text-[10px] font-mono text-[#94a3b8] leading-normal">
            Credentials stay strictly on-device in local storage. Automatic background OCR solves the portal CAPTCHA in &lt;2ms on every launch.
          </p>

          <form onSubmit={handleUpdateCredentials} className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-mono font-bold text-[#94a3b8] mb-1 uppercase">
                STUDENT ID / USERNAME
              </label>
              <input
                type="text"
                value={savedUser}
                onChange={(e) => setSavedUser(e.target.value)}
                className="w-full bg-[#080a0d] border-2 border-[#000000] rounded px-3 py-1.5 font-mono text-xs text-[#f8fafc] focus:outline-none focus:border-[#fbbf24] shadow-[2px_2px_0px_#000000]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-[#94a3b8] mb-1 uppercase">
                PORTAL PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={savedPass}
                  onChange={(e) => setSavedPass(e.target.value)}
                  className="w-full bg-[#080a0d] border-2 border-[#000000] rounded px-3 py-1.5 font-mono text-xs text-[#f8fafc] focus:outline-none focus:border-[#fbbf24] shadow-[2px_2px_0px_#000000] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#f8fafc]"
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                type="submit"
                className="btn-retro btn-retro-emerald px-3 py-1.5 text-[10px]"
              >
                UPDATE CREDENTIALS
              </button>
              {saveFeedback && (
                <span className="font-mono text-[10px] text-[#10b981] font-bold flex items-center gap-1">
                  <CheckCircle size={12} /> SAVED!
                </span>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Engine Status Inset */}
      <div className="retro-card overflow-hidden">
        <div className="retro-card-header py-1.5 px-3">
          <div className="flex items-center gap-1.5">
            <Activity size={13} className="text-[#06b6d4]" />
            <span className="font-mono text-xs font-black text-[#f8fafc] uppercase">
              SESSION STATUS
            </span>
          </div>
          <span className="retro-badge info text-[9px]">
            HEALTHY
          </span>
        </div>

        <div className="p-3 font-mono text-xs space-y-1.5">
          <div className="flex items-center justify-between py-1 border-b border-[#2d3545]">
            <span className="text-[#94a3b8] text-[10px]">Session Sliding Shield</span>
            <span className="text-[#10b981] font-bold text-[10px]">5m Keep-Alive</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#2d3545]">
            <span className="text-[#94a3b8] text-[10px]">CAPTCHA Solver</span>
            <span className="text-[#fbbf24] font-bold text-[10px]">Bitmask OCR (&lt;2ms)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[#94a3b8] text-[10px]">Last Synced</span>
            <span className="text-[#f8fafc] font-bold text-[10px]">
              {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Live'}
            </span>
          </div>
        </div>
      </div>

      {/* Buy me a Chai Box - Retro Window */}
      <div className="retro-card overflow-hidden border-2 border-[#fbbf24]">
        <div className="bg-[#fbbf24] px-3 py-1.5 border-b-2 border-[#000000] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#000000]">
            <Coffee size={14} className="stroke-[2.5]" />
            <span className="font-mono text-[11px] font-black uppercase">
              BUY ME A CHAI ☕
            </span>
          </div>
          <span className="bg-[#000000] text-[#fbbf24] font-mono text-[9px] font-black px-1.5 py-0.2 rounded">
            DEV SUPPORT
          </span>
        </div>

        <div className="p-3 space-y-2.5">
          <p className="text-[10px] font-mono text-[#94a3b8] leading-normal">
            If D-Campus saved you time from the clunky portal and CAPTCHAs, support ongoing development with a hot cup of chai!
          </p>

          <button
            onClick={() => setShowChaiModal(true)}
            className="w-full btn-retro btn-retro-gold py-2 text-xs flex items-center justify-center gap-1.5"
          >
            <Coffee size={13} />
            <span>SUPPORT WITH CHAI (₹20 / ₹50)</span>
          </button>
        </div>
      </div>

      {/* Logout Action */}
      <div className="pt-1">
        <button
          onClick={onLogout}
          className="w-full btn-retro py-2.5 text-xs text-[#f43f5e] border-[#f43f5e] hover:bg-[#f43f5e]/15 flex items-center justify-center gap-2"
        >
          <LogOut size={13} />
          <span>LOGOUT &amp; CLEAR CREDENTIALS</span>
        </button>
      </div>

      <div className="text-center font-mono text-[9px] text-[#64748b]">
        D-Campus Mobile PWA • v1.4.0 • Built for COER University
      </div>

      {/* Chai Modal */}
      <ChaiModal
        isOpen={showChaiModal}
        onClose={() => setShowChaiModal(false)}
      />
    </div>
  );
}
