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

  const currentMinutes = todayDate.getHours() * 60 + todayDate.getMinutes();
  const isSelectedDayToday = !isWeekend && selectedDay === (WEEKDAYS[dayIndex - 1] || '');

  const activeDaySchedule = schedule.find((d) => d.dayName.toLowerCase() === selectedDay.toLowerCase());
  const periods = activeDaySchedule?.periods || [];

  return (
    <div className="space-y-4 px-3.5 py-4 pb-24 max-w-md mx-auto">
      {/* Day Selector - Tactile Retro Buttons */}
      <div className="retro-card p-1.5 flex items-center justify-between gap-1 overflow-x-auto">
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
              className={`flex-1 py-1.5 px-1 rounded-sm font-mono text-xs font-black text-center transition-all border ${
                isSelected
                  ? 'bg-[#fbbf24] text-[#000000] border-[#000000] shadow-[2px_2px_0px_#000000]'
                  : 'bg-[#080a0d] text-[#94a3b8] hover:text-[#f8fafc] border-[#2d3545]'
              }`}
            >
              <span>{day.substring(0, 3).toUpperCase()}</span>
              {isToday && (
                <span
                  className={`block w-1.5 h-1.5 rounded-full mx-auto mt-0.5 ${
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
        <div className="bg-[#1b202b] border-2 border-[#000000] p-3 rounded shadow-[3px_3px_0px_#000000] flex items-center gap-3">
          <SunMedium size={22} className="text-[#fbbf24] shrink-0" />
          <div>
            <div className="font-mono text-xs font-black text-[#fbbf24]">
              CAMPUS OFF • {dayIndex === 6 ? 'SATURDAY' : 'SUNDAY'}
            </div>
            <p className="text-[10px] text-[#94a3b8] font-mono leading-tight mt-0.5">
              Weekend schedule — no active lectures. Showing Monday class preview.
            </p>
          </div>
        </div>
      )}

      {/* Active Day Header */}
      <div className="flex items-center justify-between border-b-2 border-[#000000] pb-1.5 font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#f8fafc] uppercase tracking-wider">
            [{selectedDay.toUpperCase()} SCHEDULE]
          </span>
          {isSelectedDayToday && (
            <span className="retro-badge safe text-[9px]">
              TODAY
            </span>
          )}
        </div>
        <span className="text-[#64748b] font-bold">
          {periods.length} PERIODS
        </span>
      </div>

      {/* Period Cards List */}
      <div className="space-y-3">
        {periods.map((period: TimetablePeriod) => {
          const [startStr, endStr] = period.timeSlot.split('-');
          const parseTime = (tStr: string) => {
            if (!tStr) return 0;
            const [h, m] = tStr.trim().split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
          };

          const slotStart = parseTime(startStr);
          const slotEnd = parseTime(endStr);

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
              className={`retro-card overflow-hidden transition-all ${
                isNowRunning
                  ? 'border-2 border-[#fbbf24] shadow-[4px_4px_0px_#000000]'
                  : status === 'COMPLETED'
                  ? 'opacity-65 bg-[#0e1218]'
                  : ''
              }`}
            >
              {/* Card Titlebar */}
              <div
                className={`retro-card-header py-1.5 px-3 ${
                  isNowRunning ? 'bg-[#fbbf24] text-[#000000] border-b-2 border-[#000000]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-black px-1.5 py-0.2 rounded border ${
                      isNowRunning
                        ? 'bg-[#000000] text-[#fbbf24] border-[#000000]'
                        : 'bg-[#080a0d] text-[#fbbf24] border-[#2d3545]'
                    }`}
                  >
                    P{period.periodNumber}
                  </span>
                  <div
                    className={`flex items-center gap-1 font-mono text-[11px] font-bold ${
                      isNowRunning ? 'text-[#000000]' : 'text-[#94a3b8]'
                    }`}
                  >
                    <Clock size={11} />
                    <span>{period.timeSlot}</span>
                  </div>
                </div>

                {/* Status Badges - ZERO NEON */}
                {isNowRunning ? (
                  <span className="bg-[#000000] text-[#10b981] font-mono text-[9px] font-black px-2 py-0.5 rounded border border-[#000000]">
                    ● NOW RUNNING
                  </span>
                ) : status === 'COMPLETED' ? (
                  <span className="retro-badge ghost text-[9px]">
                    COMPLETED
                  </span>
                ) : (
                  <span className="retro-badge info text-[9px]">
                    UPCOMING
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  {displayCode && (
                    <span className="font-mono text-[10px] font-black text-[#000000] bg-[#06b6d4] px-1.5 py-0.2 rounded border border-[#000000]">
                      {displayCode}
                    </span>
                  )}
                  {hasElectives && (
                    <span className="font-mono text-[9px] font-black text-[#000000] bg-[#fbbf24] px-1 py-0.2 rounded border border-[#000000] flex items-center gap-1">
                      <Sparkles size={9} />
                      ELECTIVE
                    </span>
                  )}
                </div>

                <h3 className="font-mono text-xs font-bold text-[#f8fafc] leading-snug">
                  {displayName}
                </h3>

                <div className="flex items-center gap-1 text-[11px] font-mono text-[#94a3b8] pt-0.5">
                  <User size={11} className="shrink-0" />
                  <span>Prof: {displayFaculty}</span>
                </div>
              </div>

              {/* In-Card Multi-Elective Dropdown Selector */}
              {hasElectives && period.electiveOptions && (
                <div className="px-3 pb-3 pt-1 border-t border-[#2d3545]">
                  <div className="text-[9px] font-mono text-[#64748b] font-bold mb-1 uppercase">
                    ELECTIVE TRACK SELECTOR:
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDropdown(activeDropdown === periodKey ? null : periodKey)
                      }
                      className="w-full bg-[#080a0d] hover:bg-[#1b202b] border-2 border-[#000000] rounded px-2.5 py-1.5 flex items-center justify-between font-mono text-xs text-[#f8fafc] text-left shadow-[2px_2px_0px_#000000] transition-colors"
                    >
                      <span className="truncate font-bold">
                        {activeElective?.name} ({activeElective?.code})
                      </span>
                      <ChevronDown
                        size={14}
                        className={`text-[#fbbf24] shrink-0 transition-transform ${
                          activeDropdown === periodKey ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Retro Menu */}
                    {activeDropdown === periodKey && (
                      <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#13171f] border-2 border-[#000000] rounded shadow-[4px_4px_0px_#000000] overflow-hidden">
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
                                    ? 'bg-[#fbbf24] text-[#000000] font-black'
                                    : 'text-[#f8fafc] hover:bg-[#1b202b]'
                                }`}
                              >
                                <div>
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span>{opt.name}</span>
                                    <span className="text-[10px] opacity-80">({opt.code})</span>
                                  </div>
                                  <div className="text-[10px] opacity-75">
                                    Prof: {opt.faculty}
                                  </div>
                                </div>
                                {isSelected && <Check size={14} className="stroke-[3]" />}
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
          <div className="retro-card p-6 text-center text-[#94a3b8] font-mono text-xs">
            [NO PERIODS SCHEDULED FOR {selectedDay.toUpperCase()}]
          </div>
        )}
      </div>
    </div>
  );
}
