'use client';

import React, { useState } from 'react';
import { Search, ShieldAlert, ShieldCheck, CheckCircle2, UserCheck } from 'lucide-react';
import { AttendanceData, SubjectAttendance } from '@/lib/erpClient';

interface AttendanceViewProps {
  data: AttendanceData | null;
}

export default function AttendanceView({ data }: AttendanceViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!data) {
    return (
      <div className="p-6 text-center">
        <div className="retro-card p-4 text-[#94a3b8] font-mono text-xs">
          [NO ATTENDANCE RECORDS FOUND]
        </div>
      </div>
    );
  }

  const { overallPercentage, totalDelivered, totalAttended, bunkAllowance, shortfall, subjects, dateRange } = data;

  const isSafe = overallPercentage >= 75;
  const strokeColor = overallPercentage >= 75 ? '#10b981' : overallPercentage >= 70 ? '#fbbf24' : '#f43f5e';
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, overallPercentage)) / 100) * circumference;

  const filteredSubjects = subjects.filter(
    (s) =>
      s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.facultyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 px-3.5 py-4 pb-24 max-w-md mx-auto">
      {/* Overall KPI Gauge Card */}
      <div className="retro-card overflow-hidden">
        {/* Retro Header Bar */}
        <div className="retro-card-header">
          <div className="flex items-center gap-2">
            <span className="retro-dot min" />
            <span className="font-mono text-xs font-black text-[#f8fafc] tracking-wider uppercase">
              ATTENDANCE GAUGE
            </span>
          </div>
          <span className={`retro-badge ${isSafe ? 'safe' : 'danger'}`}>
            {isSafe ? 'ELIGIBLE (≥75%)' : 'CRITICAL (<75%)'}
          </span>
        </div>

        {/* Circular Gauge Body - MATTE RETRO, ZERO NEON */}
        <div className="p-4 flex flex-col items-center justify-center space-y-3">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
              {/* Background Track */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-[#080a0d]"
                strokeWidth="11"
                fill="none"
              />
              {/* Progress Arc */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={strokeColor}
                strokeWidth="11"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>

            {/* Inner Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-3xl font-black text-[#f8fafc] tracking-tight">
                {overallPercentage.toFixed(1)}%
              </span>
              <span className="font-mono text-[9px] uppercase font-bold text-[#64748b]">
                [AGGREGATE]
              </span>
            </div>
          </div>

          {/* Delivered vs Attended Inset Stats */}
          <div className="w-full grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="retro-inset p-2 text-center">
              <span className="text-[10px] text-[#64748b] block uppercase">ATTENDED</span>
              <span className="font-black text-sm text-[#10b981]">{totalAttended}</span>
              <span className="text-[#64748b] text-[10px]"> / {totalDelivered}</span>
            </div>
            <div className="retro-inset p-2 text-center">
              <span className="text-[10px] text-[#64748b] block uppercase">DATE RANGE</span>
              <span className="font-bold text-[11px] text-[#f8fafc] truncate block">
                {dateRange || 'Semester'}
              </span>
            </div>
          </div>

          {/* Dynamic Bunking / Shortfall Callout Banner */}
          {bunkAllowance > 0 ? (
            <div className="w-full bg-[#10b981]/10 border-2 border-[#000000] p-2.5 rounded shadow-[2px_2px_0px_#000000] flex items-start gap-2">
              <ShieldCheck size={18} className="text-[#10b981] shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-[11px] font-black text-[#10b981]">
                  CAN BUNK: {bunkAllowance} {bunkAllowance === 1 ? 'LECTURE' : 'LECTURES'} SAFE ✓
                </div>
                <p className="text-[10px] text-[#94a3b8] font-mono leading-tight mt-0.5">
                  Safe buffer available above the mandatory 75% cutoff.
                </p>
              </div>
            </div>
          ) : shortfall > 0 ? (
            <div className="w-full bg-[#f43f5e]/10 border-2 border-[#000000] p-2.5 rounded shadow-[2px_2px_0px_#000000] flex items-start gap-2">
              <ShieldAlert size={18} className="text-[#f43f5e] shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-[11px] font-black text-[#f43f5e]">
                  SHORTFALL: NEED {shortfall} {shortfall === 1 ? 'CLASS' : 'CLASSES'} CONSECUTIVELY ⚠️
                </div>
                <p className="text-[10px] text-[#94a3b8] font-mono leading-tight mt-0.5">
                  Attend next {shortfall} classes without missing to restore 75% cutoff.
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full bg-[#fbbf24]/10 border-2 border-[#000000] p-2.5 rounded shadow-[2px_2px_0px_#000000] flex items-start gap-2">
              <CheckCircle2 size={18} className="text-[#fbbf24] shrink-0 mt-0.5" />
              <div>
                <div className="font-mono text-[11px] font-black text-[#fbbf24]">
                  THRESHOLD LIMIT (0 SAFE BUNKS)
                </div>
                <p className="text-[10px] text-[#94a3b8] font-mono leading-tight mt-0.5">
                  Exactly at the 75% boundary. Missing classes will trigger critical detention.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="font-bold text-[#94a3b8] uppercase">
            [SUBJECTS: {filteredSubjects.length}]
          </span>
          <span className="text-[#fbbf24] font-bold">
            MIN 75% REQ.
          </span>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search code, subject, faculty..."
            className="w-full bg-[#080a0d] border-2 border-[#000000] rounded px-3 py-2 pl-8 text-xs text-[#f8fafc] font-mono placeholder-[#64748b] focus:outline-none focus:border-[#fbbf24] shadow-[2px_2px_0px_#000000] transition-colors"
          />
        </div>
      </div>

      {/* Subject Cards List */}
      <div className="space-y-3">
        {filteredSubjects.map((sub: SubjectAttendance, idx: number) => {
          const subSafe = sub.percentage >= 75;
          const pctColor = subSafe ? 'text-[#10b981]' : sub.percentage >= 70 ? 'text-[#fbbf24]' : 'text-[#f43f5e]';
          const barColor = subSafe ? 'bg-[#10b981]' : sub.percentage >= 70 ? 'bg-[#fbbf24]' : 'bg-[#f43f5e]';

          return (
            <div key={`${sub.subjectId || sub.subjectCode}-${idx}`} className="retro-card overflow-hidden">
              {/* Card Top Titlebar */}
              <div className="retro-card-header py-1.5 px-3">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-mono text-[10px] font-black text-[#000000] bg-[#06b6d4] px-1.5 py-0.2 rounded border border-[#000000]">
                    {sub.subjectCode}
                  </span>
                  <span className="text-[10px] text-[#94a3b8] font-mono truncate flex items-center gap-1">
                    <UserCheck size={11} className="shrink-0" />
                    {sub.facultyName}
                  </span>
                </div>

                <span className={`font-mono text-xs font-black ${pctColor} shrink-0`}>
                  {sub.percentage.toFixed(1)}%
                </span>
              </div>

              {/* Card Body */}
              <div className="p-3 space-y-2">
                <h3 className="font-mono font-bold text-xs text-[#f8fafc] leading-snug line-clamp-1">
                  {sub.subjectName}
                </h3>

                {/* Retro Progress Bar - Crisp Notch */}
                <div className="relative pt-0.5">
                  <div className="h-2 w-full bg-[#080a0d] border border-[#2d3545] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                    />
                  </div>
                  {/* 75% Requirement Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#fbbf24]"
                    style={{ left: '75%' }}
                    title="75% Requirement Cutoff"
                  />
                </div>

                {/* Footer Metrics */}
                <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#2d3545]">
                  <span className="text-[#64748b]">
                    ATTENDED: <strong className="text-[#f8fafc]">{sub.attended}/{sub.delivered}</strong>
                  </span>

                  {sub.bunkAllowance > 0 ? (
                    <span className="text-[#10b981] font-bold">
                      Can bunk: {sub.bunkAllowance} safe ✓
                    </span>
                  ) : sub.shortfall > 0 ? (
                    <span className="text-[#f43f5e] font-bold">
                      Need: {sub.shortfall} classes ⚠️
                    </span>
                  ) : (
                    <span className="text-[#fbbf24] font-bold">
                      Margin: 0 (75% edge)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredSubjects.length === 0 && (
          <div className="retro-card p-6 text-center text-[#94a3b8] font-mono text-xs">
            [NO SUBJECTS MATCHING FILTER]
          </div>
        )}
      </div>
    </div>
  );
}
