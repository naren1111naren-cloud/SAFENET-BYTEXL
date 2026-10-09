'use client';

/**
 * SAFENET Login & Registration Page
 * Redesigned for SAFENET — Organic Monochrome:
 * - Clean white card surfaces, soft-grey backgrounds (#F7F8F6).
 * - Bold charcoal typography (#202723) with clear visual hierarchy.
 * - Restrained sage-green primary action buttons (#477A60).
 * - Full preservation of Supabase Authentication.
 */

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Shield,
  KeyRound,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SafenetLogo from '@/components/SafenetLogo';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/overview';

  const { signInWithPassword, signUp, resetPassword, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validation
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please provide a valid email address (e.g. name@company.com).');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMessage(error.message || 'Unable to send password reset email. Please verify the address.');
        } else {
          setSuccessMessage('Password reset link sent! Please check your email inbox.');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Network error occurred while requesting password reset.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && !agreeTerms) {
      setErrorMessage('Please accept the Terms & Security Conditions to register.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signInWithPassword(email, password);

        if (error) {
          if (error.message?.toLowerCase().includes('invalid login credentials')) {
            setErrorMessage('Invalid email or password. Please double-check your credentials.');
          } else if (error.message?.toLowerCase().includes('email not confirmed')) {
            setErrorMessage('Email address has not been confirmed. Please check your inbox for the verification link.');
          } else {
            setErrorMessage(error.message || 'Authentication failed. Please check your network or credentials.');
          }
        } else {
          router.push(redirectTarget);
        }
      } else if (mode === 'signup') {
        const { data, error } = await signUp(email, password);

        if (error) {
          setErrorMessage(error.message || 'Account registration could not be completed.');
        } else {
          if (data?.session) {
            router.push(redirectTarget);
          } else {
            setSuccessMessage(
              'Registration successful! A verification email has been sent to your address. Please verify to sign in.'
            );
            setMode('signin');
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F8F6] text-[#202723] font-sans selection:bg-[#477A60]/15 selection:text-[#202723]">
      {/* ========================================================================= */}
      {/* LEFT PANEL — ORGANIC MONOCHROME BRANDING HERO                             */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-[46%] xl:w-[44%] min-h-[380px] lg:min-h-screen bg-[#ECEFEC] border-b lg:border-b-0 lg:border-r border-[#DDE2DC] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden z-10">
        {/* Subtle geometric dot pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="login-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#858D86" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 bg-[#FFFFFF] px-3.5 py-1.5 rounded-full border border-[#DDE2DC] shadow-xs">
            <ShieldCheck className="h-4 w-4 text-[#477A60]" />
            <span className="text-xs font-mono tracking-wider font-semibold text-[#202723] uppercase">
              SAFENET GUARD
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#858D86] hidden sm:inline-block">
            DRP v2.4 • PROD
          </span>
        </div>

        {/* Center Hero Card */}
        <div className="relative z-10 my-auto py-10 lg:py-0 space-y-6 max-w-md">
          <p className="text-[#626B65] text-base sm:text-lg font-medium tracking-wide">
            Enterprise Security Portal
          </p>

          {/* Central Emblem Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#FFFFFF] border border-[#DDE2DC] text-[#477A60] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <ShieldCheck className="w-10 h-10 stroke-[2] text-[#477A60]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#202723]">
              SAFENET
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-[#477A60]">
              Digital Risk Decision System
            </p>
            <p className="text-sm text-[#626B65] leading-relaxed max-w-sm pt-1">
              Secure authentication for the enterprise digital risk protection and social threat monitoring console.
            </p>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 pt-6 border-t border-[#DDE2DC] flex flex-wrap items-center justify-between text-xs text-[#858D86] font-mono gap-2">
          <span className="tracking-wider uppercase text-[#626B65] font-semibold">ZERO-TRUST ACCESS CONTROL</span>
          <span>•</span>
          <span>ENTERPRISE SOC READY</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL — WHITE AUTHENTICATION FORM                                   */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-[#F7F8F6] min-h-[500px] flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-[440px] bg-[#FFFFFF] border border-[#DDE2DC] p-8 sm:p-10 rounded-2xl shadow-sm space-y-8">
          {/* Header Title */}
          <div className="space-y-2 text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202723]">
              {mode === 'signin'
                ? 'Sign In to SAFENET'
                : mode === 'signup'
                ? 'Create Security Account'
                : 'Reset Password'}
            </h2>
            <p className="text-sm text-[#626B65]">
              {mode === 'signin'
                ? 'Enter your credentials to access the security command center.'
                : mode === 'signup'
                ? 'Register to monitor and protect brand perimeters.'
                : 'Enter your verified email to receive recovery instructions.'}
            </p>
          </div>

          {/* Environment Warning if Supabase is unconfigured */}
          {!isConfigured && (
            <div className="p-3.5 bg-[#FEF9F0] border border-[#FBE8CA] rounded-xl text-[#B7791F] text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-[#B7791F] shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Supabase Configuration Notice:</strong>
                <p className="mt-0.5 text-[#626B65] leading-relaxed">
                  Supabase URL or Anon key is not detected in environment variables. Add them to{' '}
                  <code className="font-mono bg-[#ECEFEC] px-1 py-0.5 rounded text-[#202723]">.env.local</code>.
                </p>
              </div>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 bg-[#FDF2F3] border border-[#F8D3D6] rounded-xl text-[#C93643] text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="h-4 w-4 text-[#C93643] shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div className="p-3.5 bg-[#EFF7F2] border border-[#CBE4D4] rounded-xl text-[#347653] text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#347653] shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{successMessage}</div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold uppercase tracking-wider text-[#626B65] font-mono"
              >
                E-mail Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#858D86] group-focus-within:text-[#477A60] transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg pl-10 pr-10 py-2.5 text-sm text-[#202723] placeholder-[#858D86] outline-none transition-all focus:bg-[#FFFFFF] focus:border-[#477A60] focus:ring-1 focus:ring-[#477A60] disabled:opacity-60"
                />
                {validateEmail(email) && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#347653]">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Password Field (only for signin or signup) */}
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#626B65] font-mono"
                  >
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-[#477A60] hover:underline font-semibold transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#858D86] group-focus-within:text-[#477A60] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    disabled={loading}
                    className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg pl-10 pr-10 py-2.5 text-sm text-[#202723] placeholder-[#858D86] outline-none transition-all focus:bg-[#FFFFFF] focus:border-[#477A60] focus:ring-1 focus:ring-[#477A60] disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#858D86] hover:text-[#202723] transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Checkbox agreement */}
            {mode === 'signup' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-[#DDE2DC] text-[#477A60] focus:ring-[#477A60] cursor-pointer"
                />
                <label
                  htmlFor="terms-checkbox"
                  className="text-xs text-[#626B65] cursor-pointer select-none"
                >
                  By registering, I accept the{' '}
                  <span className="text-[#477A60] font-semibold hover:underline">
                    Terms &amp; Security Policy
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 h-11 px-6 rounded-lg bg-[#477A60] hover:bg-[#365F49] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <span>Sign Up</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <KeyRound className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Mode Toggle Button */}
              {mode === 'signin' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full sm:w-auto h-11 px-5 rounded-lg bg-transparent border border-[#DDE2DC] hover:border-[#C4CCC3] hover:bg-[#F7F8F6] text-[#626B65] hover:text-[#202723] font-medium text-sm transition-all cursor-pointer"
                >
                  Sign Up
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full sm:w-auto h-11 px-5 rounded-lg bg-transparent border border-[#DDE2DC] hover:border-[#C4CCC3] hover:bg-[#F7F8F6] text-[#626B65] hover:text-[#202723] font-medium text-sm transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </form>

          {/* Privacy & Security Guarantee */}
          <div className="pt-6 border-t border-[#DDE2DC] flex items-center justify-center gap-2 text-xs text-[#858D86] text-center">
            <Lock className="h-3.5 w-3.5 text-[#858D86] shrink-0" />
            <span>Protected by end-to-end encryption &amp; Zero-Trust policy.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
