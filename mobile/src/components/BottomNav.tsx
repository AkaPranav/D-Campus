'use client';

import React from 'react';
import { BarChart3, Calendar, FileText, Settings } from 'lucide-react';

export type ActiveTab = 'attendance' | 'timetable' | 'assignments' | 'settings';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  assignmentCount?: number;
}

export default function BottomNav({ activeTab, onChangeTab, assignmentCount = 12 }: BottomNavProps) {
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#13171f] border-t-2 border-[#000000] pb-safe shadow-[0_-2px_0px_#000000]">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                isActive ? 'text-[#fbbf24]' : 'text-[#64748b] hover:text-[#94a3b8]'
              }`}
            >
              {/* Solid Active Tab Top Notch - ZERO GLOW */}
              {isActive && (
                <span className="absolute top-0 left-2 right-2 h-1 bg-[#fbbf24] border-b border-[#000000]" />
              )}

              <div className="relative">
                <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 bg-[#fbbf24] text-[#000000] font-mono font-black text-[9px] px-1 rounded border border-[#000000] leading-none py-0.5">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="font-mono text-[9px] font-black mt-1 tracking-tight uppercase">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
