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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85">
      <div className="w-full max-w-md bg-[#13171f] border-t-2 sm:border-2 border-[#000000] rounded-t sm:rounded shadow-[0_-4px_0px_#000000] sm:shadow-[6px_6px_0px_#000000] overflow-hidden max-h-[92dvh] flex flex-col">
        {/* Hazard Warning Header */}
        <div className="hazard-stripes py-1 px-4 flex items-center justify-between text-[#000000] font-mono text-[11px] font-black tracking-wider border-b-2 border-[#000000]">
          <div className="flex items-center gap-1.5 bg-[#fbbf24] px-1.5 py-0.5 rounded border border-[#000000]">
            <AlertTriangle size={13} className="stroke-[3]" />
            <span>SUBMISSION SAFETY SHIELD</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/20 rounded transition-colors text-black font-black text-xs"
          >
            [X]
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Assignment Info Header */}
          <div className="retro-card overflow-hidden">
            <div className="retro-card-header py-1.5 px-3">
              <span className="font-mono text-[10px] font-black text-[#000000] bg-[#06b6d4] px-1.5 py-0.2 rounded border border-[#000000]">
                {assignment.subjectCode}
              </span>
              <span className="font-mono text-[10px] font-black text-[#fbbf24]">
                MAX: {assignment.maxMarks} MARKS
              </span>
            </div>

            <div className="p-3 space-y-2">
              <h3 className="font-mono text-xs font-bold text-[#f8fafc]">
                {assignment.subjectName}
              </h3>

              <div className="retro-inset p-2 text-[11px] font-mono text-[#f8fafc]">
                <span className="text-[#64748b]">Topic: </span>
                {assignment.topic}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b]">
                <span>Due: {assignment.submissionDate}</span>
                <span>Pass Marks: {assignment.passMarks}</span>
              </div>
            </div>
          </div>

          {/* Warning Callout - Hard Retro */}
          <div className="bg-[#fbbf24]/10 border-2 border-[#000000] p-2.5 rounded shadow-[2px_2px_0px_#000000] flex items-start gap-2">
            <ShieldAlert size={18} className="text-[#fbbf24] shrink-0 mt-0.5" />
            <div className="text-[11px] font-mono text-[#f8fafc] leading-tight">
              <strong className="text-[#fbbf24]">IRREVERSIBLE ACTION: </strong>
              The university portal does not allow resubmission, overwriting, or deleting once uploaded.
            </div>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-[#94a3b8] mb-1 uppercase">
              ATTACH DOCUMENT (.PDF, .DOC, .DOCX &lt; 5MB)
            </label>

            <label className="border-2 border-dashed border-[#2d3545] hover:border-[#fbbf24] bg-[#080a0d] rounded p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center shadow-[2px_2px_0px_#000000]">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                disabled={isSubmitting || isSubmitted}
              />
              <Upload size={22} className="text-[#06b6d4] mb-1.5" />
              {selectedFile ? (
                <div className="flex items-center gap-1.5 font-mono text-xs text-[#10b981] font-bold">
                  <FileText size={13} />
                  <span>{selectedFile.name}</span>
                  <span className="text-[#64748b] text-[10px]">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <>
                  <span className="font-mono text-xs text-[#f8fafc] font-black uppercase">
                    Tap to select file
                  </span>
                  <span className="text-[10px] font-mono text-[#64748b] mt-0.5">
                    PDF or Word format up to 5MB
                  </span>
                </>
              )}
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-[#f43f5e]/10 border-2 border-[#000000] p-2 rounded text-[11px] text-[#f43f5e] font-mono font-bold leading-tight">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Success Message */}
          {isSubmitted && (
            <div className="bg-[#10b981]/15 border-2 border-[#000000] p-3 rounded text-center space-y-1">
              <CheckCircle size={22} className="text-[#10b981] mx-auto" />
              <div className="font-mono text-xs font-black text-[#10b981] uppercase">
                ASSIGNMENT SUBMITTED SUCCESSFULLY!
              </div>
            </div>
          )}

          {/* Mandatory Checkbox */}
          {!isSubmitted && (
            <label className="flex items-start gap-2 p-2 rounded bg-[#080a0d] border-2 border-[#000000] shadow-[2px_2px_0px_#000000] cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 accent-[#fbbf24] w-3.5 h-3.5 rounded cursor-pointer"
                disabled={isSubmitting}
              />
              <span className="text-[10px] text-[#f8fafc] font-mono leading-tight">
                I verify this is my genuine and final solution. Submissions cannot be undone.
              </span>
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 btn-retro py-2 text-xs text-[#94a3b8] hover:text-[#f8fafc]"
            >
              CANCEL
            </button>

            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={!selectedFile || !confirmed || isSubmitting || isSubmitted}
              className="flex-1 btn-retro btn-retro-gold py-2 text-xs font-black flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>UPLOADING...</span>
                </>
              ) : isSubmitted ? (
                <span>SUBMITTED ✓</span>
              ) : (
                <span>CONFIRM &amp; SUBMIT</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
