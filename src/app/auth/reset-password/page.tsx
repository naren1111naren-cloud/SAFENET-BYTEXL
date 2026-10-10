'use client';

/**
 * SAFENET Password Reset Page (Dark-Only Cybersecurity Theme)
 * Allows authenticated users redirected from a recovery email to set a new password.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password. Session may have expired.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/overview');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B11] flex items-center justify-center p-4 text-[#FFFFFF]">
      <div className="w-full max-w-lg bg-[#0E131F] border border-[#1E2638] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#111625] text-[#F6821F] mb-1 border border-[#1E2638] shadow-[0_0_20px_rgba(246,130,31,0.15)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="page-title text-2xl font-semibold text-white tracking-tight font-display">
            Set New Password
          </h1>
          <p className="small-text text-xs sm:text-sm text-slate-400 font-normal font-sans">
            Enter your new secure password to restore access to your SAFENET account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-[#2D1216] border border-[#FF5C6C]/40 rounded-xl text-[#FF5C6C] text-xs sm:text-sm flex items-center gap-2.5 font-medium font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-[#0F2620] border border-[#F6821F]/40 rounded-xl text-[#F6821F] text-xs sm:text-sm flex items-center gap-2.5 font-medium font-sans">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password updated successfully! Redirecting to dashboard...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200 font-sans uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  disabled={loading}
                  className="w-full bg-[#111625] border border-[#1E2638] focus:border-[#F6821F] focus:ring-1 focus:ring-[#F6821F] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-normal placeholder-slate-500 outline-none pr-12 transition font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-200 font-sans uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                disabled={loading}
                className="w-full bg-[#111625] border border-[#1E2638] focus:border-[#F6821F] focus:ring-1 focus:ring-[#F6821F] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-normal placeholder-slate-500 outline-none transition font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="button-text w-full py-3 rounded-xl bg-[#F6821F] hover:bg-[#FA8B28] text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg font-sans"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Save New Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
