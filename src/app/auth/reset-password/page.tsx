'use client';

/**
 * SAFENET Password Reset Page (Organic Monochrome)
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
    <div className="min-h-screen bg-[#F7F8F6] flex items-center justify-center p-4 text-[#202723]">
      <div className="w-full max-w-md bg-white border border-[#DDE2DC] rounded-2xl p-8 space-y-6 shadow-xs">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#E7F0E9] text-[#477A60] mb-2 border border-[#477A60]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#202723] tracking-tight">Set New Password</h1>
          <p className="text-xs text-[#626B65]">
            Enter your new secure password to restore access to your SAFENET account.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-[#C93643]/10 border border-[#C93643]/30 rounded-xl text-[#C93643] text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-[#347653]/10 border border-[#347653]/30 rounded-xl text-[#347653] text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password updated successfully! Redirecting to dashboard...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase text-[#858D86] font-bold">
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
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] focus:border-[#477A60] rounded-xl px-4 py-2.5 text-sm text-[#202723] placeholder-[#858D86] outline-none pr-10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#858D86] hover:text-[#202723]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-mono uppercase text-[#858D86] font-bold">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                disabled={loading}
                className="w-full bg-[#F7F8F6] border border-[#DDE2DC] focus:border-[#477A60] rounded-xl px-4 py-2.5 text-sm text-[#202723] placeholder-[#858D86] outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#477A60] hover:bg-[#365F49] text-white font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
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
