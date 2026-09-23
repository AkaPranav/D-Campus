'use client';

import React, { useState } from 'react';
import { Coffee, X, Copy, Check, QrCode } from 'lucide-react';

interface ChaiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHIPS = [
  { amount: 20, label: '₹20 Cutting Chai' },
  { amount: 50, label: '₹50 Masala Chai' },
  { amount: 100, label: '₹100 Chai + Samosa' },
  { amount: 200, label: '₹200 Super Supporter' },
];

export default function ChaiModal({ isOpen, onClose }: ChaiModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [showQr, setShowQr] = useState(false);
  const upiId = '6396950805@slc';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const upiUri = `upi://pay?pa=${upiId}&pn=Pranav%20Pandey&am=${selectedAmount}&cu=INR&tn=D-Campus%20Support`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    upiUri
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm bg-[#111827] border-2 border-[#f59e0b] rounded-xl shadow-[0_0_24px_rgba(245,158,11,0.2)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#f59e0b] px-4 py-2.5 flex items-center justify-between text-[#000000]">
          <div className="flex items-center gap-2">
            <Coffee size={18} className="stroke-[2.5]" />
            <span className="font-mono text-xs font-black tracking-wider uppercase">
              BUY ME A CHAI ☕
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/15 rounded transition-colors text-black"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4">
          <div className="text-center space-y-1">
            <h3 className="font-mono text-sm font-bold text-[#f3f4f6]">
              Keep D-Campus Free &amp; Fast
            </h3>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              Built with zero ads, automated background CAPTCHA solving, and 24/7 session keep-alive. Fuel ongoing development with a hot cup of tea!
            </p>
          </div>

          {/* Contribution Tier Chips */}
          <div className="grid grid-cols-2 gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip.amount}
                onClick={() => setSelectedAmount(chip.amount)}
                className={`py-2 px-2 rounded font-mono text-xs font-bold transition-all border ${
                  selectedAmount === chip.amount
                    ? 'bg-[#f59e0b] text-[#000000] border-[#000000] shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#1f2937] text-[#d1d5db] border-[#374151] hover:border-[#f59e0b]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* UPI ID & Quick Copy Box */}
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] font-bold text-[#9ca3af] block">
              OFFICIAL UPI ID
            </span>
            <div className="flex items-center gap-2 bg-[#1f2937] border border-[#374151] rounded p-2">
              <span className="font-mono text-xs text-[#10b981] font-bold flex-1 truncate">
                {upiId}
              </span>
              <button
                onClick={handleCopy}
                className="btn-retro px-2.5 py-1 rounded text-[10px] font-mono font-bold text-[#f3f4f6] flex items-center gap-1 shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={12} className="text-[#10b981]" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct UPI App Trigger & QR Code Toggle */}
          <div className="space-y-2 pt-1">
            <a
              href={upiUri}
              className="w-full btn-retro btn-retro-gold py-2.5 rounded font-mono text-xs font-black flex items-center justify-center gap-2 block text-center"
            >
              <span>PAY ₹{selectedAmount} VIA ANY UPI APP</span>
            </a>

            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full py-1.5 text-center font-mono text-[11px] text-[#06b6d4] hover:underline flex items-center justify-center gap-1"
            >
              <QrCode size={13} />
              <span>{showQr ? 'Hide QR Code' : 'Scan via QR Code'}</span>
            </button>

            {showQr && (
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-[#374151]">
                <img
                  src={qrUrl}
                  alt="UPI QR Code"
                  className="w-36 h-36"
                  loading="lazy"
                />
                <span className="font-mono text-[10px] text-black font-bold mt-1">
                  Scan with GPay / PhonePe / Paytm
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
