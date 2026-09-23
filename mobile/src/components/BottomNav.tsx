'use client';

import React from 'react';
import { BarChart3, Calendar, FileText, Settings } from 'lucide-react';

export type ActiveTab = 'attendance' | 'timetable' | 'assignments' | 'settings';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  assignmentCount?: number;
}

export default function BottomNav({ activeTab, onChangeTab, assignmentCount = 16 }: BottomNavProps) {
  const tabs = [
    {
      id: 'attendance' as ActiveTab,
      label: 'ATTENDANCE',
      icon: BarChart3,
    },
    {
      id: 'timetable' as ActiveTab,
      label: 'TIMETABLE',
      icon: Calendar,
    },
    {
      id: 'assignments' as ActiveTab,
      label: 'NOTES & DUE',
      icon: FileText,
      badge: assignmentCount > 0 ? String(assignmentCount) : undefined,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'SETTINGS',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#111827] border-t border-[#374151] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                isActive ? 'text-[#f59e0b]' : 'text-[#9ca3af] hover:text-[#f3f4f6]'
              }`}
            >
              {/* Active Tab Top Indicator Bar */}
              {isActive && (
                <span className="absolute top-0 left-4 right-4 h-0.5 bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
              )}

              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#f59e0b] text-[#000000] font-mono font-bold text-[9px] px-1 rounded-full border border-[#000000] leading-tight">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="font-mono text-[9px] font-bold mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
