'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { StudentProfile } from '@/lib/erpClient';

interface TopHUDProps {
  student: StudentProfile | null;
  onRefresh: () => void;
  isSyncing: boolean;
  lastSync: string | null;
}

export default function TopHUD({ student, onRefresh, isSyncing, lastSync }: TopHUDProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#13171f] border-b-2 border-[#000000] shadow-[0_2px_0px_#000000]">
      {/* Retro Titlebar Header */}
      <div className="bg-[#161c28] px-3.5 py-1.5 border-b border-[#2d3545] flex items-center justify-between select-none">
        {/* Retro Dots & Brand */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="retro-dot close" />
            <span className="retro-dot min" />
            <span className="retro-dot max" />
          </div>
          <span className="text-[#2d3545] text-xs font-mono">|</span>
          <div className="flex items-center gap-1.5">
            <span className="bg-[#000000] text-[#fbbf24] px-1.5 py-0.5 rounded border border-[#2d3545] font-mono text-[10px] font-black tracking-wider">
              D-CAMPUS // OS
            </span>
          </div>
        </div>

        {/* System Pulse State */}
        <div className="flex items-center gap-2">
          <span className="retro-badge safe text-[9px]">
            ● ONLINE
          </span>
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="btn-retro px-2 py-0.5 text-[#fbbf24] hover:text-[#ffffff] flex items-center justify-center disabled:opacity-50"
            title="Force Synchronize with University Portal"
          >
            <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Sub-bar with Student Identity & Session Info */}
      <div className="bg-[#0b0d11] px-3.5 py-2 flex items-center justify-between font-mono text-[11px] border-b border-[#000000]">
        <div className="flex items-center gap-2 truncate">
          <span className="font-black text-[#10b981] bg-[#10b981]/15 px-1.5 py-0.2 rounded border border-[#10b981]/40">
            {student?.studentId || 'CU240250963'}
          </span>
          <span className="text-[#94a3b8] truncate text-[10px]">
            {student?.studentName ? student.studentName.split(' ')[0] : 'PRANAV'} • {student?.branch || 'CSE'} (SEM {student?.yearSem || '5'})
          </span>
        </div>

        <div className="text-[9px] text-[#64748b] shrink-0 font-bold">
          {lastSync ? `SYNC: ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'SYNC: LIVE'}
        </div>
      </div>
    </header>
  );
}
