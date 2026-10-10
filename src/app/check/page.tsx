'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Globe,
  MessageSquare,
  AtSign,
  Smartphone,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  GitBranch,
  AlertOctagon,
  FileText,
  Share2,
  RefreshCw,
  X,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { generateCustomerAdvisories } from '@/lib/advisory/customer-advisory';
import { ThreatItem, RiskLevel } from '@/types/brand';
import LookalikeDetectionWorkbench from '@/components/LookalikeDetectionWorkbench';

type CheckType = 'url' | 'message' | 'social' | 'app' | 'lookalike';

function RiskArcGauge({ score, maxScore = 100 }: { score: number; maxScore?: number }) {
  const size = 150;
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(score, maxScore)) / maxScore;

  const color = score >= 70 ? '#FF5C6C' : score >= 40 ? '#FFAB40' : '#F6821F';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-[135deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E2638"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pt-1">
        <span className="stat-value text-3xl sm:text-4xl text-white">
          {score}
        </span>
        <span className="data-text text-xs text-slate-400 mt-1">/ {maxScore}</span>
      </div>
    </div>
  );
}

function CheckRiskContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialInput = searchParams.get('input') || '';
  const initialType = (searchParams.get('type') as CheckType) || 'url';

  const [checkType, setCheckType] = useState<CheckType>(initialType);
  const [inputValue, setInputValue] = useState(initialInput);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  // Analysis result
  const [result, setResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incidentCreated, setIncidentCreated] = useState(false);
  const [advisoryModalOpen, setAdvisoryModalOpen] = useState(false);
  const [advisoryLang, setAdvisoryLang] = useState<'en' | 'hi' | 'ta'>('en');
  const [copiedAdvisory, setCopiedAdvisory] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const scanningStages = [
    'Checking identity & brand baseline',
    'Checking domain signals & registration age',
    'Analyzing content & pressure language',
    'Checking impersonation indicators',
    'Correlating threat signals & infrastructure',
    'Synthesizing risk assessment',
  ];

  const loadDemoPreset = (type: CheckType) => {
    setCheckType(type);
  };

  const handleRunAnalysis = async (text: string = inputValue, type: CheckType = checkType) => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setResult(null);
    setErrorMessage(null);
    setIncidentCreated(false);

    setAnalysisStep(1);

    try {
      const activeBrand = BrandStore.getBrand() || PRESET_BRANDS['Paytm'];

      const payloadBody: any = {
        input: text,
        brandName: activeBrand.name,
        brandDomain: activeBrand.domain,
        brandHandles: activeBrand.handles,
      };

      if (type === 'url') {
        payloadBody.type = 'domain';
      } else if (type === 'message') {
        payloadBody.type = 'scam_content';
        payloadBody.content = { text, platform: 'sms' };
      } else if (type === 'social') {
        payloadBody.type = 'social_profile';
      } else if (type === 'app') {
        payloadBody.type = 'mobile_app';
      }

      setAnalysisStep(2);
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      });

      setAnalysisStep(4);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setErrorMessage(errorData.error || 'SAFENET could not complete this check. Please try again.');
        setResult(null);
        return;
      }

      const data = await res.json();

      setResult({
        ...data,
        targetInput: text,
        checkType: type,
        brand: activeBrand,
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage('SAFENET could not complete this check. Please try again.');
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (initialInput && !result && !analyzing) {
      handleRunAnalysis(initialInput, initialType);
    }
  }, [initialInput, initialType]);

  const handleCreateIncident = () => {
    if (!result) return;
    const activeBrand = result.brand || BrandStore.getBrand() || PRESET_BRANDS['Paytm'];
    const newThreat: ThreatItem = {
      id: `threat-${Date.now()}`,
      brandId: activeBrand.name,
      targetAsset: result.targetInput,
      type: result.checkType === 'url' ? 'domain' : result.checkType === 'social' ? 'social_profile' : result.checkType === 'app' ? 'mobile_app' : 'scam_content',
      source: 'live_check',
      riskScore: result.riskScore ?? 0,
      riskLevel: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(result.riskLevel) ? result.riskLevel : (result.riskScore >= 70 ? 'HIGH' : result.riskScore >= 40 ? 'MEDIUM' : 'LOW')) as RiskLevel,
      reasons: result.reasons?.length ? result.reasons : ['Verified by SAFENET Risk Engine.'],
      iocs: result.extractedIocs?.length ? result.extractedIocs : [{ type: 'domain', value: result.targetInput }],
      discoveredAt: new Date().toISOString(),
      status: 'active',
    };

    BrandStore.addThreat(newThreat);

    BrandStore.saveIncident({
      id: `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      threatId: newThreat.id,
      brandName: activeBrand.name,
      targetAsset: result.targetInput,
      threatType: newThreat.type,
      riskScore: newThreat.riskScore,
      riskLevel: newThreat.riskLevel || 'LOW',
      generatedAt: new Date().toISOString(),
      analystName: 'SOC Analyst (L1)',
      decision: newThreat.riskScore >= 70 ? 'CONFIRMED_THREAT' : 'WATCHLIST',
      reviewerNotes: 'Flagged via SAFENET Risk Engine.',
      executiveSummary: `Analysis of ${result.targetInput}. Risk Score: ${newThreat.riskScore}/100.`,
      evidence: result.evidenceList || [],
      timeline: [],
      recommendedActions: result.recommendedAction?.steps || [
        'Verify destination authentication before interaction.',
        'File registrar abuse ticket if malicious activity is observed.',
      ],
    });

    setIncidentCreated(true);
  };

  const handleShareResult = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const getAdvisories = () => {
    if (!result) return null;
    const fakeThreat: ThreatItem = {
      id: 'demo-check',
      brandId: result.brand?.name || 'Paytm',
      targetAsset: result.targetInput,
      type: 'domain',
      source: 'live_check',
      riskScore: result.riskScore ?? 0,
      reasons: result.reasons || [],
      iocs: result.extractedIocs || [],
      discoveredAt: new Date().toISOString(),
      status: 'active',
    };
    return generateCustomerAdvisories(fakeThreat, result.brand || PRESET_BRANDS['Paytm'], advisoryLang);
  };

  const advisories = getAdvisories();

  return (
    <AppShell
      pageTitle="Investigation Instrument"
      pageSubtitle="Deterministic heuristics and neural correlation before granting trust."
      pageEyebrow="Threat Inspection & Verification"
    >
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. INVESTIGATION INPUT INSTRUMENT                                         */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-2">
          <div className="space-y-2 border-b border-[#1E2638] pb-5">
            <span className="eyebrow-text text-brand-orange font-semibold">
              CHECK RISK
            </span>
            <h1 className="page-title text-white">
              What are you checking?
            </h1>
            <p className="body-text text-slate-400 max-w-3xl">
              Paste a URL, domain, message, account or application to investigate its risk signals across brand baseline and live telemetry.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 border-b border-[#1E2638] pb-3 text-sm font-sans font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => loadDemoPreset('url')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                checkType === 'url'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className={`h-4 w-4 ${checkType === 'url' ? 'text-[#F6821F]' : 'text-slate-400'}`} />
              URL / Domain
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('message')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                checkType === 'message'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className={`h-4 w-4 ${checkType === 'message' ? 'text-[#F6821F]' : 'text-slate-400'}`} />
              Message / Email
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('social')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                checkType === 'social'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AtSign className={`h-4 w-4 ${checkType === 'social' ? 'text-[#F6821F]' : 'text-slate-400'}`} />
              Social Account
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('app')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                checkType === 'app'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className={`h-4 w-4 ${checkType === 'app' ? 'text-[#F6821F]' : 'text-slate-400'}`} />
              App / APK
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('lookalike')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                checkType === 'lookalike'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className={`h-4 w-4 ${checkType === 'lookalike' ? 'text-[#F6821F]' : 'text-slate-400'}`} />
              Look-alike Detection
            </button>
          </div>

          {/* Look-alike Workbench or standard Check Input Surface */}
          {checkType === 'lookalike' ? (
            <div className="pt-2">
              <LookalikeDetectionWorkbench />
            </div>
          ) : (
            <>
              {/* Clean Dark Input Surface */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunAnalysis();
                }}
                className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5"
              >
                <div className="relative">
                  <textarea
                    rows={checkType === 'message' ? 3 : 2}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste a suspicious URL, message, account handle, or package name..."
                    className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-4 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:border-[#F6821F] focus:ring-1 focus:ring-[#F6821F] outline-none font-mono resize-none transition-all shadow-inner"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  {/* Presets in clean pills */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-sans font-medium text-slate-300">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('url');
                        setInputValue('http://paytm-support-verify.xyz');
                      }}
                      className="px-2.5 py-1 bg-[#111625] hover:bg-[#161D2F] text-slate-300 hover:text-white border border-[#1E2638] rounded-lg transition-colors font-mono"
                    >
                      paytm-support-verify.xyz
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('social');
                        setInputValue('@Paytm_CareHelp');
                      }}
                      className="px-2.5 py-1 bg-[#111625] hover:bg-[#161D2F] text-slate-300 hover:text-white border border-[#1E2638] rounded-lg transition-colors font-mono"
                    >
                      @Paytm_CareHelp
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('app');
                        setInputValue('com.paytm.cashback.reward.apk');
                      }}
                      className="px-2.5 py-1 bg-[#111625] hover:bg-[#161D2F] text-slate-300 hover:text-white border border-[#1E2638] rounded-lg transition-colors font-mono"
                    >
                      com.paytm.cashback.reward.apk
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={analyzing || !inputValue.trim()}
                    className="button-text inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11] text-sm font-semibold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Investigating...</span>
                      </>
                    ) : (
                      <>
                        <span>Check Risk</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sequential Telemetry Progression (During scan) */}
              {analyzing && (
                <div className="pt-4 border-t border-[#1E2638] space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-slate-400">
                    <span className="h-2 w-2 rounded-full bg-[#F6821F] animate-pulse" />
                    <span className="eyebrow-text">EVALUATING ARTIFACT TELEMETRY:</span>
                    <span className="data-text text-white font-semibold">{inputValue.slice(0, 45)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {scanningStages.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 transition-opacity ${
                          idx <= analysisStep ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        <span className={idx <= analysisStep ? 'text-[#F6821F] font-mono' : 'text-slate-600 font-mono'}>
                          {idx < analysisStep ? '—' : idx === analysisStep ? '›' : '·'}
                        </span>
                        <span className="font-sans">{stage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ERROR STATE                                                               */}
        {/* ========================================================================= */}
        {errorMessage && !analyzing && (
          <div className="space-y-3 border border-[#FF5C6C]/40 bg-[#2D1216] p-6 sm:p-8 rounded-2xl text-center my-8">
            <span className="eyebrow-text text-[#FF5C6C] font-semibold">
              Analysis unavailable
            </span>
            <h3 className="section-title text-white">
              {errorMessage}
            </h3>
            <p className="body-text text-slate-300 max-w-lg mx-auto">
              SAFENET could not complete this check. Please verify the target input, network status, or try again.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. RISK RESULT EXPERIENCE                                                 */}
        {/* ========================================================================= */}
        {result && !analyzing && checkType !== 'lookalike' && (
          <div className="space-y-12 border-t border-[#1E2638] pt-10">
            {/* ── TOP RESULT HERO: SCORE + VERDICT ── */}
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="eyebrow-text text-slate-400">
                    RISK ASSESSMENT
                  </span>
                  <span className="text-[#1E2638]">/</span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-mono font-semibold uppercase border ${
                      result.riskScore >= 70
                        ? 'bg-[#2D1216] text-[#FF5C6C] border-[#FF5C6C]/40'
                        : result.riskScore >= 40
                        ? 'bg-[#2C1C0D] text-[#FFAB40] border-[#FFAB40]/40'
                        : 'bg-[#0F2620] text-[#F6821F] border-[#F6821F]/40'
                    }`}
                  >
                    {result.riskLevel || (result.riskScore >= 70 ? 'HIGH RISK' : result.riskScore >= 40 ? 'MEDIUM RISK' : 'SAFE / LOW RISK')}
                  </span>
                  <span className="text-[#1E2638]">/</span>
                  <span className="eyebrow-text text-slate-400 bg-[#111625] border border-[#1E2638] px-2.5 py-1 rounded-md">
                    {result.isLLMPowered ? 'AI + HEURISTIC' : 'DETERMINISTIC HEURISTIC'}
                  </span>
                </div>

                <h2 className="section-title font-mono text-white break-all">
                  {result.targetInput}
                </h2>

                <p className="body-text text-slate-300 max-w-3xl">
                  {result.summaryPhrase || (
                    result.riskScore >= 70
                      ? `SAFENET detected high-risk indicators targeting ${result.brand?.name || 'protected assets'}.`
                      : result.riskScore >= 40
                      ? `SAFENET detected moderate risk indicators requiring verification.`
                      : `No significant threat indicators detected for ${result.targetInput}.`
                  )}
                </p>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCreateIncident}
                    disabled={incidentCreated}
                    className={`button-text inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md ${
                      incidentCreated
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                        : 'bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11]'
                    }`}
                  >
                    <AlertOctagon className="h-4 w-4" />
                    {incidentCreated ? '✓ Incident Logged' : 'Create Incident'}
                  </button>

                  <Link
                    href="/campaigns"
                    className="button-text inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111625] hover:bg-[#161D2F] text-slate-300 hover:text-white border border-[#1E2638] shadow-md transition-colors"
                  >
                    <GitBranch className="h-4 w-4 text-sky-400" />
                    <span>Investigate Campaign</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setAdvisoryModalOpen(true)}
                    className="button-text inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111625] hover:bg-[#161D2F] text-slate-300 hover:text-white border border-[#1E2638] shadow-md transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-pink-400" />
                    <span>Customer Advisory</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="button-text inline-flex items-center gap-1.5 px-3.5 py-2 text-slate-400 hover:text-white text-xs font-medium rounded-xl hover:bg-[#111625] transition-colors cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>{copiedShare ? 'Copied Link' : 'Share'}</span>
                  </button>
                </div>

                {incidentCreated && (
                  <div className="pt-2 flex items-center gap-2 text-xs font-sans text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
                    <span>Incident successfully queued in response center.</span>
                    <Link href="/incidents" className="text-[#F6821F] hover:underline font-semibold ml-1">
                      View in queue →
                    </Link>
                  </div>
                )}
              </div>

              {/* Arc Gauge */}
              <div className="flex flex-col items-center justify-center shrink-0 border border-[#1E2638] p-6 rounded-2xl bg-[#111625] min-w-[200px] shadow-lg">
                <span className="eyebrow-text text-slate-400 mb-3">
                  THREAT SCORE
                </span>
                <RiskArcGauge score={result.riskScore ?? 0} />
                <span className="small-text text-slate-400 mt-3">
                  {typeof result.confidence === 'number' ? `Confidence: ${result.confidence}%` : 'Confidence unavailable'}
                </span>
              </div>
            </div>

            {/* ── SECTION: WHY WE FLAGGED IT / DECISION SIGNALS ── */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-3">
                <div className="space-y-1">
                  <span className="eyebrow-text text-brand-orange font-semibold">
                    DECISION SIGNALS
                  </span>
                  <h3 className="section-title text-white">
                    Why SAFENET reached this assessment
                  </h3>
                </div>
                <span className="small-text text-slate-400">
                  {result.contributions?.length || result.reasons?.length || 0} evaluated signal{(result.contributions?.length || result.reasons?.length || 0) === 1 ? '' : 's'}
                </span>
              </div>

              <div className="divide-y divide-[#1E2638]">
                {result.contributions && result.contributions.length > 0 ? (
                  result.contributions.map((contrib: any, index: number) => {
                    const num = String(index + 1).padStart(2, '0');
                    return (
                      <div key={index} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline text-sm">
                        <div className="md:col-span-1 data-text text-xs text-slate-400">
                          {num}
                        </div>
                        <div className="md:col-span-4">
                          <div className="card-title text-sm text-white">
                            {contrib.vector}
                          </div>
                          <div className="data-text text-xs text-pink-400 mt-0.5">
                            Contribution: +{contrib.points} pts
                          </div>
                        </div>
                        <div className="md:col-span-5 body-text text-xs sm:text-sm text-slate-300">
                          {contrib.reason}
                        </div>
                        <div className={`md:col-span-2 md:text-right eyebrow-text text-xs font-semibold ${
                          contrib.points >= 30 ? 'text-rose-400' : contrib.points >= 15 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {contrib.points >= 30 ? 'HIGH IMPACT' : contrib.points >= 15 ? 'MODERATE' : 'INFORMATIONAL'}
                        </div>
                      </div>
                    );
                  })
                ) : result.reasons && result.reasons.length > 0 ? (
                  result.reasons.map((reason: string, index: number) => {
                    const num = String(index + 1).padStart(2, '0');
                    return (
                      <div key={index} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline text-sm">
                        <div className="md:col-span-1 data-text text-xs text-slate-400">{num}</div>
                        <div className="md:col-span-4 card-title text-sm text-white">Evaluation Finding {num}</div>
                        <div className="md:col-span-5 body-text text-xs sm:text-sm text-slate-300">{reason}</div>
                        <div className="md:col-span-2 md:text-right eyebrow-text text-xs text-emerald-400 font-semibold">VERIFIED</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center small-text text-slate-400">
                    No significant risk indicators were detected.
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION: AI THREAT REASONING ── */}
            {result.aiAnalysis && (
              <section className="space-y-3 border border-[#1E2638] bg-[#0E131F] p-6 rounded-2xl shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
                  <span className="eyebrow-text text-brand-orange font-semibold">
                    NEURAL THREAT REASONING
                  </span>
                  <span className="eyebrow-text text-slate-400">EVIDENCE-GROUNDED INFERENCE</span>
                </div>
                <h4 className="card-title text-base text-white">
                  {result.aiAnalysis.threatAssessment}
                </h4>
                <p className="body-text text-xs sm:text-sm text-slate-300">
                  {result.aiAnalysis.keyFindingsExplanation}
                </p>
                {result.aiAnalysis.contradictoryOrMissingEvidence?.length > 0 && (
                  <div className="pt-2 data-text text-xs text-slate-400">
                    Evidence gaps: {result.aiAnalysis.contradictoryOrMissingEvidence.join(' • ')}
                  </div>
                )}
              </section>
            )}

            {/* ── SECTION: TECHNICAL EVIDENCE ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
                <div className="space-y-1">
                  <span className="eyebrow-text text-brand-orange font-semibold">
                    TECHNICAL EVIDENCE
                  </span>
                  <h3 className="section-title text-white">
                    Multi-source network intelligence
                  </h3>
                </div>
                <span className="eyebrow-text text-slate-400">
                  Authoritative Lookups
                </span>
              </div>

              <div className="divide-y divide-[#1E2638]">
                {/* 1. Identity & Asset */}
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Target Asset</span>
                  <span className="data-text text-xs sm:text-sm text-white font-semibold">{result.normalizedTarget || result.targetInput}</span>
                </div>

                {/* 2. DNS Resolution */}
                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">DNS Status</span>
                  <span className={`data-text text-xs sm:text-sm font-semibold ${result.dns ? (result.dns.isResolved || result.dns.resolved ? 'text-[#F6821F]' : 'text-[#FFAB40]') : 'text-slate-400'}`}>
                    {result.dns ? ((result.dns.isResolved || result.dns.resolved) ? 'Resolved (A/AAAA Active)' : `No resolution (${result.dns.overallStatus || 'NXDOMAIN'})`) : 'Not applicable'}
                  </span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Resolved IPv4</span>
                  <span className="data-text text-xs sm:text-sm text-white">
                    {result.dns?.ipv4 && result.dns.ipv4.length > 0 ? result.dns.ipv4.join(', ') : 'None'}
                  </span>
                </div>

                {result.dns?.mx && result.dns.mx.length > 0 && (
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Mail Exchangers (MX)</span>
                    <span className="data-text text-xs sm:text-sm text-white">{result.dns.mx.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {result.dns?.ns && result.dns.ns.length > 0 && (
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Nameservers (NS)</span>
                    <span className="data-text text-xs sm:text-sm text-white">{result.dns.ns.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {/* 3. RDAP Registration */}
                {result.rdap && (
                  <>
                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Domain Registrar</span>
                      <span className={`data-text text-xs sm:text-sm ${result.rdap.registrarName ? 'text-white' : 'text-slate-500'}`}>
                        {result.rdap.registrarName ? `${result.rdap.registrarName}${result.rdap.registrarIanaId ? ` (IANA: ${result.rdap.registrarIanaId})` : ''}` : (result.rdap.status === 'unavailable' ? 'Unavailable via RDAP' : 'Not available')}
                      </span>
                    </div>

                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Domain Age & Creation</span>
                      <span className={`data-text text-xs sm:text-sm ${result.rdap.registrationDateUtc ? 'text-white' : 'text-slate-500'}`}>
                        {result.rdap.registrationDateUtc ? `${result.rdap.domainAgeFormatted || 'Verified'} (Created: ${result.rdap.registrationDateUtc.split('T')[0]})` : 'Unavailable / Not returned by registry'}
                      </span>
                    </div>
                  </>
                )}

                {/* 4. TLS Certificate */}
                {result.tls && result.tls.status !== 'no_tls' && (
                  <>
                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">TLS Certificate Status</span>
                      <span className={`data-text text-xs sm:text-sm font-semibold ${result.tls.status === 'valid' ? 'text-[#F6821F]' : 'text-[#FF5C6C]'}`}>
                        {result.tls.status === 'valid' ? `Valid (${result.tls.daysRemaining} days remaining)` : `Anomaly: ${result.tls.status} (${result.tls.error || 'Verification error'})`}
                      </span>
                    </div>

                    {result.tls.issuer?.commonName && (
                      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Certificate Authority</span>
                        <span className="data-text text-xs sm:text-sm text-white">{result.tls.issuer.commonName}</span>
                      </div>
                    )}
                  </>
                )}

                {/* 5. HTTP & Transport */}
                {result.http && (
                  <>
                    <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">HTTP Endpoint Status</span>
                      <span className={`data-text text-xs sm:text-sm font-semibold ${result.http.isAccessible ? 'text-[#F6821F]' : 'text-[#FFAB40]'}`}>
                        {result.http.isAccessible ? `HTTP ${result.http.statusCode} (${result.http.durationMs}ms latency)` : `Unreachable (${result.http.error || 'Connection failed'})`}
                      </span>
                    </div>

                    {result.http.redirectCount > 0 && (
                      <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Redirect Chain</span>
                        <span className="data-text text-xs sm:text-sm text-[#FFAB40] truncate max-w-md">
                          {result.http.redirectCount} hop(s) &rarr; {result.http.finalUrl}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* 6. Threat Feeds */}
                {result.threatFeeds && result.threatFeeds.findings?.length > 0 && (
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-sans text-xs sm:text-sm font-medium text-slate-400">Threat Feed Detections</span>
                    <span className={`data-text text-xs sm:text-sm font-semibold ${result.threatFeeds.detectionsCount > 0 ? 'text-[#FF5C6C]' : 'text-[#F6821F]'}`}>
                      {result.threatFeeds.detectionsCount > 0
                        ? `${result.threatFeeds.detectionsCount} vendor detection(s) flagged`
                        : (result.threatFeeds.providersChecked > 0 ? 'Clean (No vendor detections)' : 'Threat feeds unconfigured')}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION: RECOMMENDED ACTION ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
                <div className="space-y-1">
                  <span className="eyebrow-text text-brand-orange font-semibold">
                    ACTIONABLE MITIGATION
                  </span>
                  <h3 className="section-title text-white">
                    Recommended action
                  </h3>
                </div>
                <span className="eyebrow-text text-slate-400">
                  Immediate protocols
                </span>
              </div>

              <div className="divide-y divide-[#1E2638]">
                {(result.recommendedAction?.steps || [
                  result.riskScore >= 70
                    ? 'Do not enter credentials, OTPs, or financial details at this destination.'
                    : 'Verify destination URL before entering credentials.',
                  result.riskScore >= 70
                    ? 'Reject any payment or verification requests prompted by this entity.'
                    : 'Review sender identity and digital certificates.',
                  result.riskScore >= 70
                    ? 'Enforce DNS sinkhole blocking and file registrar abuse notifications.'
                    : 'Report any unexpected behavior to security response teams.'
                ]).map((step: string, index: number) => {
                  const num = String(index + 1).padStart(2, '0');
                  return (
                    <div key={index} className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                      <div className="md:col-span-1 data-text text-xs text-slate-400">
                        {num}
                      </div>
                      <div className="md:col-span-4 card-title text-sm sm:text-base text-white">
                        {index === 0 ? 'Authentication Protocol' : index === 1 ? 'Transaction Protocol' : 'Mitigation Protocol'}
                      </div>
                      <div className="md:col-span-7 body-text text-xs sm:text-sm text-slate-300">
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CUSTOMER ADVISORY MODAL (Dark Theme)                                      */}
        {/* ========================================================================= */}
        {advisoryModalOpen && advisories && (
          <div className="fixed inset-0 z-50 bg-[#080B11]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
                <div>
                  <span className="eyebrow-text text-brand-orange font-semibold">
                    PUBLIC NOTICE
                  </span>
                  <h3 className="section-title text-white">
                    Customer Safety Advisory
                  </h3>
                </div>
                <button
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1.5 cursor-pointer rounded-lg hover:bg-[#111625] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2.5 text-xs">
                <span className="font-sans font-medium text-slate-400">Language:</span>
                {(['en', 'hi', 'ta'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setAdvisoryLang(lang)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer button-text text-xs font-medium ${
                      advisoryLang === lang
                        ? 'bg-[#111625] text-[#F6821F] border border-[#F6821F]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'தமிழ் (Tamil)'}
                  </button>
                ))}
              </div>

              {/* Advisory Text Box */}
              <div className="bg-[#111625] border border-[#1E2638] p-4 sm:p-5 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto rounded-xl">
                {advisories.social.content}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="button-text px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(advisories.social.content);
                    setCopiedAdvisory(true);
                    setTimeout(() => setCopiedAdvisory(false), 2000);
                  }}
                  className="button-text inline-flex items-center gap-2 px-5 py-2.5 bg-[#F6821F] text-[#080B11] text-xs font-semibold rounded-xl hover:bg-[#2EB8A5] transition-all cursor-pointer shadow-md"
                >
                  {copiedAdvisory ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedAdvisory ? 'Copied to Clipboard' : 'Copy Advisory'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function CheckRiskPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-sans text-sm">Loading investigation instrument...</div>}>
      <CheckRiskContent />
    </Suspense>
  );
}
