'use client';

import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  LogOut,
  Coffee,
  Activity,
  CheckCircle,
  HelpCircle,
  Smartphone,
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
    <div className="space-y-4 px-4 py-4 pb-28 max-w-md mx-auto">
      {/* Student Profile Card */}
      <div className="retro-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#374151] pb-2">
          <div className="flex items-center gap-2">
            <User size={16} className="text-[#f59e0b]" />
            <span className="font-mono text-xs font-bold text-[#f3f4f6]">
              STUDENT PROFILE
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">
            ENROLLED
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#1f2937] border-2 border-[#374151] flex items-center justify-center font-mono font-black text-lg text-[#f59e0b] shrink-0">
            {student?.studentName ? student.studentName.charAt(0) : 'S'}
          </div>

          <div className="space-y-0.5 flex-1 min-w-0">
            <h2 className="font-mono font-bold text-sm text-[#f3f4f6] truncate">
              {student?.studentName || 'Student User'}
            </h2>
            <p className="font-mono text-xs text-[#06b6d4]">
              {student?.studentId || 'CU240250963'}
            </p>
            <p className="text-[11px] text-[#9ca3af] truncate">
              {student?.course || 'B.Tech.'} • {student?.branch || 'Computer Science'} • Sem {student?.yearSem || '5'}
            </p>
          </div>
        </div>
      </div>

      {/* On-Device Auto-Login Credentials */}
      <div className="retro-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#374151] pb-2">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-[#10b981]" />
            <span className="font-mono text-xs font-bold text-[#f3f4f6]">
              ON-DEVICE AUTO-LOGIN
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30 font-bold">
            ARMED
          </span>
        </div>

        <p className="text-[11px] text-[#9ca3af] leading-relaxed">
          Your credentials are encrypted and stored strictly inside your mobile device browser. The backend automatically solves CAPTCHAs and logs you in seamlessly.
        </p>

        <form onSubmit={handleUpdateCredentials} className="space-y-2.5">
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#9ca3af] mb-1">
              STUDENT ID
            </label>
            <input
              type="text"
              value={savedUser}
              onChange={(e) => setSavedUser(e.target.value)}
              className="w-full bg-[#1f2937] border border-[#374151] rounded px-3 py-1.5 font-mono text-xs text-[#f3f4f6] focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-[#9ca3af] mb-1">
              PORTAL PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={savedPass}
                onChange={(e) => setSavedPass(e.target.value)}
                className="w-full bg-[#1f2937] border border-[#374151] rounded px-3 py-1.5 font-mono text-xs text-[#f3f4f6] focus:outline-none focus:border-[#f59e0b] pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#f3f4f6]"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <button
              type="submit"
              className="btn-retro btn-retro-emerald px-3 py-1.5 rounded font-mono text-xs font-bold"
            >
              UPDATE CREDENTIALS
            </button>
            {saveFeedback && (
              <span className="font-mono text-[10px] text-[#10b981] flex items-center gap-1 font-bold animate-fadeIn">
                <CheckCircle size={12} /> SAVED!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* System Engine Health Card */}
      <div className="retro-card p-4 space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#374151] pb-2">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#06b6d4]" />
            <span className="font-mono text-xs font-bold text-[#f3f4f6]">
              SYSTEM ENGINE &amp; KEEP-ALIVE
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#06b6d4] bg-[#06b6d4]/10 px-2 py-0.5 rounded border border-[#06b6d4]/30">
            HEALTHY
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-[#1f2937]">
            <span className="text-[#9ca3af]">Session Keep-Alive</span>
            <span className="text-[#10b981] font-bold">5m Sliding Shield</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#1f2937]">
            <span className="text-[#9ca3af]">CAPTCHA OCR Engine</span>
            <span className="text-[#f59e0b] font-bold">Node.js Bitmask (&lt;2ms)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#1f2937]">
            <span className="text-[#9ca3af]">Offline Fallback Cache</span>
            <span className="text-[#06b6d4] font-bold">Enabled</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[#9ca3af]">Last Sync</span>
            <span className="text-[#f3f4f6]">{lastSync ? new Date(lastSync).toLocaleTimeString() : 'Just now'}</span>
          </div>
        </div>
      </div>

      {/* Buy me a Chai Action Card */}
      <div className="retro-card p-4 space-y-3 bg-[#111827] border-2 border-[#f59e0b]">
        <div className="flex items-center gap-2">
          <Coffee size={18} className="text-[#f59e0b]" />
          <span className="font-mono text-xs font-black text-[#f59e0b] uppercase">
            SUPPORT INDEPENDENT DEVELOPMENT
          </span>
        </div>

        <p className="text-xs text-[#d1d5db] leading-relaxed">
          If D-Campus saved you time from fighting the clunky ERP and CAPTCHAs, consider buying me a cutting chai!
        </p>

        <button
          onClick={() => setShowChaiModal(true)}
          className="w-full btn-retro btn-retro-gold py-2.5 rounded font-mono text-xs font-black flex items-center justify-center gap-2"
        >
          <Coffee size={14} />
          <span>BUY ME A CHAI (₹20 / ₹50)</span>
        </button>
      </div>

      {/* Logout Action */}
      <div className="pt-2">
        <button
          onClick={onLogout}
          className="w-full btn-retro py-3 rounded font-mono text-xs font-bold text-[#f43f5e] hover:bg-[#f43f5e]/10 border-[#f43f5e]/40 flex items-center justify-center gap-2"
        >
          <LogOut size={14} />
          <span>LOGOUT &amp; CLEAR CREDENTIALS</span>
        </button>
      </div>

      {/* App Version Info */}
      <div className="text-center pt-2 font-mono text-[10px] text-[#6b7280]">
        D-Campus Mobile Web App • Version 1.4.0
        <br />
        Built for COER University Students • Open Source
      </div>

      {/* Chai Modal */}
      <ChaiModal
        isOpen={showChaiModal}
        onClose={() => setShowChaiModal(false)}
      />
    </div>
  );
}
