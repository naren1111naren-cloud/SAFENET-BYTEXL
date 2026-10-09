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
  // SVG Arc gauge parameters
  const size = 130;
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 260-degree arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(score, maxScore)) / maxScore;

  const color = score >= 80 ? '#FF5C5C' : score >= 50 ? '#F5B84B' : '#18E6A3';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-[135deg]">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Active Arc */}
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
        <span className="font-mono text-[32px] font-semibold text-[#F2F4F3] leading-none tracking-tight">
          {score}
        </span>
        <span className="font-mono text-[11px] text-[#59625F] mt-1">/ {maxScore}</span>
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
    >
      <div className="max-w-5xl mx-auto space-y-16 pb-16">
        {/* ========================================================================= */}
        {/* 1. INVESTIGATION INPUT INSTRUMENT (NO BOX CARDS)                          */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-2">
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
              CHECK RISK
            </span>
            <h1 className="text-[28px] sm:text-[34px] font-normal tracking-tight text-[#F2F4F3]">
              What are you checking?
            </h1>
            <p className="text-[14px] text-[#8A9390] max-w-2xl leading-relaxed">
              Paste a URL, domain, message, account or application to investigate its risk signals across brand baseline and live telemetry.
            </p>
          </div>

          {/* Mode Selector Tabs (Clean underline / text styling) */}
          <div className="flex items-center gap-6 border-b border-[rgba(255,255,255,0.08)] pb-2 text-[12px] font-mono">
            <button
              type="button"
              onClick={() => loadDemoPreset('url')}
              className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                checkType === 'url'
                  ? 'text-[#F2F4F3] border-b-2 border-[#18E6A3] font-medium'
                  : 'text-[#59625F] hover:text-[#8A9390]'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              URL / DOMAIN
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('message')}
              className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                checkType === 'message'
                  ? 'text-[#F2F4F3] border-b-2 border-[#18E6A3] font-medium'
                  : 'text-[#59625F] hover:text-[#8A9390]'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              MESSAGE / EMAIL
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('social')}
              className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                checkType === 'social'
                  ? 'text-[#F2F4F3] border-b-2 border-[#18E6A3] font-medium'
                  : 'text-[#59625F] hover:text-[#8A9390]'
              }`}
            >
              <AtSign className="h-3.5 w-3.5" />
              SOCIAL ACCOUNT
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('app')}
              className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                checkType === 'app'
                  ? 'text-[#F2F4F3] border-b-2 border-[#18E6A3] font-medium'
                  : 'text-[#59625F] hover:text-[#8A9390]'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              APP / APK
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('lookalike')}
              className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                checkType === 'lookalike'
                  ? 'text-[#F2F4F3] border-b-2 border-[#18E6A3] font-medium'
                  : 'text-[#59625F] hover:text-[#8A9390]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#18E6A3]" />
              LOOK-ALIKE DETECTION
            </button>
          </div>

          {/* Look-alike Workbench or standard Check Input Surface */}
          {checkType === 'lookalike' ? (
            <div className="pt-2">
              <LookalikeDetectionWorkbench />
            </div>
          ) : (
            <>
              {/* Clean Input Surface */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRunAnalysis();
                }}
                className="space-y-4"
              >
                <div className="relative">
                  <textarea
                    rows={checkType === 'message' ? 3 : 2}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste something suspicious..."
                    className="w-full bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-4 py-3.5 text-[14px] text-[#F2F4F3] placeholder-[#59625F] focus:border-[rgba(255,255,255,0.25)] outline-none font-mono resize-none transition-colors"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  {/* Presets in subtle monospace */}
                  <div className="flex items-center gap-2 text-[12px] font-mono text-[#59625F] overflow-x-auto">
                    <span>Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('url');
                        setInputValue('http://paytm-support-verify.xyz');
                      }}
                      className="text-[#8A9390] hover:text-[#F2F4F3] transition-colors underline underline-offset-4"
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
                      className="text-[#8A9390] hover:text-[#F2F4F3] transition-colors underline underline-offset-4"
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
                      className="text-[#8A9390] hover:text-[#F2F4F3] transition-colors underline underline-offset-4"
                    >
                      com.paytm.cashback.reward.apk
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={analyzing || !inputValue.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#F2F4F3] text-[#080A0B] text-[13px] font-medium tracking-tight rounded-[2px] hover:bg-white transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>INVESTIGATING...</span>
                      </>
                    ) : (
                      <>
                        <span>CHECK RISK</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sequential Telemetry Progression (During scan) */}
              {analyzing && (
                <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#8A9390]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#18E6A3] animate-pulse" />
                    <span>EVALUATING ARTIFACT TELEMETRY:</span>
                    <span className="text-[#F2F4F3]">{inputValue.slice(0, 45)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                    {scanningStages.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 transition-opacity ${
                          idx <= analysisStep ? 'text-[#F2F4F3]' : 'text-[#59625F]'
                        }`}
                      >
                        <span className={idx <= analysisStep ? 'text-[#18E6A3]' : 'text-[#59625F]'}>
                          {idx < analysisStep ? '—' : idx === analysisStep ? '›' : '·'}
                        </span>
                        <span>{stage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ERROR STATE: ANALYSIS UNAVAILABLE                                         */}
        {/* ========================================================================= */}
        {errorMessage && !analyzing && (
          <div className="space-y-4 border border-[rgba(255,92,92,0.25)] bg-[#0D1011] p-8 rounded-[2px] text-center my-8">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#FF5C5C]">
              Analysis unavailable
            </span>
            <h3 className="text-[18px] text-[#F2F4F3] font-normal">
              {errorMessage}
            </h3>
            <p className="text-[13px] text-[#8A9390] max-w-lg mx-auto leading-relaxed">
              SAFENET could not complete this check. Please verify the target input, network status, or try again.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. RISK RESULT EXPERIENCE (THE CORE DECISION SYSTEM)                       */}
        {/* ========================================================================= */}
        {result && !analyzing && checkType !== 'lookalike' && (
          <div className="space-y-16 border-t border-[rgba(255,255,255,0.08)] pt-12">
            {/* ── TOP RESULT HERO: SCORE + VERDICT ── */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-12 border-b border-[rgba(255,255,255,0.08)]">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                    RISK ASSESSMENT
                  </span>
                  <span className="text-[#59625F]">/</span>
                  <span
                    className={`font-mono text-[11px] uppercase tracking-wider font-semibold ${
                      result.riskScore >= 70
                        ? 'text-[#FF5C5C]'
                        : result.riskScore >= 40
                        ? 'text-[#F5B84B]'
                        : 'text-[#18E6A3]'
                    }`}
                  >
                    {result.riskLevel || (result.riskScore >= 70 ? 'HIGH RISK' : result.riskScore >= 40 ? 'MEDIUM RISK' : 'SAFE / LOW RISK')}
                  </span>
                  <span className="text-[#59625F]">/</span>
                  <span className="font-mono text-[10px] text-[#8A9390] uppercase tracking-wider">
                    {result.isLLMPowered ? 'AI + HEURISTIC' : 'DETERMINISTIC HEURISTIC'}
                  </span>
                </div>

                <h2 className="text-[24px] sm:text-[30px] font-mono text-[#F2F4F3] font-normal break-all leading-tight">
                  {result.targetInput}
                </h2>

                <p className="text-[15px] text-[#8A9390] leading-relaxed max-w-2xl">
                  {result.summaryPhrase || (
                    result.riskScore >= 70
                      ? `SAFENET detected high-risk indicators targeting ${result.brand?.name || 'protected assets'}.`
                      : result.riskScore >= 40
                      ? `SAFENET detected moderate risk indicators requiring verification.`
                      : `No significant threat indicators detected for ${result.targetInput}.`
                  )}
                </p>

                {/* Primary Response Action Bar */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCreateIncident}
                    disabled={incidentCreated}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-[2px] text-[12px] font-mono cursor-pointer transition-all ${
                      incidentCreated
                        ? 'bg-[#0D1011] text-[#18E6A3] border border-[rgba(24,230,163,0.3)]'
                        : result.riskScore >= 50
                        ? 'bg-[#FF5C5C] text-[#080A0B] font-semibold hover:bg-[#ff7070]'
                        : 'bg-[#18E6A3] text-[#080A0B] font-semibold hover:bg-[#34eeb2]'
                    }`}
                  >
                    <AlertOctagon className="h-3.5 w-3.5" />
                    {incidentCreated ? '✓ INCIDENT LOGGED' : 'CREATE INCIDENT'}
                  </button>

                  <Link
                    href="/campaigns"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[rgba(255,255,255,0.08)] text-[#F2F4F3] text-[12px] font-mono hover:border-[rgba(255,255,255,0.25)] transition-colors rounded-[2px]"
                  >
                    <GitBranch className="h-3.5 w-3.5 text-[#8A9390]" />
                    INVESTIGATE CAMPAIGN
                  </Link>

                  <button
                    type="button"
                    onClick={() => setAdvisoryModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[rgba(255,255,255,0.08)] text-[#F2F4F3] text-[12px] font-mono hover:border-[rgba(255,255,255,0.25)] transition-colors rounded-[2px] cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#8A9390]" />
                    CUSTOMER ADVISORY
                  </button>

                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[#8A9390] hover:text-[#F2F4F3] text-[12px] font-mono transition-colors cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {copiedShare ? 'COPIED LINK' : 'SHARE'}
                  </button>
                </div>

                {incidentCreated && (
                  <div className="pt-2 flex items-center gap-3 text-[12px] font-mono text-[#8A9390]">
                    <span className="text-[#18E6A3]">●</span>
                    <span>Incident successfully queued in response center.</span>
                    <Link href="/incidents" className="text-[#F2F4F3] hover:underline">
                      View in queue →
                    </Link>
                  </div>
                )}
              </div>

              {/* Sophisticated SVG Arc Gauge */}
              <div className="flex flex-col items-center justify-center shrink-0 border border-[rgba(255,255,255,0.08)] p-6 rounded-[2px] bg-[#0D1011]/40 min-w-[200px]">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#59625F] mb-3">
                  THREAT SCORE
                </span>
                <RiskArcGauge score={result.riskScore ?? 0} />
                <span className="font-mono text-[11px] text-[#8A9390] mt-3">
                  {typeof result.confidence === 'number' ? `Confidence: ${result.confidence}%` : 'Confidence unavailable'}
                </span>
              </div>
            </div>

            {/* ── SECTION: WHY WE FLAGGED IT / DECISION SIGNALS ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                    DECISION SIGNALS
                  </span>
                  <h3 className="text-[20px] font-normal text-[#F2F4F3]">
                    Why SAFENET reached this assessment
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#59625F]">
                  {result.contributions?.length || result.reasons?.length || 0} evaluated signal{(result.contributions?.length || result.reasons?.length || 0) === 1 ? '' : 's'}
                </span>
              </div>

              {/* Horizontal rows with thin separators */}
              <div className="divide-y divide-[rgba(255,255,255,0.08)]">
                {result.contributions && result.contributions.length > 0 ? (
                  result.contributions.map((contrib: any, index: number) => {
                    const num = String(index + 1).padStart(2, '0');
                    return (
                      <div key={index} className="py-4.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                        <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">
                          {num}
                        </div>
                        <div className="md:col-span-4">
                          <div className="text-[14px] text-[#F2F4F3] font-medium">
                            {contrib.vector}
                          </div>
                          <div className="text-[12px] text-[#8A9390] mt-0.5 font-mono">
                            Contribution: +{contrib.points} pts
                          </div>
                        </div>
                        <div className="md:col-span-5 text-[13px] text-[#8A9390] leading-relaxed">
                          {contrib.reason}
                        </div>
                        <div className={`md:col-span-2 md:text-right font-mono text-[11px] ${
                          contrib.points >= 30 ? 'text-[#FF5C5C]' : contrib.points >= 15 ? 'text-[#F5B84B]' : 'text-[#18E6A3]'
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
                      <div key={index} className="py-4.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                        <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">{num}</div>
                        <div className="md:col-span-4 text-[14px] text-[#F2F4F3] font-medium">Evaluation Finding {num}</div>
                        <div className="md:col-span-5 text-[13px] text-[#8A9390] leading-relaxed">{reason}</div>
                        <div className="md:col-span-2 md:text-right font-mono text-[11px] text-[#18E6A3]">VERIFIED</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center font-mono text-[13px] text-[#8A9390]">
                    No significant risk indicators were detected.
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION: AI THREAT REASONING (IF AVAILABLE) ── */}
            {result.aiAnalysis && (
              <section className="space-y-4 border border-[rgba(24,230,163,0.2)] bg-[#18E6A3]/5 p-6 rounded-[2px]">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(24,230,163,0.15)]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#18E6A3] font-semibold">
                    NEURAL THREAT REASONING (GEMINI 1.5 FLASH)
                  </span>
                  <span className="font-mono text-[10px] text-[#8A9390]">EVIDENCE-GROUNDED INFERENCE</span>
                </div>
                <h4 className="text-[16px] text-[#F2F4F3] font-normal leading-snug">
                  {result.aiAnalysis.threatAssessment}
                </h4>
                <p className="text-[13px] text-[#8A9390] leading-relaxed">
                  {result.aiAnalysis.keyFindingsExplanation}
                </p>
                {result.aiAnalysis.contradictoryOrMissingEvidence?.length > 0 && (
                  <div className="pt-2 font-mono text-[11px] text-[#59625F]">
                    Evidence gaps: {result.aiAnalysis.contradictoryOrMissingEvidence.join(' • ')}
                  </div>
                )}
              </section>
            )}

            {/* ── SECTION: TECHNICAL EVIDENCE (REAL MULTI-SOURCE INTELLIGENCE) ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                    TECHNICAL EVIDENCE
                  </span>
                  <h3 className="text-[20px] font-normal text-[#F2F4F3]">
                    Multi-source network intelligence
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#59625F]">
                  Authoritative Lookups
                </span>
              </div>

              <div className="font-mono text-[12px] divide-y divide-[rgba(255,255,255,0.08)]">
                {/* 1. Identity & Asset */}
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#59625F]">Target Asset</span>
                  <span className="text-[#F2F4F3]">{result.normalizedTarget || result.targetInput}</span>
                </div>

                {/* 2. DNS Resolution */}
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#59625F]">DNS Status</span>
                  <span className={result.dns ? (result.dns.isResolved || result.dns.resolved ? 'text-[#18E6A3]' : 'text-[#F5B84B]') : 'text-[#8A9390]'}>
                    {result.dns ? ((result.dns.isResolved || result.dns.resolved) ? 'Resolved (A/AAAA Active)' : `No resolution (${result.dns.overallStatus || 'NXDOMAIN'})`) : 'Not applicable'}
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#59625F]">Resolved IPv4</span>
                  <span className="text-[#F2F4F3]">
                    {result.dns?.ipv4 && result.dns.ipv4.length > 0 ? result.dns.ipv4.join(', ') : 'None'}
                  </span>
                </div>

                {result.dns?.mx && result.dns.mx.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#59625F]">Mail Exchangers (MX)</span>
                    <span className="text-[#F2F4F3]">{result.dns.mx.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {result.dns?.ns && result.dns.ns.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#59625F]">Nameservers (NS)</span>
                    <span className="text-[#F2F4F3]">{result.dns.ns.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {/* 3. RDAP Registration */}
                {result.rdap && (
                  <>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">Domain Registrar</span>
                      <span className={result.rdap.registrarName ? 'text-[#F2F4F3]' : 'text-[#59625F]'}>
                        {result.rdap.registrarName ? `${result.rdap.registrarName}${result.rdap.registrarIanaId ? ` (IANA: ${result.rdap.registrarIanaId})` : ''}` : (result.rdap.status === 'unavailable' ? 'Unavailable via RDAP' : 'Not available')}
                      </span>
                    </div>

                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">Domain Age & Creation</span>
                      <span className={result.rdap.registrationDateUtc ? 'text-[#F2F4F3]' : 'text-[#59625F]'}>
                        {result.rdap.registrationDateUtc ? `${result.rdap.domainAgeFormatted || 'Verified'} (Created: ${result.rdap.registrationDateUtc.split('T')[0]})` : 'Unavailable / Not returned by registry'}
                      </span>
                    </div>
                  </>
                )}

                {/* 4. TLS Certificate */}
                {result.tls && result.tls.status !== 'no_tls' && (
                  <>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">TLS Certificate Status</span>
                      <span className={result.tls.status === 'valid' ? 'text-[#18E6A3]' : 'text-[#FF5C5C]'}>
                        {result.tls.status === 'valid' ? `Valid (${result.tls.daysRemaining} days remaining)` : `Anomaly: ${result.tls.status} (${result.tls.error || 'Verification error'})`}
                      </span>
                    </div>

                    {result.tls.issuer?.commonName && (
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#59625F]">Certificate Authority</span>
                        <span className="text-[#8A9390]">{result.tls.issuer.commonName}</span>
                      </div>
                    )}
                  </>
                )}

                {/* 5. HTTP & Transport */}
                {result.http && (
                  <>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">HTTP Endpoint Status</span>
                      <span className={result.http.isAccessible ? 'text-[#18E6A3]' : 'text-[#F5B84B]'}>
                        {result.http.isAccessible ? `HTTP ${result.http.statusCode} (${result.http.durationMs}ms latency)` : `Unreachable (${result.http.error || 'Connection failed'})`}
                      </span>
                    </div>

                    {result.http.redirectCount > 0 && (
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#59625F]">Redirect Chain</span>
                        <span className="text-[#F5B84B] truncate max-w-md">
                          {result.http.redirectCount} hop(s) &rarr; {result.http.finalUrl}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* 6. Webpage HTML Findings */}
                {result.page && result.page.inspected && (
                  <>
                    {result.page.title && (
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#59625F]">HTML Title</span>
                        <span className="text-[#F2F4F3] truncate max-w-md">&ldquo;{result.page.title}&rdquo;</span>
                      </div>
                    )}

                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">Interactive Forms</span>
                      <span className="text-[#F2F4F3]">
                        {result.page.formCount} form(s) ({result.page.passwordInputCount} password, {result.page.otpInputCount} OTP fields)
                      </span>
                    </div>

                    {result.page.hasCrossDomainFormSubmission && (
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#FF5C5C]">Cross-Domain Form Exfiltration</span>
                        <span className="text-[#FF5C5C]">Detected (submits credentials across foreign domain)</span>
                      </div>
                    )}
                  </>
                )}

                {/* 7. IP Network & ASN Enrichment */}
                {result.ipIntel && result.ipIntel.status === 'available' && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#59625F]">Network Infrastructure</span>
                    <span className="text-[#F2F4F3]">
                      {result.ipIntel.asn || 'AS Unknown'} • {result.ipIntel.asOrganization || result.ipIntel.isp || 'Hosting Provider'} ({result.ipIntel.country || 'Region'})
                    </span>
                  </div>
                )}

                {/* 8. Threat Feeds */}
                {result.threatFeeds && result.threatFeeds.findings?.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#59625F]">Threat Feed Detections</span>
                    <span className={result.threatFeeds.detectionsCount > 0 ? 'text-[#FF5C5C]' : 'text-[#18E6A3]'}>
                      {result.threatFeeds.detectionsCount > 0
                        ? `${result.threatFeeds.detectionsCount} vendor detection(s) flagged`
                        : (result.threatFeeds.providersChecked > 0 ? 'Clean (No vendor detections)' : 'Threat feeds unconfigured')}
                    </span>
                  </div>
                )}
              </div>

              {/* Analysis Limitations Banner if any service encountered gaps */}
              {result.limitations && result.limitations.length > 0 && (
                <div className="p-4 border border-[rgba(255,255,255,0.08)] bg-[#0D1011] rounded-[2px] space-y-1 font-mono text-[11px] text-[#8A9390]">
                  <div className="text-[#59625F] uppercase tracking-wider font-semibold">ANALYSIS LIMITATIONS</div>
                  {result.limitations.map((lim: string, lIdx: number) => (
                    <div key={lIdx}>• {lim}</div>
                  ))}
                </div>
              )}
            </section>

            {/* ── SECTION: CAMPAIGN CORRELATION & INFRASTRUCTURE VISUALIZATION ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                    NETWORK TOPOLOGY
                  </span>
                  <h3 className="text-[20px] font-normal text-[#F2F4F3]">
                    Campaign correlation
                  </h3>
                </div>
                <Link
                  href="/campaigns"
                  className="font-mono text-[11px] text-[#8A9390] hover:text-[#F2F4F3] transition-colors"
                >
                  View full cluster →
                </Link>
              </div>

              {/* Data visualization: restrained node diagram */}
              <div className="p-6 border border-[rgba(255,255,255,0.08)] bg-[#0D1011]/30 rounded-[2px] space-y-6">
                {result.campaignName ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] text-[#8A9390]">
                      <div>
                        This artifact is linked to <span className="text-[#F2F4F3] font-medium">&ldquo;{result.campaignName}&rdquo;</span>.
                      </div>
                      <div className="font-mono text-[11px] text-[#59625F]">
                        Connected entities: {result.connectedNodesCount || 2} nodes
                      </div>
                    </div>

                    <div className="space-y-3 font-mono text-[12px]">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-[#0D1011] border border-[rgba(255,255,255,0.12)] text-[#FF5C5C] rounded-[2px]">
                          TARGET ENTITY
                        </span>
                        <span className="text-[#59625F]">────────</span>
                        <span className="text-[#F2F4F3]">{result.targetInput}</span>
                      </div>

                      {result.dns?.ipv4 && result.dns.ipv4.length > 0 && (
                        <div className="flex items-center gap-3 pl-8">
                          <span className="text-[#59625F]">│</span>
                          <span className="text-[#59625F]">└── SHARED HOST</span>
                          <span className="text-[#8A9390]">{result.dns.ipv4[0]}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-[13px] text-[#8A9390]">
                      No confirmed campaign correlation available.
                    </div>
                    {result.dns?.resolved && result.dns.ipv4 && result.dns.ipv4.length > 0 && (
                      <div className="space-y-3 font-mono text-[12px] pt-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-[#0D1011] border border-[rgba(255,255,255,0.12)] text-[#18E6A3] rounded-[2px]">
                            RESOLVED HOST
                          </span>
                          <span className="text-[#59625F]">────────</span>
                          <span className="text-[#F2F4F3]">{result.targetInput}</span>
                        </div>
                        <div className="flex items-center gap-3 pl-8">
                          <span className="text-[#59625F]">└── IP ADDRESS</span>
                          <span className="text-[#8A9390]">{result.dns.ipv4.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION: RECOMMENDED ACTION (DECIDE & ACT) ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                    ACTIONABLE MITIGATION
                  </span>
                  <h3 className="text-[20px] font-normal text-[#F2F4F3]">
                    Recommended action
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#59625F]">
                  Immediate protocols
                </span>
              </div>

              {/* Numbered Plain Instructions */}
              <div className="divide-y divide-[rgba(255,255,255,0.08)]">
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
                      <div className="md:col-span-1 font-mono text-[12px] text-[#59625F]">
                        {num}
                      </div>
                      <div className="md:col-span-4 text-[14px] text-[#F2F4F3] font-medium">
                        {index === 0 ? 'Authentication Protocol' : index === 1 ? 'Transaction Protocol' : 'Mitigation Protocol'}
                      </div>
                      <div className="md:col-span-7 text-[13px] text-[#8A9390] leading-relaxed">
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Direct Next Step Action Bar */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleCreateIncident}
                  disabled={incidentCreated}
                  className="px-5 py-2.5 bg-[#F2F4F3] text-[#080A0B] text-[13px] font-medium rounded-[2px] hover:bg-white transition-all cursor-pointer disabled:opacity-40"
                >
                  {incidentCreated ? 'INCIDENT ACTIVE' : 'LOG INCIDENT TO QUEUE →'}
                </button>

                <button
                  type="button"
                  onClick={() => setAdvisoryModalOpen(true)}
                  className="px-5 py-2.5 border border-[rgba(255,255,255,0.08)] text-[#F2F4F3] text-[13px] rounded-[2px] hover:border-[rgba(255,255,255,0.25)] transition-colors cursor-pointer"
                >
                  PREPARE CUSTOMER ADVISORY
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CUSTOMER ADVISORY MODAL (EDITORIAL REDESIGN)                              */}
        {/* ========================================================================= */}
        {advisoryModalOpen && advisories && (
          <div className="fixed inset-0 z-50 bg-[#080A0B]/85 backdrop-blur-[4px] flex items-center justify-center p-4">
            <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.12)] rounded-[2px] max-w-xl w-full p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#59625F]">
                    PUBLIC NOTICE
                  </span>
                  <h3 className="text-[16px] font-normal text-[#F2F4F3]">
                    Customer Safety Advisory
                  </h3>
                </div>
                <button
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="text-[#59625F] hover:text-[#F2F4F3] p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[#59625F]">Language:</span>
                {(['en', 'hi', 'ta'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setAdvisoryLang(lang)}
                    className={`px-2 py-0.5 rounded-[2px] transition-colors cursor-pointer ${
                      advisoryLang === lang
                        ? 'bg-[#F2F4F3] text-[#080A0B] font-medium'
                        : 'text-[#8A9390] hover:text-[#F2F4F3]'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'தமிழ் (Tamil)'}
                  </button>
                ))}
              </div>

              {/* Advisory Text Box */}
              <div className="bg-[#080A0B] border border-[rgba(255,255,255,0.08)] p-4 font-mono text-[12px] text-[#F2F4F3] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {advisories.social.content}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="px-4 py-2 text-[12px] font-mono text-[#8A9390] hover:text-[#F2F4F3] cursor-pointer"
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2F4F3] text-[#080A0B] text-[12px] font-medium rounded-[2px] hover:bg-white transition-all cursor-pointer"
                >
                  {copiedAdvisory ? <Check className="h-3.5 w-3.5 text-[#18E6A3]" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedAdvisory ? 'COPIED TO CLIPBOARD' : 'COPY ADVISORY'}
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
    <Suspense fallback={<div className="p-12 text-center text-[#8A9390] font-mono text-[13px]">Loading investigation instrument...</div>}>
      <CheckRiskContent />
    </Suspense>
  );
}
