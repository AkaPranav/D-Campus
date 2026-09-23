'use client';

import React, { useState } from 'react';
import { Download, Upload, Search, FileText, Lock, Calendar, BookOpen, AlertCircle } from 'lucide-react';
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
        return a.isOverdue ? 1 : -1; // Active first
      }
      return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
    }
    return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
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
      let filename = `${item.subjectCode}_${item.detailId}.pdf`;
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
    <div className="space-y-4 px-4 py-4 pb-24 max-w-md mx-auto">
      {/* Subtab Segmented Switcher */}
      <div className="retro-card p-1.5 flex gap-1.5">
        <button
          onClick={() => {
            setActiveCategory('ASSIGNMENT');
            setSelectedSubject('ALL');
          }}
          className={`flex-1 py-2 rounded font-mono text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeCategory === 'ASSIGNMENT'
              ? 'bg-[#f59e0b] text-[#000000] shadow-[2px_2px_0px_#000000]'
              : 'text-[#9ca3af] hover:text-[#f3f4f6]'
          }`}
        >
          <span>⚡ ACTIVE DUE</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeCategory === 'ASSIGNMENT'
                ? 'bg-[#000000] text-[#f59e0b]'
                : 'bg-[#1f2937] text-[#9ca3af]'
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
          className={`flex-1 py-2 rounded font-mono text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
            activeCategory === 'STUDY_MATERIAL'
              ? 'bg-[#06b6d4] text-[#000000] shadow-[2px_2px_0px_#000000]'
              : 'text-[#9ca3af] hover:text-[#f3f4f6]'
          }`}
        >
          <BookOpen size={14} />
          <span>LECTURE NOTES</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeCategory === 'STUDY_MATERIAL'
                ? 'bg-[#000000] text-[#06b6d4]'
                : 'bg-[#1f2937] text-[#9ca3af]'
            }`}
          >
            {lectureNotesCount}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            activeCategory === 'ASSIGNMENT'
              ? 'Search assignments or subjects...'
              : 'Search lecture notes or topics...'
          }
          className="w-full bg-[#111827] border border-[#374151] rounded px-3 py-2 pl-9 text-xs text-[#f3f4f6] font-mono placeholder-[#6b7280] focus:outline-none focus:border-[#f59e0b] transition-colors"
        />
      </div>

      {/* Subject Filter Chips */}
      {subjectList.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold shrink-0 transition-colors ${
              selectedSubject === 'ALL'
                ? 'bg-[#f3f4f6] text-[#000000]'
                : 'bg-[#111827] text-[#9ca3af] border border-[#374151]'
            }`}
          >
            ALL ({categoryItems.length})
          </button>
          {subjectList.map((sub) => {
            const count = categoryItems.filter((i) => i.subjectName === sub).length;
            const isSelected = selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold shrink-0 transition-colors truncate max-w-[160px] ${
                  isSelected
                    ? 'bg-[#f59e0b] text-[#000000]'
                    : 'bg-[#111827] text-[#9ca3af] border border-[#374151]'
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
        {sortedItems.map((item) => {
          const isDownloading = downloadingId === item.detailId;

          if (activeCategory === 'STUDY_MATERIAL') {
            // Lecture Notes Card (Zero deadlines, zero pass marks)
            return (
              <div key={item.detailId} className="retro-card p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#06b6d4] bg-[#06b6d4]/10 px-1.5 py-0.5 rounded border border-[#06b6d4]/30">
                        {item.subjectCode}
                      </span>
                      <span className="font-mono text-[10px] text-[#9ca3af] truncate">
                        {item.subjectName}
                      </span>
                    </div>
                    <h3 className="font-mono text-xs font-bold text-[#f3f4f6] leading-snug">
                      {item.topic}
                    </h3>
                  </div>

                  <span className="font-mono text-[9px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30 shrink-0">
                    NOTES
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#1f2937]">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-[#9ca3af]">
                    <Calendar size={11} />
                    <span>POSTED: {item.submissionDate}</span>
                  </div>

                  <button
                    onClick={() => handleDownload(item)}
                    disabled={isDownloading}
                    className="btn-retro btn-retro-cyan px-2.5 py-1 rounded text-[11px] font-mono font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Download size={12} className={isDownloading ? 'animate-bounce' : ''} />
                    <span>{isDownloading ? 'DOWNLOADING...' : 'DOWNLOAD'}</span>
                  </button>
                </div>
              </div>
            );
          }

          // Active / Overdue Assignment Card
          return (
            <div
              key={item.detailId}
              className={`retro-card p-3.5 space-y-2.5 ${
                item.isOverdue ? 'opacity-70 bg-[#0f1422]' : 'bg-[#111827]'
              }`}
            >
              {/* Card Header & Urgency Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-[#06b6d4] bg-[#06b6d4]/10 px-1.5 py-0.5 rounded border border-[#06b6d4]/30">
                      {item.subjectCode}
                    </span>
                    <span className="font-mono text-[10px] text-[#9ca3af] truncate">
                      {item.subjectName}
                    </span>
                  </div>

                  <h3 className="font-mono text-xs font-bold text-[#f3f4f6] leading-snug">
                    {item.topic}
                  </h3>
                </div>

                {/* Status / Urgency Badge */}
                {item.isOverdue ? (
                  <span className="font-mono text-[9px] font-bold text-[#6b7280] bg-[#1f2937] px-2 py-0.5 rounded border border-[#374151] shrink-0 flex items-center gap-1">
                    <Lock size={9} />
                    CLOSED
                  </span>
                ) : (
                  <span className="font-mono text-[9px] font-black text-[#f59e0b] bg-[#f59e0b]/15 px-2 py-0.5 rounded border border-[#f59e0b]/40 shrink-0">
                    ⚡ DUE: {item.submissionDate}
                  </span>
                )}
              </div>

              {/* Marks & Date Row */}
              <div className="flex items-center justify-between text-[10px] font-mono text-[#9ca3af] bg-[#1f2937]/60 px-2 py-1 rounded">
                <span>Max Marks: <strong className="text-[#f3f4f6]">{item.maxMarks}</strong></span>
                <span>Pass Marks: <strong className="text-[#10b981]">{item.passMarks}</strong></span>
                <span>Deadline: <strong className="text-[#f59e0b]">{item.submissionDate}</strong></span>
              </div>

              {/* Action Buttons: Download PDF & Submit Solution */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#1f2937]">
                <button
                  onClick={() => handleDownload(item)}
                  disabled={isDownloading}
                  className="flex-1 btn-retro py-1.5 rounded text-[11px] font-mono font-bold text-[#06b6d4] hover:text-[#f3f4f6] flex items-center justify-center gap-1.5"
                >
                  <Download size={12} className={isDownloading ? 'animate-bounce' : ''} />
                  <span>{isDownloading ? 'FETCHING...' : 'PROBLEM PDF'}</span>
                </button>

                {item.isOverdue ? (
                  <button
                    disabled
                    className="flex-1 btn-retro py-1.5 rounded text-[11px] font-mono font-bold text-[#6b7280] bg-[#1f2937] cursor-not-allowed opacity-60 flex items-center justify-center gap-1"
                  >
                    <Lock size={12} />
                    <span>CLOSED</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSubmittingAssignment(item)}
                    className="flex-1 btn-retro btn-retro-gold py-1.5 rounded text-[11px] font-mono font-black flex items-center justify-center gap-1.5"
                  >
                    <Upload size={12} />
                    <span>SUBMIT</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {sortedItems.length === 0 && (
          <div className="retro-card p-6 text-center text-[#9ca3af] font-mono text-xs">
            No items matching your criteria.
          </div>
        )}
      </div>

      {/* Pre-Flight Submission Safety Shield Modal */}
      {submittingAssignment && (
        <SubmissionSafetyModal
          assignment={submittingAssignment}
          onClose={() => setSubmittingAssignment(null)}
          onSubmitSuccess={(detailId) => {
            alert('Assignment submitted successfully! Submission ID: ' + detailId);
          }}
        />
      )}
    </div>
  );
}
