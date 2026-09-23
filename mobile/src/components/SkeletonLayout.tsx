'use client';

import React from 'react';

interface SkeletonLayoutProps {
  type?: 'attendance' | 'timetable' | 'assignments';
}

export default function SkeletonLayout({ type = 'attendance' }: SkeletonLayoutProps) {
  return (
    <div className="space-y-4 px-4 py-4 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="retro-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="skeleton-box h-4 w-32 rounded" />
          <div className="skeleton-box h-4 w-16 rounded" />
        </div>

        {type === 'attendance' ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            {/* Radial Gauge Shimmer */}
            <div className="skeleton-box w-36 h-36 rounded-full border-4 border-[#1f2937]" />
            <div className="skeleton-box h-5 w-48 rounded" />
            <div className="skeleton-box h-8 w-60 rounded" />
          </div>
        ) : type === 'timetable' ? (
          <div className="space-y-3">
            {/* Day Pills Shimmer */}
            <div className="flex gap-2 justify-between py-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton-box h-8 flex-1 rounded" />
              ))}
            </div>
            <div className="skeleton-box h-12 w-full rounded" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Segmented Switcher Shimmer */}
            <div className="flex gap-2">
              <div className="skeleton-box h-9 flex-1 rounded" />
              <div className="skeleton-box h-9 flex-1 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton-box h-6 w-16 rounded" />
              <div className="skeleton-box h-6 w-20 rounded" />
              <div className="skeleton-box h-6 w-20 rounded" />
            </div>
          </div>
        )}
      </div>

      {/* List Cards Skeletons */}
      <div className="space-y-3">
        <div className="skeleton-box h-4 w-28 rounded ml-1" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="retro-card p-3.5 space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="skeleton-box h-4 w-44 rounded" />
              <div className="skeleton-box h-4 w-12 rounded" />
            </div>
            <div className="skeleton-box h-3 w-32 rounded" />
            <div className="flex justify-between items-center pt-1">
              <div className="skeleton-box h-3 w-24 rounded" />
              <div className="skeleton-box h-6 w-28 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
