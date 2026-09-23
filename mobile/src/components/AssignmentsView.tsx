'use client';

import React, { useState } from 'react';
import { Download, Upload, Search, Lock, Calendar, BookOpen } from 'lucide-react';
import { AssignmentItem } from '@/lib/erpClient';
import SubmissionSafetyModal from './SubmissionSafetyModal';

interface AssignmentsViewProps {
  assignments: AssignmentItem[];
  sessionCookies: string;
}

export default function AssignmentsView({ assignments, sessionCookies }: AssignmentsViewProps) {
  const [activeCategory, setActiveCategory] = useState<'ASSIGNMENT' | 'STUDY_MATERIAL'>('ASSIGNMENT');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [submittingAssignment, setSubmittingAssignment] = useState<AssignmentItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter items by category
  const categoryItems = assignments.filter((item) => item.category === activeCategory);

  // Extract unique subjects for chips
  const subjectList = Array.from(new Set(categoryItems.map((item) => item.subjectName))).filter(Boolean);

  // Filter by subject & search term
  const filteredItems = categoryItems.filter((item) => {
    const matchesSubject = selectedSubject === 'ALL' || item.subjectName === selectedSubject;
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Sort assignments: Active items due soonest first
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (activeCategory === 'ASSIGNMENT') {
      if (a.isOverdue !== b.isOverdue) {
        return a.isOverdue ? 1 : -1;
      }
      return (a.dueDateTimestamp || 0) - (b.dueDateTimestamp || 0);
    }
    return (b.dueDateTimestamp || 0) - (a.dueDateTimestamp || 0);
  });

  const activeAssignmentsCount = assignments.filter(
    (a) => a.category === 'ASSIGNMENT' && !a.isOverdue
  ).length;
  const lectureNotesCount = assignments.filter(
    (a) => a.category === 'STUDY_MATERIAL'
  ).length;

  const handleDownload = async (item: AssignmentItem) => {
    setDownloadingId(item.detailId);
    try {
      const url = `/api/download?detailId=${encodeURIComponent(item.detailId)}&cookies=${encodeURIComponent(
        sessionCookies
      )}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const contentDisposition = res.headers.get('content-disposition');
      let filename = `${item.subjectCode || 'COER'}_${item.detailId}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download error:', e);
      alert('Unable to download file. Please check connection.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-4 px-3.5 py-4 pb-24 max-w-md mx-auto">
      {/* Subtab Segmented Switcher - Solid Retro Buttons */}
      <div className="retro-card p-1.5 flex gap-1.5">
        <button
          onClick={() => {
            setActiveCategory('ASSIGNMENT');
            setSelectedSubject('ALL');
          }}
          className={`flex-1 py-2 rounded-sm font-mono text-xs font-black flex items-center justify-center gap-1.5 transition-all border ${
            activeCategory === 'ASSIGNMENT'
              ? 'bg-[#fbbf24] text-[#000000] border-[#000000] shadow-[2px_2px_0px_#000000]'
              : 'bg-[#080a0d] text-[#94a3b8] border-[#2d3545] hover:text-[#f8fafc]'
          }`}
        >
          <span>⚡ ACTIVE DUE</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${
              activeCategory === 'ASSIGNMENT'
                ? 'bg-[#000000] text-[#fbbf24] border-[#000000]'
                : 'bg-[#1b202b] text-[#94a3b8] border-[#2d3545]'
            }`}
          >
            {activeAssignmentsCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveCategory('STUDY_MATERIAL');
            setSelectedSubject('ALL');
          }}
          className={`flex-1 py-2 rounded-sm font-mono text-xs font-black flex items-center justify-center gap-1.5 transition-all border ${
            activeCategory === 'STUDY_MATERIAL'
              ? 'bg-[#06b6d4] text-[#000000] border-[#000000] shadow-[2px_2px_0px_#000000]'
              : 'bg-[#080a0d] text-[#94a3b8] border-[#2d3545] hover:text-[#f8fafc]'
          }`}
        >
          <BookOpen size={13} />
          <span>NOTES</span>
          <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${
              activeCategory === 'STUDY_MATERIAL'
                ? 'bg-[#000000] text-[#06b6d4] border-[#000000]'
                : 'bg-[#1b202b] text-[#94a3b8] border-[#2d3545]'
            }`}
          >
            {lectureNotesCount}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            activeCategory === 'ASSIGNMENT'
              ? 'Search active assignments or topics...'
              : 'Search lecture notes & materials...'
          }
          className="w-full bg-[#080a0d] border-2 border-[#000000] rounded px-3 py-2 pl-8 text-xs text-[#f8fafc] font-mono placeholder-[#64748b] focus:outline-none focus:border-[#fbbf24] shadow-[2px_2px_0px_#000000] transition-colors"
        />
      </div>

      {/* Subject Filter Chips */}
      {subjectList.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-2.5 py-1 rounded-sm font-mono text-[10px] font-black shrink-0 transition-colors border ${
              selectedSubject === 'ALL'
                ? 'bg-[#f8fafc] text-[#000000] border-[#000000] shadow-[1.5px_1.5px_0px_#000000]'
                : 'bg-[#080a0d] text-[#94a3b8] border-[#2d3545]'
            }`}
          >
            ALL ({categoryItems.length})
          </button>
          {subjectList.map((sub, idx) => {
            const count = categoryItems.filter((i) => i.subjectName === sub).length;
            const isSelected = selectedSubject === sub;
            return (
              <button
                key={`${sub}-${idx}`}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 py-1 rounded-sm font-mono text-[10px] font-black shrink-0 transition-colors border ${
                  isSelected
                    ? 'bg-[#fbbf24] text-[#000000] border-[#000000] shadow-[1.5px_1.5px_0px_#000000]'
                    : 'bg-[#080a0d] text-[#94a3b8] border-[#2d3545]'
                }`}
              >
                {sub} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {sortedItems.map((item, idx) => {
          const isDownloading = downloadingId === item.detailId;

          if (activeCategory === 'STUDY_MATERIAL') {
            // Lecture Notes Card (Zero deadlines, zero pass marks)
            return (
              <div key={`note-${item.detailId || item.assignmentId}-${idx}`} className="retro-card overflow-hidden">
                <div className="retro-card-header py-1.5 px-3">
                  <span className="font-mono text-[10px] font-black text-[#000000] bg-[#06b6d4] px-1.5 py-0.2 rounded border border-[#000000]">
                    {item.subjectCode || 'NOTES'}
                  </span>
                  <span className="retro-badge safe text-[9px]">
                    STUDY MATERIAL
                  </span>
                </div>

                <div className="p-3 space-y-2">
                  <div className="text-[10px] text-[#94a3b8] font-mono truncate font-bold">
                    {item.subjectName}
                  </div>
                  <h3 className="font-mono text-xs font-bold text-[#f8fafc] leading-snug">
                    {item.topic}
                  </h3>

                  <div className="flex items-center justify-between pt-1 border-t border-[#2d3545]">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#64748b]">
                      <Calendar size={11} />
                      <span>POSTED: {item.submissionDate}</span>
                    </div>

                    <button
                      onClick={() => handleDownload(item)}
                      disabled={isDownloading}
                      className="btn-retro btn-retro-cyan px-2.5 py-1 text-[10px] flex items-center gap-1.5"
                    >
                      <Download size={11} />
                      <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          // Active / Overdue Assignment Card
          return (
            <div
              key={`asg-${item.detailId || item.assignmentId}-${idx}`}
              className={`retro-card overflow-hidden ${
                item.isOverdue ? 'opacity-65 bg-[#0e1218]' : ''
              }`}
            >
              {/* Card Titlebar */}
              <div className="retro-card-header py-1.5 px-3">
                <span className="font-mono text-[10px] font-black text-[#000000] bg-[#06b6d4] px-1.5 py-0.2 rounded border border-[#000000]">
                  {item.subjectCode || 'ASG'}
                </span>

                {item.isOverdue ? (
                  <span className="retro-badge ghost text-[9px] flex items-center gap-1">
                    <Lock size={9} />
                    CLOSED
                  </span>
                ) : (
                  <span className="retro-badge warning text-[9px]">
                    ⚡ DUE: {item.submissionDate}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-3 space-y-2">
                <div className="text-[10px] text-[#94a3b8] font-mono truncate font-bold">
                  {item.subjectName}
                </div>
                <h3 className="font-mono text-xs font-bold text-[#f8fafc] leading-snug">
                  {item.topic}
                </h3>

                {/* Inset Metrics Bar */}
                <div className="retro-inset p-2 grid grid-cols-3 gap-1 text-[10px] font-mono text-center">
                  <div>
                    <span className="text-[#64748b] block text-[9px]">MAX</span>
                    <strong className="text-[#f8fafc]">{item.maxMarks}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[9px]">PASS</span>
                    <strong className="text-[#10b981]">{item.passMarks}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748b] block text-[9px]">DEADLINE</span>
                    <strong className="text-[#fbbf24]">{item.submissionDate}</strong>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#2d3545]">
                  <button
                    onClick={() => handleDownload(item)}
                    disabled={isDownloading}
                    className="flex-1 btn-retro py-1.5 text-[10px] text-[#06b6d4] hover:text-[#ffffff] flex items-center justify-center gap-1"
                  >
                    <Download size={11} />
                    <span>{isDownloading ? 'FETCHING...' : 'PROBLEM PDF'}</span>
                  </button>

                  {item.isOverdue ? (
                    <button
                      disabled
                      className="flex-1 btn-retro py-1.5 text-[10px] text-[#64748b] flex items-center justify-center gap-1"
                    >
                      <Lock size={11} />
                      <span>CLOSED</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setSubmittingAssignment(item)}
                      className="flex-1 btn-retro btn-retro-gold py-1.5 text-[10px] flex items-center justify-center gap-1"
                    >
                      <Upload size={11} />
                      <span>SUBMIT</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {sortedItems.length === 0 && (
          <div className="retro-card p-6 text-center text-[#94a3b8] font-mono text-xs">
            [NO ASSIGNMENTS MATCHING CRITERIA]
          </div>
        )}
      </div>

      {/* Pre-Flight Submission Safety Shield Modal */}
      {submittingAssignment && (
        <SubmissionSafetyModal
          assignment={submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSubmitSuccess={(detailId) => {
            alert('Assignment submitted successfully! Detail ID: ' + detailId);
          }}
        />
      )}
    </div>
  );
}
