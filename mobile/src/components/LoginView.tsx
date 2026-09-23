'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (userId: string, pass: string, studentData: any, cookies: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setErrorMessage('Please enter both Student ID and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userId.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Authentication failed. Please verify credentials.');
        setIsLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('dcampus_user', userId.trim());
        localStorage.setItem('dcampus_pass', password.trim());
        localStorage.setItem('dcampus_auto_login', 'true');
      }

      onLoginSuccess(userId.trim(), password.trim(), data.student, data.sessionCookies || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message || 'Network connection failed. Please retry.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-5 select-none">
        <div className="inline-flex items-center gap-1.5 bg-[#161c28] px-2.5 py-1 rounded border-2 border-[#000000] shadow-[2px_2px_0px_#000000] mb-2">
          <span className="retro-dot min" />
          <span className="font-mono text-[10px] font-black text-[#fbbf24] tracking-wider uppercase">
            STUDENT SUITE // MOBILE
          </span>
        </div>
        <h1 className="text-2xl font-black font-mono tracking-tight text-[#f8fafc]">
          D-CAMPUS
        </h1>
        <p className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
          Zero-CAPTCHA • Background Sync • Academic OS
        </p>
      </div>

      {/* Main Login Card - Authentic Retro Window */}
      <div className="retro-card overflow-hidden">
        {/* Retro Window Bar */}
        <div className="retro-card-header">
          <div className="flex items-center gap-1.5">
            <span className="retro-dot close" />
            <span className="retro-dot min" />
            <span className="retro-dot max" />
            <span className="text-[#2d3545] font-mono text-xs ml-1">|</span>
            <span className="font-mono text-[11px] font-black text-[#fbbf24] uppercase ml-1">
              LOGIN_PORTAL.EXE
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#64748b] uppercase">
            SETUP ONCE
          </span>
        </div>

        <div className="p-4 space-y-4">
          {errorMessage && (
            <div className="bg-[#f43f5e]/10 border-2 border-[#000000] p-2 rounded shadow-[2px_2px_0px_#000000] text-[11px] text-[#f43f5e] font-mono font-bold leading-tight">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* User ID Field */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-[#94a3b8] mb-1 uppercase">
                STUDENT ID / USERNAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. CU240250963"
                  autoCapitalize="characters"
                  required
                  className="w-full bg-[#080a0d] border-2 border-[#000000] rounded px-3 py-2 text-xs font-mono text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#fbbf24] shadow-[2px_2px_0px_#000000] transition-colors"
                />
                <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-[#94a3b8] mb-1 uppercase">
                PORTAL PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter ERP password"
                  required
                  className="w-full bg-[#080a0d] border-2 border-[#000000] rounded px-3 py-2 text-xs font-mono text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#fbbf24] shadow-[2px_2px_0px_#000000] pr-10 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#f8fafc] transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Auto-Login Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#fbbf24] w-3.5 h-3.5 rounded cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-[#94a3b8]">
                  REMEMBER THIS DEVICE
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-retro btn-retro-gold py-2.5 rounded font-mono text-xs font-black flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>SOLVING CAPTCHA &amp; LOGGING IN...</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    <span>AUTHENTICATE &amp; SYNC</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Privacy Note */}
          <div className="retro-inset p-2.5 text-[10px] font-mono text-[#64748b] leading-normal flex items-start gap-2">
            <ShieldCheck size={16} className="text-[#10b981] shrink-0 mt-0.5" />
            <span>
              Credentials are encrypted and saved solely on your device. CAPTCHAs are resolved automatically in &lt;2ms in the background.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
