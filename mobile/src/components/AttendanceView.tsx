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
      <div className="p-4 text-center">
        <p className="text-[#9ca3af] font-mono text-sm">No attendance records available.</p>
      </div>
    );
  }

  const { overallPercentage, totalDelivered, totalAttended, bunkAllowance, shortfall, subjects } = data;

  const isSafe = overallPercentage >= 75;
  const strokeColor = overallPercentage >= 75 ? '#10b981' : overallPercentage >= 70 ? '#f59e0b' : '#f43f5e';
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, overallPercentage)) / 100) * circumference;

  const filteredSubjects = subjects.filter(
    (s) =>
      s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.facultyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 px-4 py-4 pb-24 max-w-md mx-auto">
      {/* Overall KPI Gauge Card */}
      <div className="retro-card p-4 space-y-4 relative overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#374151] pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="font-mono text-xs font-bold text-[#f3f4f6] tracking-wider">
              OVERALL ATTENDANCE GAUGE
            </span>
          </div>
          <span
            className={`font-mono text-[10px] font-black px-2 py-0.5 rounded border ${
              isSafe
                ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/50'
                : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/50'
            }`}
          >
            {isSafe ? 'ELIGIBLE (≥75%)' : 'CRITICAL (<75%)'}
          </span>
        </div>

        {/* Circular SVG Gauge & Stats */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
              {/* Background Track */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-[#1f2937]"
                strokeWidth="10"
                fill="none"
              />
              {/* 75% Target Marker Arc or Dash */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={strokeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>

            {/* Inner Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-mono text-3xl font-black text-[#f3f4f6] tracking-tight">
                {overallPercentage.toFixed(1)}%
              </span>
              <span className="font-mono text-[10px] uppercase font-bold text-[#9ca3af] -mt-0.5">
                Current Aggregate
              </span>
            </div>
          </div>

          {/* Delivered vs Attended Badge */}
          <div className="flex items-center gap-3 mt-3 font-mono text-xs">
            <div className="bg-[#111827] px-3 py-1 rounded border border-[#374151] flex items-center gap-1.5">
              <span className="text-[#9ca3af]">Attended:</span>
              <span className="font-bold text-[#10b981]">{totalAttended}</span>
              <span className="text-[#4b5563]">/</span>
              <span className="text-[#9ca3af]">{totalDelivered}</span>
            </div>
            <div className="bg-[#111827] px-3 py-1 rounded border border-[#374151]">
              <span className="text-[#9ca3af]">Threshold: </span>
              <span className="font-bold text-[#f59e0b]">75.0%</span>
            </div>
          </div>
        </div>

        {/* Dynamic Safe Bunking / Shortfall Banner */}
        {bunkAllowance > 0 ? (
          <div className="bg-[#10b981]/10 border-2 border-[#10b981] p-3 rounded shadow-[2px_2px_0px_#000000] flex items-start gap-2.5">
            <ShieldCheck size={20} className="text-[#10b981] shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-black text-[#10b981] tracking-wide">
                CAN BUNK: {bunkAllowance} {bunkAllowance === 1 ? 'LECTURE' : 'LECTURES'} SAFE ✓
              </div>
              <p className="text-[11px] text-[#d1d5db] mt-0.5 leading-snug">
                You can miss up to <span className="font-bold text-white">{bunkAllowance} consecutive lectures</span> across subjects and still comfortably maintain exam eligibility (≥75%).
              </p>
            </div>
          </div>
        ) : shortfall > 0 ? (
          <div className="bg-[#f43f5e]/10 border-2 border-[#f43f5e] p-3 rounded shadow-[2px_2px_0px_#000000] flex items-start gap-2.5">
            <ShieldAlert size={20} className="text-[#f43f5e] shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-black text-[#f43f5e] tracking-wide">
                ATTENDANCE SHORTFALL: NEED {shortfall} {shortfall === 1 ? 'LECTURE' : 'LECTURES'} ⚠️
              </div>
              <p className="text-[11px] text-[#d1d5db] mt-0.5 leading-snug">
                You must attend the next <span className="font-bold text-white">{shortfall} classes consecutively</span> without missing to restore attendance to the mandatory 75% cutoff.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#f59e0b]/10 border-2 border-[#f59e0b] p-3 rounded shadow-[2px_2px_0px_#000000] flex items-start gap-2.5">
            <CheckCircle2 size={20} className="text-[#f59e0b] shrink-0 mt-0.5" />
            <div>
              <div className="font-mono text-xs font-black text-[#f59e0b] tracking-wide">
                ON THE 75% THRESHOLD (0 SAFE BUNKS)
              </div>
              <p className="text-[11px] text-[#d1d5db] mt-0.5 leading-snug">
                Your attendance is right on the line. Missing even a single lecture will drop you into the critical detention zone.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subject Search and Breakdown Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#9ca3af] tracking-wider uppercase">
            Subject Breakdown ({filteredSubjects.length})
          </span>
          <span className="font-mono text-[10px] text-[#06b6d4]">
            Semester 5
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subject code, name, or faculty..."
            className="w-full bg-[#111827] border border-[#374151] rounded px-3 py-2 pl-9 text-xs text-[#f3f4f6] font-mono placeholder-[#6b7280] focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </div>
      </div>

      {/* Subject Cards List */}
      <div className="space-y-3">
        {filteredSubjects.map((sub: SubjectAttendance) => {
          const subSafe = sub.percentage >= 75;
          const pctColor = subSafe ? 'text-[#10b981]' : sub.percentage >= 70 ? 'text-[#f59e0b]' : 'text-[#f43f5e]';
          const barColor = subSafe ? 'bg-[#10b981]' : sub.percentage >= 70 ? 'bg-[#f59e0b]' : 'bg-[#f43f5e]';

          return (
            <div key={sub.subjectId || sub.subjectCode} className="retro-card p-3.5 space-y-2.5">
              {/* Title & Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-[#06b6d4] bg-[#06b6d4]/10 px-1.5 py-0.5 rounded border border-[#06b6d4]/30">
                      {sub.subjectCode}
                    </span>
                    <span className="text-[11px] text-[#9ca3af] flex items-center gap-1 truncate">
                      <UserCheck size={11} className="shrink-0" />
                      {sub.facultyName}
                    </span>
                  </div>
                  <h3 className="font-mono font-bold text-xs text-[#f3f4f6] mt-1 line-clamp-1">
                    {sub.subjectName}
                  </h3>
                </div>

                {/* Score Pill */}
                <div className="text-right shrink-0">
                  <span className={`font-mono text-base font-black ${pctColor}`}>
                    {sub.percentage.toFixed(1)}%
                  </span>
                  <div className="text-[9px] font-mono text-[#9ca3af]">
                    {sub.attended}/{sub.delivered} LECTURES
                  </div>
                </div>
              </div>

              {/* Attendance Progress Bar with 75% Threshold Line */}
              <div className="relative pt-1">
                <div className="h-2 w-full bg-[#1f2937] rounded-full overflow-hidden border border-[#374151]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                  />
                </div>
                {/* 75% Benchmark Notch */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#f59e0b] shadow-[0_0_4px_#f59e0b]"
                  style={{ left: '75%' }}
                  title="75% Attendance Requirement"
                />
              </div>

              {/* Subject Margin / Bunk Info */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-0.5 border-t border-[#1f2937]">
                <span className="text-[#9ca3af]">
                  Rate: {sub.delivered > 0 ? `${sub.attended} attended` : 'No lectures'}
                </span>

                {sub.bunkAllowance > 0 ? (
                  <span className="text-[#10b981] font-bold">
                    Can bunk: {sub.bunkAllowance} safe ✓
                  </span>
                ) : sub.shortfall > 0 ? (
                  <span className="text-[#f43f5e] font-bold">
                    Need: {sub.shortfall} more classes ⚠️
                  </span>
                ) : (
                  <span className="text-[#f59e0b] font-bold">
                    Safe margin: 0 (75% edge)
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredSubjects.length === 0 && (
          <div className="retro-card p-6 text-center text-[#9ca3af] font-mono text-xs">
            No subjects matching &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
