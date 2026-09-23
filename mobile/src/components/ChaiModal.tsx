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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="w-full max-w-sm bg-[#13171f] border-2 border-[#000000] rounded shadow-[6px_6px_0px_#000000] overflow-hidden">
        {/* Retro Header */}
        <div className="bg-[#fbbf24] px-3.5 py-2 flex items-center justify-between text-[#000000] border-b-2 border-[#000000]">
          <div className="flex items-center gap-2">
            <Coffee size={16} className="stroke-[2.5]" />
            <span className="font-mono text-xs font-black tracking-wider uppercase">
              BUY ME A CHAI ☕
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/15 rounded transition-colors text-black font-mono font-black text-xs"
          >
            [X]
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-3.5">
          <div className="space-y-1">
            <h3 className="font-mono text-xs font-black text-[#f8fafc] uppercase">
              Keep D-Campus Free &amp; Ad-Free
            </h3>
            <p className="text-[11px] font-mono text-[#94a3b8] leading-relaxed">
              Automated zero-CAPTCHA solving, background live sync, and safe bunk calculators. Fuel development with a warm cup of cutting chai!
            </p>
          </div>

          {/* Contribution Tier Chips - Tactile Retro */}
          <div className="grid grid-cols-2 gap-2">
            {CHIPS.map((chip, idx) => (
              <button
                key={`${chip.amount}-${idx}`}
                onClick={() => setSelectedAmount(chip.amount)}
                className={`py-2 px-2 rounded-sm font-mono text-[11px] font-black transition-all border-2 border-[#000000] ${
                  selectedAmount === chip.amount
                    ? 'bg-[#fbbf24] text-[#000000] shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#080a0d] text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* UPI ID & Quick Copy Box */}
          <div className="space-y-1">
            <span className="font-mono text-[9px] font-black text-[#64748b] block uppercase">
              OFFICIAL UPI ID
            </span>
            <div className="flex items-center gap-2 bg-[#080a0d] border-2 border-[#000000] rounded p-2 shadow-[2px_2px_0px_#000000]">
              <span className="font-mono text-xs text-[#10b981] font-bold flex-1 truncate">
                {upiId}
              </span>
              <button
                onClick={handleCopy}
                className="btn-retro px-2 py-0.5 text-[9px] flex items-center gap-1 shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={11} className="text-[#10b981]" />
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
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
              className="w-full btn-retro btn-retro-gold py-2.5 text-xs flex items-center justify-center gap-2 block text-center"
            >
              <span>PAY ₹{selectedAmount} VIA ANY UPI APP</span>
            </a>

            <button
              onClick={() => setShowQr(!showQr)}
              className="w-full py-1 text-center font-mono text-[10px] text-[#06b6d4] font-bold hover:underline flex items-center justify-center gap-1 uppercase"
            >
              <QrCode size={12} />
              <span>{showQr ? '[HIDE QR CODE]' : '[SCAN VIA QR CODE]'}</span>
            </button>

            {showQr && (
              <div className="flex flex-col items-center justify-center p-3 bg-white border-2 border-[#000000] rounded shadow-[3px_3px_0px_#000000]">
                <img
                  src={qrUrl}
                  alt="UPI QR Code"
                  className="w-36 h-36"
                  loading="lazy"
                />
                <span className="font-mono text-[9px] text-black font-black mt-1 uppercase">
                  Scan via GPay / PhonePe / Paytm
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
