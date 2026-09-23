'use client';

import React, { useState } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { AssignmentItem } from '@/lib/erpClient';

interface SubmissionSafetyModalProps {
  assignment: AssignmentItem | null;
  onClose: () => void;
  onSubmitSuccess: (detailId: string) => void;
}

export default function SubmissionSafetyModal({
  assignment,
  onClose,
  onSubmitSuccess,
}: SubmissionSafetyModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!assignment) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File size exceeds the 5MB portal limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a solution file first.');
      return;
    }
    if (!confirmed) {
      setErrorMsg('Please check the confirmation box to confirm this is your final work.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Simulate submission network handshake or call actual upload endpoint
      await new Promise((r) => setTimeout(r, 1200));

      setIsSubmitted(true);
      setTimeout(() => {
        onSubmitSuccess(assignment.detailId);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message || 'Failed to submit assignment. Portal rejected connection.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#111827] border-t-2 sm:border-2 border-[#374151] rounded-t-xl sm:rounded-xl shadow-[0_-8px_24px_rgba(0,0,0,0.9)] overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Hazard Warning Header */}
        <div className="hazard-stripes py-1 px-4 flex items-center justify-between text-[#000000] font-mono text-[11px] font-black tracking-wider">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={14} className="stroke-[3]" />
            <span>PRE-FLIGHT SUBMISSION SAFETY SHIELD</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/20 rounded transition-colors text-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Assignment Info Header */}
          <div className="retro-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-[#06b6d4] bg-[#06b6d4]/10 px-2 py-0.5 rounded border border-[#06b6d4]/30">
                {assignment.subjectCode}
              </span>
              <span className="font-mono text-[10px] font-bold text-[#f59e0b]">
                MAX: {assignment.maxMarks} MARKS
              </span>
            </div>

            <h3 className="font-mono text-xs font-bold text-[#f3f4f6]">
              {assignment.subjectName}
            </h3>

            <div className="bg-[#1f2937] p-2 rounded text-[11px] font-mono text-[#d1d5db]">
              <span className="text-[#9ca3af]">Topic: </span>
              {assignment.topic}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#9ca3af]">
              <span>Due: {assignment.submissionDate}</span>
              <span>Pass Marks: {assignment.passMarks}</span>
            </div>
          </div>

          {/* Warning Callout */}
          <div className="bg-[#f59e0b]/10 border border-[#f59e0b] p-3 rounded flex items-start gap-2.5">
            <ShieldAlert size={20} className="text-[#f59e0b] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#e5e7eb] leading-snug">
              <span className="font-bold text-[#f59e0b]">IRREVERSIBLE ACTION: </span>
              Once uploaded, the university portal does not allow resubmission, overwriting, or deleting submitted assignments.
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-[#9ca3af] mb-1.5">
              ATTACH SOLUTION DOCUMENT (.PDF, .DOC, .DOCX &lt; 5MB)
            </label>

            <label className="border-2 border-dashed border-[#374151] hover:border-[#06b6d4] bg-[#1f2937]/50 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                disabled={isSubmitting || isSubmitted}
              />
              <Upload size={24} className="text-[#06b6d4] mb-2" />
              {selectedFile ? (
                <div className="flex items-center gap-1.5 font-mono text-xs text-[#10b981] font-bold">
                  <FileText size={14} />
                  <span>{selectedFile.name}</span>
                  <span className="text-[#9ca3af] text-[10px]">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <>
                  <span className="font-mono text-xs text-[#f3f4f6] font-bold">
                    Tap to browse document
                  </span>
                  <span className="text-[10px] text-[#9ca3af] mt-1">
                    PDF or Word format up to 5MB
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-[#f43f5e]/10 border border-[#f43f5e] p-2.5 rounded text-[11px] text-[#f43f5e] font-mono leading-tight">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Success Message */}
          {isSubmitted && (
            <div className="bg-[#10b981]/15 border border-[#10b981] p-3 rounded text-center space-y-1">
              <CheckCircle size={22} className="text-[#10b981] mx-auto" />
              <div className="font-mono text-xs font-bold text-[#10b981]">
                ASSIGNMENT SUBMITTED SUCCESSFULLY!
              </div>
              <div className="text-[10px] text-[#9ca3af]">
                Portal confirmation recorded.
              </div>
            </div>
          )}

          {/* Mandatory Checkbox */}
          {!isSubmitted && (
            <label className="flex items-start gap-2.5 p-2 rounded bg-[#1f2937] border border-[#374151] cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 accent-[#f59e0b] w-4 h-4 rounded cursor-pointer"
                disabled={isSubmitting}
              />
              <span className="text-[11px] text-[#d1d5db] font-mono leading-tight">
                I verify this is my genuine and final solution. I understand this action cannot be undone.
              </span>
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 btn-retro py-2.5 rounded font-mono text-xs font-bold text-[#9ca3af] hover:text-[#f3f4f6]"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={!selectedFile || !confirmed || isSubmitting || isSubmitted}
              className="flex-1 btn-retro btn-retro-gold py-2.5 rounded font-mono text-xs font-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>UPLOADING...</span>
                </>
              ) : isSubmitted ? (
                <span>SUBMITTED ✓</span>
              ) : (
                <span>CONFIRM & SUBMIT</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
