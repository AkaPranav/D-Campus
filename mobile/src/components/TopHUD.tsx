'use client';

import React from 'react';
import { RefreshCw, Activity } from 'lucide-react';
import { StudentProfile } from '@/lib/erpClient';

interface TopHUDProps {
  student: StudentProfile | null;
  onRefresh: () => void;
  isSyncing: boolean;
  lastSync: string | null;
}

export default function TopHUD({ student, onRefresh, isSyncing, lastSync }: TopHUDProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur border-b border-[#374151] px-4 py-2.5 flex items-center justify-between">
      {/* Brand & Student Badge */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]"></span>
          <span className="font-mono font-black text-sm tracking-tight text-[#f3f4f6]">
            D-CAMPUS
          </span>
        </div>
        <span className="text-[#374151]">|</span>
        <div className="flex flex-col">
          <span className="font-mono text-[11px] font-bold text-[#10b981]">
            {student?.studentId || 'CU240250963'}
          </span>
          <span className="text-[10px] text-[#9ca3af] -mt-0.5">
            {student?.branch ? `${student.branch.substring(0, 14)} • Sem ${student.yearSem || '5'}` : 'CSE • Sem 5'}
          </span>
        </div>
      </div>

      {/* Live Pulse & Refresh Action */}
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#10b981] bg-[#111827] px-2 py-1 rounded border border-[#374151]"
          title="Session Keep-Alive: Continuous Background Heartbeat Active"
        >
          <Activity size={12} className="animate-pulse text-[#10b981]" />
          <span>ALIVE</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="btn-retro p-2 rounded text-[#06b6d4] hover:text-[#f3f4f6] flex items-center justify-center disabled:opacity-50"
          title="Refresh Academic Records"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
        </button>
      </div>
    </header>
  );
}
