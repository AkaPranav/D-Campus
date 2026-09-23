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
        setErrorMessage(data.error || 'Authentication failed. Please check credentials.');
        setIsLoading(false);
        return;
      }

      // Save credentials in client storage if rememberMe is enabled
      if (rememberMe) {
        localStorage.setItem('dcampus_user', userId.trim());
        localStorage.setItem('dcampus_pass', password.trim());
        localStorage.setItem('dcampus_auto_login', 'true');
      }

      onLoginSuccess(userId.trim(), password.trim(), data.student, data.sessionCookies || '');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message || 'Network error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-[#111827] px-3 py-1 rounded border border-[#374151] mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]" />
          <span className="font-mono text-xs font-black text-[#f59e0b] tracking-wider">
            STUDENT SUITE // MOBILE
          </span>
        </div>
        <h1 className="text-3xl font-black font-mono tracking-tight text-[#f3f4f6]">
          D-CAMPUS
        </h1>
        <p className="text-xs text-[#9ca3af] mt-1">
          Zero-CAPTCHA • 24/7 Keep-Alive • Unified Academic Hub
        </p>
      </div>

      {/* Main Login Card */}
      <div className="retro-card p-5 space-y-4">
        <div className="border-b border-[#374151] pb-2.5 flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-[#f59e0b]">
            🔐 ONE-TIME SETUP
          </span>
          <span className="text-[10px] text-[#9ca3af]">
            Saves on device
          </span>
        </div>

        {errorMessage && (
          <div className="bg-[#f43f5e]/10 border border-[#f43f5e] p-2.5 rounded text-[11px] text-[#f43f5e] font-mono leading-tight">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID Field */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-[#9ca3af] mb-1">
              STUDENT ID / USER ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9ca3af]">
                <User size={15} />
              </span>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. CU240250963"
                autoCapitalize="characters"
                required
                className="w-full bg-[#0b0f19] border border-[#374151] rounded px-3 py-2.5 pl-9 text-sm text-[#f3f4f6] font-mono placeholder-[#4b5563] focus:outline-none focus:border-[#f59e0b]"
              />
            </div>
          </div>

          {/* Password Field with Eye Toggle */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-[#9ca3af] mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9ca3af]">
                <Lock size={15} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Portal password"
                required
                className="w-full bg-[#0b0f19] border border-[#374151] rounded px-3 py-2.5 pl-9 pr-10 text-sm text-[#f3f4f6] font-mono placeholder-[#4b5563] focus:outline-none focus:border-[#f59e0b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#9ca3af] hover:text-[#f3f4f6]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Credentials Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="accent-[#10b981] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs text-[#d1d5db] cursor-pointer select-none">
              Remember credentials & auto-login on this phone
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-retro btn-retro-gold py-3 text-xs tracking-wider uppercase flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-[#000000] border-t-transparent rounded-full animate-spin" />
                <span>SOLVING CAPTCHA & LOGGING IN…</span>
              </>
            ) : (
              <span>⚡ LOGIN TO D-CAMPUS</span>
            )}
          </button>
        </form>

        {/* Security / Privacy Trust Guarantee */}
        <div className="pt-2 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] text-[#9ca3af] font-mono">
            <ShieldCheck size={13} className="text-[#10b981]" />
            <span>100% On-Device • CAPTCHA solved automatically in backend</span>
          </div>
        </div>
      </div>
    </div>
  );
}
