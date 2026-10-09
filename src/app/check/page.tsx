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
  const size = 140;
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(score, maxScore)) / maxScore;

  const color = score >= 80 ? '#FF3366' : score >= 50 ? '#F5B84B' : '#00F5A0';
  const glow = score >= 80 ? 'rgba(255, 51, 102, 0.4)' : score >= 50 ? 'rgba(245, 184, 75, 0.4)' : 'rgba(0, 245, 160, 0.4)';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-[135deg] drop-shadow-[0_0_12px_var(--glow)]" style={{ '--glow': glow } as any}>
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
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
        <span className="font-mono text-[34px] font-black text-[#F0F6FC] leading-none tracking-tight">
          {score}
        </span>
        <span className="font-mono text-[11px] text-[#59625F] mt-1 font-semibold">/ {maxScore}</span>
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
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#00D2FF]/10 border border-[#00D2FF]/25 font-mono text-[10px] tracking-widest text-[#00D2FF] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse" />
              <span>FORENSIC TELEMETRY INSTRUMENT</span>
            </div>
            <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight text-[#F0F6FC]">
              Inspect Suspicious Digital Asset
            </h1>
            <p className="text-[14px] text-[#8B949E] max-w-2xl leading-relaxed">
              Verify unknown domains, urgent SMS lures, customer support social handles, or unofficial Android APKs against verified brand baselines and authoritative intelligence feeds.
            </p>
          </div>

          {/* Mode Selector Tabs (Sleek cyber segmented controls) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 p-1 bg-[#0A0D14] border border-[#1E2638] rounded-md text-[11px] font-mono">
            <button
              type="button"
              onClick={() => loadDemoPreset('url')}
              className={`px-3 py-2 rounded transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                checkType === 'url'
                  ? 'bg-[#121826] text-[#00D2FF] border border-[#00D2FF]/30 shadow-[0_0_12px_rgba(0,210,255,0.15)] font-bold'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#121826]/50'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              <span>URL / DOMAIN</span>
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('message')}
              className={`px-3 py-2 rounded transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                checkType === 'message'
                  ? 'bg-[#121826] text-[#00D2FF] border border-[#00D2FF]/30 shadow-[0_0_12px_rgba(0,210,255,0.15)] font-bold'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#121826]/50'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>MESSAGE / SMS</span>
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('social')}
              className={`px-3 py-2 rounded transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                checkType === 'social'
                  ? 'bg-[#121826] text-[#00D2FF] border border-[#00D2FF]/30 shadow-[0_0_12px_rgba(0,210,255,0.15)] font-bold'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#121826]/50'
              }`}
            >
              <AtSign className="h-3.5 w-3.5" />
              <span>SOCIAL HANDLE</span>
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('app')}
              className={`px-3 py-2 rounded transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                checkType === 'app'
                  ? 'bg-[#121826] text-[#00D2FF] border border-[#00D2FF]/30 shadow-[0_0_12px_rgba(0,210,255,0.15)] font-bold'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#121826]/50'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>APP PACKAGE</span>
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('lookalike')}
              className={`px-3 py-2 rounded transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                checkType === 'lookalike'
                  ? 'bg-[#121826] text-[#00F5A0] border border-[#00F5A0]/30 shadow-[0_0_12px_rgba(0,245,160,0.15)] font-bold'
                  : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#121826]/50'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#00F5A0]" />
              <span>LOOK-ALIKE ENGINE</span>
            </button>
          </div>

          {/* Look-alike Workbench or standard Check Input Surface */}
          {checkType === 'lookalike' ? (
            <div className="pt-2">
              <LookalikeDetectionWorkbench />
            </div>
          ) : (
            <div className="cyber-card p-6 space-y-5">
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
                    placeholder="Enter suspicious domain, phone message, APK package or social username..."
                    className="w-full bg-[#06080C] border border-[#1E2638] rounded px-4 py-3 text-[14px] text-[#F0F6FC] placeholder-[#59625F] focus:border-[#00D2FF] focus:ring-1 focus:ring-[#00D2FF]/20 outline-none font-mono resize-none transition-all"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  {/* Presets in styled chips */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#8B949E] overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-[#59625F] uppercase font-semibold">Test Vectors:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('url');
                        setInputValue('http://paytm-support-verify.xyz');
                      }}
                      className="px-2 py-1 rounded bg-[#121826] hover:bg-[#1A2234] border border-[#1E2638] text-[#00D2FF] hover:border-[#00D2FF]/40 transition-colors"
                    >
                      paytm-support-verify.xyz
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('social');
                        setInputValue('@Paytm_CareHelp');
                      }}
                      className="px-2 py-1 rounded bg-[#121826] hover:bg-[#1A2234] border border-[#1E2638] text-[#F5B84B] hover:border-[#F5B84B]/40 transition-colors"
                    >
                      @Paytm_CareHelp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('app');
                        setInputValue('com.paytm.cashback.reward.apk');
                      }}
                      className="px-2 py-1 rounded bg-[#121826] hover:bg-[#1A2234] border border-[#1E2638] text-[#FF3366] hover:border-[#FF3366]/40 transition-colors"
                    >
                      com.paytm.cashback.reward.apk
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={analyzing || !inputValue.trim()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00D2FF] to-[#00F5A0] text-[#06080C] font-mono font-bold text-[12px] tracking-wider rounded hover:opacity-95 shadow-[0_0_16px_rgba(0,210,255,0.25)] transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#06080C]" />
                        <span>RUNNING HEURISTICS...</span>
                      </>
                    ) : (
                      <>
                        <span>EXECUTE SCAN</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sequential Telemetry Progression (During scan) */}
              {analyzing && (
                <div className="pt-4 border-t border-[#1E2638] space-y-3">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#8B949E]">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#00D2FF] animate-ping" />
                      <span className="text-[#00D2FF] font-semibold">PIPELINE ACTIVE:</span>
                      <span className="text-[#F0F6FC] truncate max-w-sm">{inputValue}</span>
                    </div>
                    <span className="text-[#00D2FF]">STAGE {analysisStep + 1} / {scanningStages.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] p-3 rounded bg-[#06080C] border border-[#1E2638]">
                    {scanningStages.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 transition-opacity ${
                          idx <= analysisStep ? 'text-[#F0F6FC]' : 'text-[#59625F]'
                        }`}
                      >
                        <span className={idx < analysisStep ? 'text-[#00F5A0]' : idx === analysisStep ? 'text-[#00D2FF] animate-pulse' : 'text-[#59625F]'}>
                          {idx < analysisStep ? '✓' : idx === analysisStep ? '▶' : '·'}
                        </span>
                        <span>{stage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* ERROR STATE: ANALYSIS UNAVAILABLE                                         */}
        {/* ========================================================================= */}
        {errorMessage && !analyzing && (
          <div className="border border-[#FF3366]/40 bg-[#FF3366]/5 p-8 rounded text-center my-8 shadow-[0_0_24px_rgba(255,51,102,0.1)]">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#FF3366] font-bold">
              ANALYSIS INTERRUPTED
            </span>
            <h3 className="text-[18px] text-[#F0F6FC] font-semibold mt-1">
              {errorMessage}
            </h3>
            <p className="text-[13px] text-[#8B949E] max-w-lg mx-auto leading-relaxed mt-2">
              SAFENET could not complete this check. Please verify the target input, network status, or try again.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. RISK RESULT EXPERIENCE (THE CORE DECISION SYSTEM)                       */}
        {/* ========================================================================= */}
        {result && !analyzing && checkType !== 'lookalike' && (
          <div className="space-y-12 border-t border-[#1E2638] pt-10">
            {/* ── TOP RESULT HERO: SCORE + VERDICT ── */}
            <div className="cyber-card p-6 sm:p-8 flex flex-col md:flex-row md:items-start justify-between gap-8 border-[#00D2FF]/20 shadow-[0_0_30px_rgba(0,210,255,0.06)]">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span className="text-[#59625F] uppercase font-semibold">TARGET VERDICT</span>
                  <span className="text-[#59625F]">/</span>
                  <span
                    className={
                      result.riskScore >= 70
                        ? 'badge-critical'
                        : result.riskScore >= 40
                        ? 'badge-high'
                        : 'badge-nominal'
                    }
                  >
                    {result.riskLevel || (result.riskScore >= 70 ? 'CRITICAL RISK' : result.riskScore >= 40 ? 'MEDIUM RISK' : 'LOW RISK / NOMINAL')}
                  </span>
                  <span className="text-[#59625F]">/</span>
                  <span className="badge-telemetry">
                    {result.isLLMPowered ? 'NEURAL + DETERMINISTIC' : 'DETERMINISTIC HEURISTIC'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-[22px] sm:text-[28px] font-mono font-bold text-[#F0F6FC] break-all leading-tight">
                    {result.targetInput}
                  </h2>
                  <p className="text-[14px] text-[#8B949E] leading-relaxed max-w-2xl">
                    {result.summaryPhrase || (
                      result.riskScore >= 70
                        ? `SAFENET detected high-risk impersonation indicators targeting ${result.brand?.name || 'protected assets'}.`
                        : result.riskScore >= 40
                        ? `SAFENET detected moderate risk indicators requiring secondary verification.`
                        : `No malicious signals detected for ${result.targetInput} against protected perimeter baseline.`
                    )}
                  </p>
                </div>

                {/* Primary Response Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCreateIncident}
                    disabled={incidentCreated}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded text-[12px] font-mono font-bold tracking-wider cursor-pointer transition-all ${
                      incidentCreated
                        ? 'bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/40 shadow-[0_0_12px_rgba(0,245,160,0.2)]'
                        : result.riskScore >= 50
                        ? 'bg-[#FF3366] text-[#06080C] hover:bg-[#ff4d7a] shadow-[0_0_16px_rgba(255,51,102,0.3)]'
                        : 'bg-[#00F5A0] text-[#06080C] hover:bg-[#20ffb0] shadow-[0_0_16px_rgba(0,245,160,0.3)]'
                    }`}
                  >
                    <AlertOctagon className="h-3.5 w-3.5" />
                    {incidentCreated ? '✓ INCIDENT LOGGED' : 'LOG TO INCIDENTS'}
                  </button>

                  <Link
                    href="/campaigns"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E131F] border border-[#1E2638] text-[#F0F6FC] hover:border-[#00D2FF]/40 hover:text-[#00D2FF] text-[12px] font-mono tracking-wider transition-all rounded"
                  >
                    <GitBranch className="h-3.5 w-3.5 text-[#00D2FF]" />
                    <span>CORRELATE CAMPAIGN</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setAdvisoryModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0E131F] border border-[#1E2638] text-[#F0F6FC] hover:border-[#00F5A0]/40 hover:text-[#00F5A0] text-[12px] font-mono tracking-wider transition-all rounded cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#00F5A0]" />
                    <span>PUBLIC ADVISORY</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[#8B949E] hover:text-[#00D2FF] text-[12px] font-mono transition-colors cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>{copiedShare ? 'COPIED LINK' : 'SHARE'}</span>
                  </button>
                </div>

                {incidentCreated && (
                  <div className="pt-2 flex items-center gap-2 text-[12px] font-mono text-[#00F5A0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
                    <span>Incident successfully queued in response center.</span>
                    <Link href="/incidents" className="text-[#00D2FF] hover:underline font-semibold ml-1">
                      View queue →
                    </Link>
                  </div>
                )}
              </div>

              {/* Sophisticated SVG Arc Gauge in cyber box */}
              <div className="flex flex-col items-center justify-center shrink-0 border border-[#1E2638] p-6 rounded bg-[#06080C] min-w-[210px] shadow-inner">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#59625F] mb-2 font-bold">
                  THREAT SCORE
                </span>
                <RiskArcGauge score={result.riskScore ?? 0} />
                <span className="font-mono text-[11px] text-[#8B949E] mt-3">
                  {typeof result.confidence === 'number' ? `Confidence: ${result.confidence}%` : 'Confidence calibrated'}
                </span>
              </div>
            </div>

            {/* ── SECTION: WHY WE FLAGGED IT / DECISION SIGNALS ── */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#00D2FF] font-bold">
                    DECISION MATRIX
                  </span>
                  <h3 className="text-[20px] font-bold text-[#F0F6FC]">
                    Forensic Signal Breakdown
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#59625F]">
                  {result.contributions?.length || result.reasons?.length || 0} evaluated signal{(result.contributions?.length || result.reasons?.length || 0) === 1 ? '' : 's'}
                </span>
              </div>

              <div className="cyber-card divide-y divide-[#1E2638]">
                {result.contributions && result.contributions.length > 0 ? (
                  result.contributions.map((contrib: any, index: number) => {
                    const num = String(index + 1).padStart(2, '0');
                    return (
                      <div key={index} className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline hover:bg-[#121826]/30 transition-colors">
                        <div className="md:col-span-1 font-mono text-[12px] text-[#59625F] font-bold">
                          {num}
                        </div>
                        <div className="md:col-span-4">
                          <div className="text-[14px] text-[#F0F6FC] font-semibold">
                            {contrib.vector}
                          </div>
                          <div className="text-[11px] text-[#00D2FF] mt-0.5 font-mono">
                            Contribution: +{contrib.points} pts
                          </div>
                        </div>
                        <div className="md:col-span-5 text-[13px] text-[#8B949E] leading-relaxed">
                          {contrib.reason}
                        </div>
                        <div className="md:col-span-2 md:text-right font-mono text-[11px]">
                          <span
                            className={
                              contrib.points >= 30
                                ? 'badge-critical'
                                : contrib.points >= 15
                                ? 'badge-high'
                                : 'badge-nominal'
                            }
                          >
                            {contrib.points >= 30 ? 'HIGH IMPACT' : contrib.points >= 15 ? 'MODERATE' : 'NOMINAL'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : result.reasons && result.reasons.length > 0 ? (
                  result.reasons.map((reason: string, index: number) => {
                    const num = String(index + 1).padStart(2, '0');
                    return (
                      <div key={index} className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline hover:bg-[#121826]/30 transition-colors">
                        <div className="md:col-span-1 font-mono text-[12px] text-[#59625F] font-bold">{num}</div>
                        <div className="md:col-span-4 text-[14px] text-[#F0F6FC] font-semibold">Evaluation Finding {num}</div>
                        <div className="md:col-span-5 text-[13px] text-[#8B949E] leading-relaxed">{reason}</div>
                        <div className="md:col-span-2 md:text-right font-mono text-[11px]">
                          <span className="badge-nominal">VERIFIED</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center font-mono text-[13px] text-[#8B949E]">
                    No anomalous risk indicators were detected.
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION: AI THREAT REASONING (IF AVAILABLE) ── */}
            {result.aiAnalysis && (
              <section className="space-y-4 border border-[#00D2FF]/30 bg-[#00D2FF]/5 p-6 rounded shadow-[0_0_24px_rgba(0,210,255,0.06)]">
                <div className="flex items-center justify-between pb-3 border-b border-[#00D2FF]/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#00D2FF]" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#00D2FF] font-bold">
                      NEURAL THREAT REASONING (GEMINI)
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8B949E] bg-[#0E131F] px-2 py-0.5 rounded border border-[#1E2638]">
                    GROUNDED INFERENCE
                  </span>
                </div>
                <h4 className="text-[16px] text-[#F0F6FC] font-semibold leading-snug">
                  {result.aiAnalysis.threatAssessment}
                </h4>
                <p className="text-[13px] text-[#8B949E] leading-relaxed">
                  {result.aiAnalysis.keyFindingsExplanation}
                </p>
                {result.aiAnalysis.contradictoryOrMissingEvidence?.length > 0 && (
                  <div className="pt-2 font-mono text-[11px] text-[#59625F] border-t border-[#1E2638]">
                    Evidence gaps: {result.aiAnalysis.contradictoryOrMissingEvidence.join(' • ')}
                  </div>
                )}
              </section>
            )}

            {/* ── SECTION: TECHNICAL EVIDENCE (REAL MULTI-SOURCE INTELLIGENCE) ── */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#00D2FF] font-bold">
                    TECHNICAL EVIDENCE
                  </span>
                  <h3 className="text-[20px] font-bold text-[#F0F6FC]">
                    Multi-Source Network Telemetry
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#59625F]">
                  Authoritative Lookups
                </span>
              </div>

              <div className="cyber-card p-5 font-mono text-[12px] divide-y divide-[#1E2638]">
                {/* 1. Identity & Asset */}
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#59625F]">Target Asset</span>
                  <span className="text-[#F0F6FC] font-bold">{result.normalizedTarget || result.targetInput}</span>
                </div>

                {/* 2. DNS Resolution */}
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#59625F]">DNS Status</span>
                  <span className={result.dns ? (result.dns.isResolved || result.dns.resolved ? 'text-[#00F5A0] font-semibold' : 'text-[#F5B84B]') : 'text-[#8B949E]'}>
                    {result.dns ? ((result.dns.isResolved || result.dns.resolved) ? 'Resolved (A/AAAA Active)' : `No resolution (${result.dns.overallStatus || 'NXDOMAIN'})`) : 'Not applicable'}
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#59625F]">Resolved IPv4</span>
                  <span className="text-[#F0F6FC]">
                    {result.dns?.ipv4 && result.dns.ipv4.length > 0 ? result.dns.ipv4.join(', ') : 'None'}
                  </span>
                </div>

                {result.dns?.mx && result.dns.mx.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#59625F]">Mail Exchangers (MX)</span>
                    <span className="text-[#F0F6FC]">{result.dns.mx.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {result.dns?.ns && result.dns.ns.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#59625F]">Nameservers (NS)</span>
                    <span className="text-[#F0F6FC]">{result.dns.ns.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {/* 3. RDAP Registration */}
                {result.rdap && (
                  <>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">Domain Registrar</span>
                      <span className={result.rdap.registrarName ? 'text-[#F0F6FC]' : 'text-[#59625F]'}>
                        {result.rdap.registrarName ? `${result.rdap.registrarName}${result.rdap.registrarIanaId ? ` (IANA: ${result.rdap.registrarIanaId})` : ''}` : (result.rdap.status === 'unavailable' ? 'Unavailable via RDAP' : 'Not available')}
                      </span>
                    </div>

                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">Domain Age & Creation</span>
                      <span className={result.rdap.registrationDateUtc ? 'text-[#00D2FF] font-semibold' : 'text-[#59625F]'}>
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
                      <span className={result.tls.status === 'valid' ? 'text-[#00F5A0] font-semibold' : 'text-[#FF3366] font-semibold'}>
                        {result.tls.status === 'valid' ? `Valid (${result.tls.daysRemaining} days remaining)` : `Anomaly: ${result.tls.status} (${result.tls.error || 'Verification error'})`}
                      </span>
                    </div>

                    {result.tls.issuer?.commonName && (
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#59625F]">Certificate Authority</span>
                        <span className="text-[#8B949E]">{result.tls.issuer.commonName}</span>
                      </div>
                    )}
                  </>
                )}

                {/* 5. HTTP & Transport */}
                {result.http && (
                  <>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">HTTP Endpoint Status</span>
                      <span className={result.http.isAccessible ? 'text-[#00F5A0] font-semibold' : 'text-[#F5B84B]'}>
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
                        <span className="text-[#F0F6FC] truncate max-w-md">&ldquo;{result.page.title}&rdquo;</span>
                      </div>
                    )}

                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#59625F]">Interactive Forms</span>
                      <span className="text-[#F0F6FC]">
                        {result.page.formCount} form(s) ({result.page.passwordInputCount} password, {result.page.otpInputCount} OTP fields)
                      </span>
                    </div>

                    {result.page.hasCrossDomainFormSubmission && (
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#FF3366] font-bold">Cross-Domain Form Exfiltration</span>
                        <span className="text-[#FF3366] font-semibold">Detected (submits credentials across foreign domain)</span>
                      </div>
                    )}
                  </>
                )}

                {/* 7. IP Network & ASN Enrichment */}
                {result.ipIntel && result.ipIntel.status === 'available' && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#59625F]">Network Infrastructure</span>
                    <span className="text-[#F0F6FC]">
                      {result.ipIntel.asn || 'AS Unknown'} • {result.ipIntel.asOrganization || result.ipIntel.isp || 'Hosting Provider'} ({result.ipIntel.country || 'Region'})
                    </span>
                  </div>
                )}

                {/* 8. Threat Feeds */}
                {result.threatFeeds && result.threatFeeds.findings?.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#59625F]">Threat Feed Detections</span>
                    <span className={result.threatFeeds.detectionsCount > 0 ? 'text-[#FF3366] font-bold' : 'text-[#00F5A0]'}>
                      {result.threatFeeds.detectionsCount > 0
                        ? `${result.threatFeeds.detectionsCount} vendor detection(s) flagged`
                        : (result.threatFeeds.providersChecked > 0 ? 'Clean (No vendor detections)' : 'Threat feeds unconfigured')}
                    </span>
                  </div>
                )}
              </div>

              {/* Analysis Limitations Banner if any service encountered gaps */}
              {result.limitations && result.limitations.length > 0 && (
                <div className="p-4 border border-[#1E2638] bg-[#0E131F] rounded space-y-1 font-mono text-[11px] text-[#8B949E]">
                  <div className="text-[#00D2FF] uppercase tracking-wider font-semibold">ANALYSIS LIMITATIONS</div>
                  {result.limitations.map((lim: string, lIdx: number) => (
                    <div key={lIdx}>• {lim}</div>
                  ))}
                </div>
              )}
            </section>

            {/* ── SECTION: CAMPAIGN CORRELATION & INFRASTRUCTURE VISUALIZATION ── */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#00D2FF] font-bold">
                    INFRASTRUCTURE TOPOLOGY
                  </span>
                  <h3 className="text-[20px] font-bold text-[#F0F6FC]">
                    Campaign Correlation Cluster
                  </h3>
                </div>
                <Link
                  href="/campaigns"
                  className="font-mono text-[11px] text-[#00D2FF] hover:underline"
                >
                  View full cluster →
                </Link>
              </div>

              <div className="cyber-card p-6 space-y-6">
                {result.campaignName ? (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] text-[#8B949E]">
                      <div>
                        This artifact is linked to <span className="text-[#00D2FF] font-bold">&ldquo;{result.campaignName}&rdquo;</span>.
                      </div>
                      <div className="font-mono text-[11px] text-[#59625F]">
                        Connected entities: {result.connectedNodesCount || 2} nodes
                      </div>
                    </div>

                    <div className="space-y-3 font-mono text-[12px] p-4 bg-[#06080C] rounded border border-[#1E2638]">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 bg-[#FF3366]/10 border border-[#FF3366]/40 text-[#FF3366] rounded font-bold">
                          TARGET ENTITY
                        </span>
                        <span className="text-[#59625F]">────────</span>
                        <span className="text-[#F0F6FC] font-semibold">{result.targetInput}</span>
                      </div>

                      {result.dns?.ipv4 && result.dns.ipv4.length > 0 && (
                        <div className="flex items-center gap-3 pl-8">
                          <span className="text-[#59625F]">│</span>
                          <span className="text-[#59625F]">└── SHARED HOST</span>
                          <span className="text-[#00D2FF]">{result.dns.ipv4[0]}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-[13px] text-[#8B949E]">
                      No confirmed campaign correlation detected in active clusters.
                    </div>
                    {result.dns?.resolved && result.dns.ipv4 && result.dns.ipv4.length > 0 && (
                      <div className="space-y-3 font-mono text-[12px] p-4 bg-[#06080C] rounded border border-[#1E2638]">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] rounded font-semibold">
                            RESOLVED HOST
                          </span>
                          <span className="text-[#59625F]">────────</span>
                          <span className="text-[#F0F6FC]">{result.targetInput}</span>
                        </div>
                        <div className="flex items-center gap-3 pl-8">
                          <span className="text-[#59625F]">└── IP ADDRESS</span>
                          <span className="text-[#8B949E]">{result.dns.ipv4.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION: RECOMMENDED ACTION (DECIDE & ACT) ── */}
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#00D2FF] font-bold">
                    ACTIONABLE MITIGATION
                  </span>
                  <h3 className="text-[20px] font-bold text-[#F0F6FC]">
                    Immediate Defense Protocols
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#59625F]">
                  Response Guidance
                </span>
              </div>

              {/* Numbered protocols */}
              <div className="cyber-card divide-y divide-[#1E2638]">
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
                    <div key={index} className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline hover:bg-[#121826]/30 transition-colors">
                      <div className="md:col-span-1 font-mono text-[12px] text-[#00D2FF] font-bold">
                        {num}
                      </div>
                      <div className="md:col-span-4 text-[14px] text-[#F0F6FC] font-semibold">
                        {index === 0 ? 'Authentication Protocol' : index === 1 ? 'Transaction Protocol' : 'Mitigation Protocol'}
                      </div>
                      <div className="md:col-span-7 text-[13px] text-[#8B949E] leading-relaxed">
                        {step}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Direct Next Step Action Bar */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCreateIncident}
                  disabled={incidentCreated}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#00D2FF] to-[#00F5A0] text-[#06080C] font-mono font-bold text-[12px] tracking-wider rounded hover:opacity-95 shadow-[0_0_16px_rgba(0,210,255,0.25)] transition-all cursor-pointer disabled:opacity-40"
                >
                  {incidentCreated ? 'INCIDENT LOGGED ✓' : 'LOG INCIDENT TO QUEUE →'}
                </button>

                <button
                  type="button"
                  onClick={() => setAdvisoryModalOpen(true)}
                  className="px-5 py-2.5 bg-[#0E131F] border border-[#1E2638] text-[#F0F6FC] hover:border-[#00D2FF]/40 text-[12px] font-mono tracking-wider rounded transition-all cursor-pointer"
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
          <div className="fixed inset-0 z-50 bg-[#06080C]/85 backdrop-blur-[6px] flex items-center justify-center p-4">
            <div className="bg-[#0A0D14] border border-[#00D2FF]/30 rounded-lg max-w-xl w-full p-6 space-y-5 shadow-[0_0_40px_rgba(0,210,255,0.15)]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#00D2FF] font-bold tracking-widest">
                    PUBLIC DEFENSE NOTICE
                  </span>
                  <h3 className="text-[17px] font-bold text-[#F0F6FC]">
                    Customer Safety Advisory
                  </h3>
                </div>
                <button
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="text-[#59625F] hover:text-[#F0F6FC] p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[#59625F] uppercase font-semibold">Language:</span>
                {(['en', 'hi', 'ta'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setAdvisoryLang(lang)}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      advisoryLang === lang
                        ? 'bg-[#00D2FF] text-[#06080C] font-bold'
                        : 'bg-[#121826] text-[#8B949E] hover:text-[#F0F6FC] border border-[#1E2638]'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'தமிழ் (Tamil)'}
                  </button>
                ))}
              </div>

              {/* Advisory Text Box */}
              <div className="bg-[#06080C] border border-[#1E2638] rounded p-4 font-mono text-[12px] text-[#F0F6FC] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {advisories.social.content}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="px-4 py-2 text-[12px] font-mono text-[#8B949E] hover:text-[#F0F6FC] cursor-pointer"
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00D2FF] to-[#00F5A0] text-[#06080C] text-[12px] font-mono font-bold tracking-wider rounded hover:opacity-95 shadow-[0_0_12px_rgba(0,210,255,0.25)] transition-all cursor-pointer"
                >
                  {copiedAdvisory ? <Check className="h-3.5 w-3.5 text-[#06080C]" /> : <Copy className="h-3.5 w-3.5" />}
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
