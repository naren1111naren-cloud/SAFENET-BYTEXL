'use client';

/**
 * SAFENET Login & Registration Page
 * Faithful to the blue-and-white split-screen reference design:
 * - Left panel: Deep blue gradient, security emblem, SAFENET branding, organic cloud divider.
 * - Right panel: White card, accessible form, email & password with toggle, pill action buttons.
 * - Powered by official Supabase Authentication.
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
          // Provide clean, secure user feedback without revealing account enumeration
          if (error.message?.toLowerCase().includes('invalid login credentials')) {
            setErrorMessage('Invalid email or password. Please double-check your credentials.');
          } else if (error.message?.toLowerCase().includes('email not confirmed')) {
            setErrorMessage('Email address has not been confirmed. Please check your inbox for the verification link.');
          } else {
            setErrorMessage(error.message || 'Authentication failed. Please check your network or credentials.');
          }
        } else {
          // Authentication successful -> redirect to destination
          router.push(redirectTarget);
        }
      } else if (mode === 'signup') {
        const { data, error } = await signUp(email, password);

        if (error) {
          setErrorMessage(error.message || 'Account registration could not be completed.');
        } else {
          if (data?.session) {
            // Instant sign-in if email confirmation is disabled in Supabase
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#080A0B] text-slate-800 font-sans selection:bg-[#0E52D6]/20 selection:text-[#0E52D6]">
      {/* ========================================================================= */}
      {/* LEFT PANEL — SAFENET BRANDING WITH ORGANIC CLOUD SCALLOPED DIVIDER         */}
      {/* ========================================================================= */}
      <div className="relative w-full lg:w-[46%] xl:w-[44%] min-h-[380px] lg:min-h-screen bg-gradient-to-br from-[#0F5CE6] via-[#0B4DBB] to-[#082977] flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden text-white z-10 shadow-2xl">
        {/* Subtle geometric & shield watermarks */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>

        {/* Ambient glow orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
            <ShieldCheck className="h-4 w-4 text-cyan-300" />
            <span className="text-xs font-mono tracking-wider font-semibold text-white/90 uppercase">
              SAFENET GUARDIAN
            </span>
          </div>
          <span className="text-[11px] font-mono text-blue-200/70 hidden sm:inline-block">
            DRP v2.4 PROD
          </span>
        </div>

        {/* Center Hero Card */}
        <div className="relative z-10 my-auto py-10 lg:py-0 space-y-6 max-w-md">
          <p className="text-blue-100/90 text-lg sm:text-xl font-normal tracking-wide">
            Welcome to
          </p>

          {/* Central Emblem Badge (matching the circular icon in reference) */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white text-[#0B4DBB] shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-4 ring-white/20 transition-transform duration-500 hover:scale-105">
            <ShieldCheck className="w-12 h-12 stroke-[2.2] text-[#0F5CE6]" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm font-sans">
              SAFENET
            </h1>
            <p className="text-lg sm:text-xl font-medium text-cyan-200">
              Your Digital Safety, Secured.
            </p>
            <p className="text-sm text-blue-100/80 leading-relaxed max-w-sm pt-1">
              Secure access to your enterprise digital risk protection platform. Real-time brand impersonation defense, look-alike detection, and automated threat triage.
            </p>
          </div>
        </div>

        {/* Bottom Metadata & Footer Links */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between text-xs text-blue-100/70 font-mono gap-2">
          <span className="tracking-wider uppercase">ZERO-TRUST ARCHITECTURE</span>
          <span className="text-white/40">•</span>
          <span>ENTERPRISE SOC READY</span>
        </div>

        {/* ========================================================================= */}
        {/* ORGANIC CLOUD SCALLOPED DIVIDER (MATCHING THE SCREENSHOT CURVES)          */}
        {/* ========================================================================= */}
        <div className="hidden lg:block absolute top-0 bottom-0 -right-1 w-20 pointer-events-none z-20 overflow-hidden">
          <svg
            viewBox="0 0 100 1000"
            preserveAspectRatio="none"
            className="w-full h-full text-white fill-current"
          >
            {/* Multi-lobed scalloped cloud curve separating blue left and white right */}
            <path d="M 0,0 
                     C 35,40 70,60 50,110 
                     C 30,160 85,180 65,240 
                     C 45,300 95,330 70,390 
                     C 45,450 85,480 55,540 
                     C 25,600 90,630 65,700 
                     C 40,770 80,810 50,870 
                     C 20,930 60,970 40,1000 
                     L 100,1000 L 100,0 Z" />
          </svg>
        </div>

        {/* Mobile/Tablet bottom cloud transition */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 h-10 pointer-events-none z-20">
          <svg
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            className="w-full h-full text-white fill-current"
          >
            <path d="M 0,100 C 150,20 300,70 500,30 C 700,-10 850,60 1000,10 L 1000,100 Z" />
          </svg>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT PANEL — WHITE CARD & AUTHENTICATION FORM                            */}
      {/* ========================================================================= */}
      <div className="flex-1 bg-white min-h-[500px] flex items-center justify-center p-6 sm:p-12 lg:p-16 relative">
        <div className="w-full max-w-[440px] space-y-8 animate-fadeIn">
          {/* Header Title */}
          <div className="space-y-2 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
              {mode === 'signin'
                ? 'Welcome to SAFENET'
                : mode === 'signup'
                ? 'Create your account'
                : 'Reset your password'}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === 'signin'
                ? 'Sign in to access your digital security console.'
                : mode === 'signup'
                ? 'Start protecting your brand and official digital assets.'
                : 'Enter your verified email to receive recovery instructions.'}
            </p>
          </div>

          {/* Environment Warning if Supabase is unconfigured */}
          {!isConfigured && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Supabase Configuration Notice:</strong>
                <p className="mt-0.5 text-amber-700 leading-relaxed">
                  Supabase URL or Anon key is not detected in environment variables. Add them to{' '}
                  <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env.local</code>.
                </p>
              </div>
            </div>
          )}

          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Message Box */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono"
              >
                E-mail Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0F5CE6] transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-[#0F5CE6] focus:ring-4 focus:ring-[#0F5CE6]/10 disabled:opacity-60"
                />
                {validateEmail(email) && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-emerald-500">
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
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 font-mono"
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
                      className="text-xs text-[#0F5CE6] hover:text-[#0B4DBB] font-medium hover:underline transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#0F5CE6] transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    disabled={loading}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-[#0F5CE6] focus:ring-4 focus:ring-[#0F5CE6]/10 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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

            {/* Checkbox agreement (visible in signup or optional signin remember me) */}
            {mode === 'signup' && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0F5CE6] focus:ring-[#0F5CE6]/20 cursor-pointer"
                />
                <label
                  htmlFor="terms-checkbox"
                  className="text-xs text-slate-600 cursor-pointer select-none"
                >
                  By Signing up, I agree with{' '}
                  <span className="text-[#0F5CE6] font-medium hover:underline">
                    Terms &amp; Security Policy
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons (matching dual pill buttons in screenshot) */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {/* Primary Pill Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 py-3 px-6 rounded-full bg-gradient-to-r from-[#0F5CE6] to-[#0A3FA8] hover:from-[#0D4EC7] hover:to-[#083389] text-white font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
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

              {/* Secondary Pill Button (Toggle between Sign In / Sign Up) */}
              {mode === 'signin' ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full sm:w-auto py-3 px-6 rounded-full bg-transparent border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-all cursor-pointer"
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
                  className="w-full sm:w-auto py-3 px-6 rounded-full bg-transparent border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-all cursor-pointer"
                >
                  Sign In
                </button>
              )}
            </div>
          </form>

          {/* Privacy & Security Guarantee */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
            <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>Protected by end-to-end encryption &amp; SAFENET Zero-Trust Policy.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
