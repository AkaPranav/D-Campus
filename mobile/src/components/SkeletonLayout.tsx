'use client';

import React from 'react';

interface SkeletonLayoutProps {
  type?: 'attendance' | 'timetable' | 'assignments';
}

export default function SkeletonLayout({ type = 'attendance' }: SkeletonLayoutProps) {
  return (
    <div className="space-y-4 px-3.5 py-4 animate-pulse max-w-md mx-auto">
      {/* Top Banner Skeleton - Authentic Retro Window */}
      <div className="retro-card overflow-hidden">
        <div className="retro-card-header py-1.5 px-3">
          <div className="flex items-center gap-1.5">
            <span className="retro-dot min" />
            <div className="skeleton-box h-3.5 w-24 rounded-sm" />
          </div>
          <div className="skeleton-box h-3.5 w-16 rounded-sm" />
        </div>

        <div className="p-4 space-y-3">
          {type === 'attendance' ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              {/* Radial Gauge Shimmer */}
              <div className="skeleton-box w-32 h-32 rounded-full border-4 border-[#1b202b]" />
              <div className="grid grid-cols-2 gap-2 w-full pt-1">
                <div className="skeleton-box h-8 rounded-sm" />
                <div className="skeleton-box h-8 rounded-sm" />
              </div>
            </div>
          ) : type === 'timetable' ? (
            <div className="space-y-2.5">
              {/* Day Pills Shimmer */}
              <div className="flex gap-1.5 justify-between">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton-box h-7 flex-1 rounded-sm" />
                ))}
              </div>
              <div className="skeleton-box h-10 w-full rounded-sm" />
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Switcher Shimmer */}
              <div className="flex gap-2">
                <div className="skeleton-box h-8 flex-1 rounded-sm" />
                <div className="skeleton-box h-8 flex-1 rounded-sm" />
              </div>
              <div className="flex gap-1.5">
                <div className="skeleton-box h-5 w-16 rounded-sm" />
                <div className="skeleton-box h-5 w-20 rounded-sm" />
                <div className="skeleton-box h-5 w-20 rounded-sm" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List Cards Skeletons */}
      <div className="space-y-2.5">
        <div className="skeleton-box h-3.5 w-28 rounded-sm ml-0.5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="retro-card overflow-hidden">
            <div className="retro-card-header py-1.5 px-3">
              <div className="skeleton-box h-3.5 w-20 rounded-sm" />
              <div className="skeleton-box h-3.5 w-12 rounded-sm" />
            </div>
            <div className="p-3 space-y-2">
              <div className="skeleton-box h-4 w-44 rounded-sm" />
              <div className="skeleton-box h-2.5 w-full rounded-none" />
              <div className="flex justify-between items-center pt-1 border-t border-[#2d3545]">
                <div className="skeleton-box h-3 w-24 rounded-sm" />
                <div className="skeleton-box h-4 w-20 rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
