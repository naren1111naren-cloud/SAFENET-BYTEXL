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
    <div className="min-h-screen bg-[#080B10] flex items-center justify-center p-4 text-[#FFFFFF]">
      <div className="w-full max-w-lg bg-[#0D1118] border border-[#303946] rounded-2xl p-8 sm:p-10 space-y-7 shadow-2xl">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#121821] text-[#35D0BA] mb-2 border border-[#303946] shadow-[0_0_20px_rgba(53,208,186,0.15)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-[#FFFFFF] tracking-tight">Set New Password</h1>
          <p className="text-[17px] text-[#D0D7E0] font-bold">
            Enter your new secure password to restore access to your SAFENET account.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-[#2D1216] border border-[#FF5C6C]/40 rounded-xl text-[#FF5C6C] text-[16px] flex items-center gap-2.5 font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-[#0F2620] border border-[#35D0BA]/40 rounded-xl text-[#35D0BA] text-[16px] flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Password updated successfully! Redirecting to dashboard...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[17px] font-mono uppercase text-[#D0D7E0] font-bold">
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
                  className="w-full bg-[#121821] border border-[#303946] focus:border-[#35D0BA] rounded-xl px-4 py-3.5 text-[18px] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] outline-none pr-12 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-[#D0D7E0] hover:text-[#FFFFFF]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[17px] font-mono uppercase text-[#D0D7E0] font-bold">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                disabled={loading}
                className="w-full bg-[#121821] border border-[#303946] focus:border-[#35D0BA] rounded-xl px-4 py-3.5 text-[18px] text-[#FFFFFF] font-bold placeholder-[#8F9CAE] outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-[#35D0BA] hover:bg-[#2EB8A5] text-[#080B10] font-extrabold text-[19px] transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
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
