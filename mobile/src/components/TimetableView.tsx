'use client';

import React, { useState, useEffect } from 'react';
import { Clock, User, ChevronDown, Check, SunMedium, Sparkles } from 'lucide-react';
import { DaySchedule, TimetablePeriod } from '@/lib/erpClient';

interface TimetableViewProps {
  schedule: DaySchedule[];
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableView({ schedule }: TimetableViewProps) {
  // Determine current day of the week
  const todayDate = new Date();
  const dayIndex = todayDate.getDay(); // 0 is Sunday, 6 is Saturday
  const isWeekend = dayIndex === 0 || dayIndex === 6;
  const currentDayName = isWeekend ? 'Monday' : WEEKDAYS[dayIndex - 1] || 'Monday';

  const [selectedDay, setSelectedDay] = useState<string>(currentDayName);
  const [selectedElectives, setSelectedElectives] = useState<Record<string, string>>({});
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Load saved elective preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dcampus_selected_electives');
      if (saved) {
        setSelectedElectives(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse saved electives', e);
    }
  }, []);

  const handleSelectElective = (periodKey: string, code: string) => {
    const updated = { ...selectedElectives, [periodKey]: code };
    setSelectedElectives(updated);
    try {
      localStorage.setItem('dcampus_selected_electives', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save elective selection', e);
    }
    setActiveDropdown(null);
  };

  // Get current time in minutes for real-time period calculation
  const currentMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();
  const isSelectedDayToday = !isWeekend && selectedDay === (WEEKDAYS[dayIndex - 1] || '');

  const activeDaySchedule = schedule.find((d) => d.dayName.toLowerCase() === selectedDay.toLowerCase());
  const periods = activeDaySchedule?.periods || [];

  return (
    <div className="space-y-4 px-4 py-4 pb-24 max-w-md mx-auto">
      {/* Day Selector Pills */}
      <div className="retro-card p-2 flex items-center justify-between gap-1.5 overflow-x-auto">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDay === day;
          const isToday = !isWeekend && day === (WEEKDAYS[dayIndex - 1] || '');

          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDay(day);
                setActiveDropdown(null);
              }}
              className={`flex-1 py-1.5 px-1 rounded font-mono text-xs font-bold text-center transition-all relative ${
                isSelected
                  ? 'bg-[#f59e0b] text-[#000000] shadow-[1px_1px_0px_#000000]'
                  : 'bg-[#111827] text-[#9ca3af] hover:text-[#f3f4f6] border border-[#374151]'
              }`}
            >
              <span>{day.substring(0, 3).toUpperCase()}</span>
              {isToday && (
                <span
                  className={`block w-1 h-1 rounded-full mx-auto mt-0.5 ${
                    isSelected ? 'bg-[#000000]' : 'bg-[#10b981]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Weekend Banner */}
      {isWeekend && (
        <div className="bg-[#1f2937] border-2 border-[#374151] p-3 rounded flex items-center gap-3">
          <SunMedium size={24} className="text-[#f59e0b] shrink-0" />
          <div>
            <div className="font-mono text-xs font-black text-[#f59e0b]">
              CAMPUS OFF • {dayIndex === 6 ? 'SATURDAY' : 'SUNDAY'}
            </div>
            <p className="text-[11px] text-[#9ca3af] leading-tight mt-0.5">
              Weekend break — no scheduled lectures today. Showing Monday preview.
            </p>
          </div>
        </div>
      )}

      {/* Active Day Header */}
      <div className="flex items-center justify-between border-b border-[#374151] pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-black text-[#f3f4f6] uppercase tracking-wider">
            {selectedDay} Schedule
          </span>
          {isSelectedDayToday && (
            <span className="font-mono text-[9px] font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/40 px-1.5 py-0.5 rounded">
              TODAY
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] text-[#9ca3af]">
          {periods.length} Periods Scheduled
        </span>
      </div>

      {/* Periods Cards List */}
      <div className="space-y-3">
        {periods.map((period: TimetablePeriod) => {
          // Parse slot start & end
          const [startStr, endStr] = period.timeSlot.split('-');
          const parseTime = (tStr: string) => {
            if (!tStr) return 0;
            const [h, m] = tStr.trim().split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
          };

          const slotStart = parseTime(startStr);
          const slotEnd = parseTime(endStr);

          // Real-time status detection
          let status: 'COMPLETED' | 'NOW RUNNING' | 'UPCOMING' = 'UPCOMING';
          if (isSelectedDayToday && slotStart > 0 && slotEnd > 0) {
            if (currentMinutes >= slotStart && currentMinutes < slotEnd) {
              status = 'NOW RUNNING';
            } else if (currentMinutes >= slotEnd) {
              status = 'COMPLETED';
            }
          }

          const isNowRunning = status === 'NOW RUNNING';
          const periodKey = `${selectedDay}-P${period.periodNumber}`;

          // Check if this is an elective and user has selected an option
          const hasElectives = period.isElective && period.electiveOptions && period.electiveOptions.length > 1;
          const chosenElectiveCode = selectedElectives[periodKey];
          const activeElective = hasElectives
            ? period.electiveOptions?.find((opt) => opt.code === chosenElectiveCode) || period.electiveOptions?.[0]
            : null;

          const displayCode = activeElective ? activeElective.code : period.subjectCode;
          const displayName = activeElective ? activeElective.name : period.subjectName;
          const displayFaculty = activeElective ? activeElective.faculty : period.facultyName;

          return (
            <div
              key={period.periodNumber}
              className={`retro-card p-3.5 relative transition-all ${
                isNowRunning
                  ? 'border-2 border-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.25)] bg-[#111827]'
                  : status === 'COMPLETED'
                  ? 'opacity-70 bg-[#0f1422]'
                  : 'bg-[#111827]'
              }`}
            >
              {/* Card Top: Period Number, Time, Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black bg-[#1f2937] text-[#f59e0b] px-2 py-0.5 rounded border border-[#374151]">
                    P{period.periodNumber}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-[#9ca3af]">
                    <Clock size={11} />
                    <span>{period.timeSlot}</span>
                  </div>
                </div>

                {/* Status Indicator */}
                {isNowRunning ? (
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-black bg-[#10b981]/15 text-[#10b981] px-2 py-0.5 rounded border border-[#10b981]/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
                    <span>NOW RUNNING</span>
                  </div>
                ) : status === 'COMPLETED' ? (
                  <span className="font-mono text-[9px] font-bold text-[#6b7280] bg-[#1f2937] px-1.5 py-0.5 rounded">
                    COMPLETED
                  </span>
                ) : (
                  <span className="font-mono text-[9px] font-bold text-[#06b6d4] bg-[#06b6d4]/10 px-1.5 py-0.5 rounded border border-[#06b6d4]/20">
                    UPCOMING
                  </span>
                )}
              </div>

              {/* Subject Information */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#06b6d4] bg-[#06b6d4]/10 px-1.5 py-0.5 rounded border border-[#06b6d4]/30">
                    {displayCode}
                  </span>
                  {hasElectives && (
                    <span className="font-mono text-[9px] font-bold text-[#f59e0b] bg-[#f59e0b]/10 px-1 py-0.5 rounded flex items-center gap-1 border border-[#f59e0b]/30">
                      <Sparkles size={9} />
                      ELECTIVE
                    </span>
                  )}
                </div>

                <h3 className="font-mono text-sm font-bold text-[#f3f4f6] leading-snug">
                  {displayName}
                </h3>

                <div className="flex items-center gap-1 text-[11px] text-[#9ca3af] pt-1">
                  <User size={11} className="shrink-0" />
                  <span>{displayFaculty}</span>
                </div>
              </div>

              {/* Interactive In-Card Multi-Elective Dropdown Selector */}
              {hasElectives && period.electiveOptions && (
                <div className="mt-3 pt-2.5 border-t border-[#1f2937]">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#9ca3af] mb-1">
                    <span>SELECT YOUR ELECTIVE TRACK:</span>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(activeDropdown === periodKey ? null : periodKey)
                      }
                      className="w-full bg-[#1f2937] hover:bg-[#2d3748] border border-[#374151] rounded px-2.5 py-1.5 flex items-center justify-between font-mono text-xs text-[#f3f4f6] text-left transition-colors"
                    >
                      <span className="truncate">
                        {activeElective?.name || 'Choose Elective Track'} ({activeElective?.code})
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-[#f59e0b] shrink-0 transition-transform ${
                          activeDropdown === periodKey ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === periodKey && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#111827] border-2 border-[#374151] rounded shadow-[0_8px_16px_rgba(0,0,0,0.8)] overflow-hidden">
                        <div className="py-1">
                          {period.electiveOptions.map((opt) => {
                            const isSelected = activeElective?.code === opt.code;
                            return (
                              <button
                                key={opt.code}
                                type="button"
                                onClick={() => handleSelectElective(periodKey, opt.code)}
                                className={`w-full px-3 py-2 text-left font-mono text-xs flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-[#f59e0b]/15 text-[#f59e0b] font-bold'
                                    : 'text-[#d1d5db] hover:bg-[#1f2937]'
                                }`}
                              >
                                <div>
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span>{opt.name}</span>
                                    <span className="text-[10px] text-[#06b6d4]">({opt.code})</span>
                                  </div>
                                  <div className="text-[10px] text-[#9ca3af] -mt-0.5">
                                    Prof: {opt.faculty}
                                  </div>
                                </div>
                                {isSelected && <Check size={14} className="text-[#f59e0b]" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {periods.length === 0 && (
          <div className="retro-card p-6 text-center text-[#9ca3af] font-mono text-xs">
            No periods scheduled for {selectedDay}.
          </div>
        )}
      </div>
    </div>
  );
}
