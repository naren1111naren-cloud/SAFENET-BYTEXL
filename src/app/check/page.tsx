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
        <span className="font-mono text-[40px] font-semibold text-[#FFFFFF] leading-none tracking-tight tabular-nums">
          {score}
        </span>
        <span className="font-mono text-[16px] font-bold text-[#9CA3AF] mt-1">/ {maxScore}</span>
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
      <div className="max-w-6xl mx-auto space-y-16 pb-16">
        {/* ========================================================================= */}
        {/* 1. INVESTIGATION INPUT INSTRUMENT                                         */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-2">
          <div className="space-y-2 border-b border-[#1E2638] pb-5">
            <span className="font-mono text-[15px] uppercase tracking-wider text-[#F6821F] font-semibold">
              CHECK RISK
            </span>
            <h1 className="text-[34px] sm:text-[44px] font-semibold tracking-tight text-[#FFFFFF]">
              What are you checking?
            </h1>
            <p className="text-[20px] text-[#9CA3AF] max-w-3xl leading-relaxed font-bold">
              Paste a URL, domain, message, account or application to investigate its risk signals across brand baseline and live telemetry.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-6 sm:gap-8 border-b border-[#1E2638] pb-3 text-[17px] font-mono overflow-x-auto">
            <button
              type="button"
              onClick={() => loadDemoPreset('url')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
                checkType === 'url'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-[#9CA3AF] hover:text-[#FFFFFF] font-bold'
              }`}
            >
              <Globe className={`h-4 w-4 ${checkType === 'url' ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
              URL / DOMAIN
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('message')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
                checkType === 'message'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-[#9CA3AF] hover:text-[#FFFFFF] font-bold'
              }`}
            >
              <MessageSquare className={`h-4 w-4 ${checkType === 'message' ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
              MESSAGE / EMAIL
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('social')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
                checkType === 'social'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-[#9CA3AF] hover:text-[#FFFFFF] font-bold'
              }`}
            >
              <AtSign className={`h-4 w-4 ${checkType === 'social' ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
              SOCIAL ACCOUNT
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('app')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
                checkType === 'app'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-[#9CA3AF] hover:text-[#FFFFFF] font-bold'
              }`}
            >
              <Smartphone className={`h-4 w-4 ${checkType === 'app' ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
              APP / APK
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('lookalike')}
              className={`pb-3 transition-all cursor-pointer flex items-center gap-2.5 whitespace-nowrap ${
                checkType === 'lookalike'
                  ? 'text-[#F6821F] border-b-2 border-[#F6821F] font-semibold'
                  : 'text-[#9CA3AF] hover:text-[#FFFFFF] font-bold'
              }`}
            >
              <Sparkles className={`h-4 w-4 ${checkType === 'lookalike' ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
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
                    className="w-full bg-[#111625] border border-[#1E2638] rounded-xl px-5 py-4 text-[19px] text-[#FFFFFF] placeholder-[#8F9CAE] focus:border-[#F6821F] focus:ring-1 focus:ring-[#F6821F] outline-none font-mono font-bold resize-none transition-all shadow-inner"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pt-1">
                  {/* Presets in clean pills */}
                  <div className="flex flex-wrap items-center gap-2.5 text-[15px] font-mono text-[#9CA3AF]">
                    <span className="font-semibold text-[#FFFFFF]">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('url');
                        setInputValue('http://paytm-support-verify.xyz');
                      }}
                      className="px-3 py-1 bg-[#111625] hover:bg-[#161D2F] text-[#9CA3AF] hover:text-[#FFFFFF] border border-[#1E2638] rounded-lg transition-colors font-bold"
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
                      className="px-3 py-1 bg-[#111625] hover:bg-[#161D2F] text-[#9CA3AF] hover:text-[#FFFFFF] border border-[#1E2638] rounded-lg transition-colors font-bold"
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
                      className="px-3 py-1 bg-[#111625] hover:bg-[#161D2F] text-[#9CA3AF] hover:text-[#FFFFFF] border border-[#1E2638] rounded-lg transition-colors font-bold"
                    >
                      com.paytm.cashback.reward.apk
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={analyzing || !inputValue.trim()}
                    className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11] text-[19px] font-semibold tracking-tight rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-40 shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Investigating...</span>
                      </>
                    ) : (
                      <>
                        <span>Check Risk</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sequential Telemetry Progression (During scan) */}
              {analyzing && (
                <div className="pt-4 border-t border-[#1E2638] space-y-3">
                  <div className="flex items-center gap-3 font-mono text-[16px] text-[#9CA3AF] font-bold">
                    <span className="h-2 w-2 rounded-full bg-[#F6821F] animate-pulse" />
                    <span>EVALUATING ARTIFACT TELEMETRY:</span>
                    <span className="text-[#FFFFFF] font-semibold">{inputValue.slice(0, 45)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[15px] font-bold">
                    {scanningStages.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2.5 transition-opacity ${
                          idx <= analysisStep ? 'text-[#FFFFFF]' : 'text-[#8F9CAE]'
                        }`}
                      >
                        <span className={idx <= analysisStep ? 'text-[#F6821F]' : 'text-[#8F9CAE]'}>
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
        {/* ERROR STATE                                                               */}
        {/* ========================================================================= */}
        {errorMessage && !analyzing && (
          <div className="space-y-4 border border-[#FF5C6C]/40 bg-[#2D1216] p-8 rounded-2xl text-center my-8">
            <span className="font-mono text-[15px] uppercase tracking-wider text-[#FF5C6C] font-semibold">
              Analysis unavailable
            </span>
            <h3 className="text-[22px] text-[#FFFFFF] font-semibold">
              {errorMessage}
            </h3>
            <p className="text-[18px] text-[#9CA3AF] max-w-lg mx-auto leading-relaxed font-bold">
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
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-7 sm:p-9 shadow-2xl flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div className="space-y-5 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[15px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    RISK ASSESSMENT
                  </span>
                  <span className="text-[#1E2638]">/</span>
                  <span
                    className={`inline-flex items-center px-3.5 py-1 rounded-lg text-[15px] font-mono font-semibold uppercase border ${
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
                  <span className="text-[14px] font-mono text-[#9CA3AF] uppercase tracking-wider bg-[#111625] border border-[#1E2638] px-2.5 py-1 rounded-md font-bold">
                    {result.isLLMPowered ? 'AI + HEURISTIC' : 'DETERMINISTIC HEURISTIC'}
                  </span>
                </div>

                <h2 className="text-[28px] sm:text-[38px] font-mono text-[#FFFFFF] font-semibold break-all leading-tight">
                  {result.targetInput}
                </h2>

                <p className="text-[20px] text-[#9CA3AF] leading-relaxed max-w-3xl font-bold">
                  {result.summaryPhrase || (
                    result.riskScore >= 70
                      ? `SAFENET detected high-risk indicators targeting ${result.brand?.name || 'protected assets'}.`
                      : result.riskScore >= 40
                      ? `SAFENET detected moderate risk indicators requiring verification.`
                      : `No significant threat indicators detected for ${result.targetInput}.`
                  )}
                </p>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-3.5 pt-3">
                  <button
                    type="button"
                    onClick={handleCreateIncident}
                    disabled={incidentCreated}
                    className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-[18px] font-semibold cursor-pointer transition-all shadow-md ${
                      incidentCreated
                        ? 'bg-[#0F2620] text-[#F6821F] border border-[#F6821F]/50'
                        : result.riskScore >= 50
                        ? 'bg-[#FF5C6C] text-[#080B11] hover:bg-[#E04857]'
                        : 'bg-[#F6821F] text-[#080B11] hover:bg-[#2EB8A5]'
                    }`}
                  >
                    <AlertOctagon className="h-5 w-5" />
                    {incidentCreated ? '✓ Incident Logged' : 'Create Incident'}
                  </button>

                  <Link
                    href="/campaigns"
                    className="inline-flex items-center gap-2.5 px-5 py-3 border border-[#1E2638] bg-[#111625] text-[#FFFFFF] text-[18px] font-bold hover:bg-[#161D2F] rounded-xl shadow-md transition-colors"
                  >
                    <GitBranch className="h-5 w-5 text-[#64A9FF]" />
                    Investigate Campaign
                  </Link>

                  <button
                    type="button"
                    onClick={() => setAdvisoryModalOpen(true)}
                    className="inline-flex items-center gap-2.5 px-5 py-3 border border-[#1E2638] bg-[#111625] text-[#FFFFFF] text-[18px] font-bold hover:bg-[#161D2F] rounded-xl shadow-md transition-colors cursor-pointer"
                  >
                    <FileText className="h-5 w-5 text-[#F6821F]" />
                    Customer Advisory
                  </button>

                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="inline-flex items-center gap-2 px-4 py-3 text-[#9CA3AF] hover:text-[#FFFFFF] text-[17px] font-bold rounded-xl hover:bg-[#111625] transition-colors cursor-pointer"
                  >
                    <Share2 className="h-5 w-5" />
                    {copiedShare ? 'Copied Link' : 'Share'}
                  </button>
                </div>

                {incidentCreated && (
                  <div className="pt-2 flex items-center gap-2.5 text-[17px] font-bold text-[#F6821F]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F6821F]" />
                    <span>Incident successfully queued in response center.</span>
                    <Link href="/incidents" className="text-[#F6821F] hover:underline font-semibold ml-1">
                      View in queue →
                    </Link>
                  </div>
                )}
              </div>

              {/* Arc Gauge */}
              <div className="flex flex-col items-center justify-center shrink-0 border border-[#1E2638] p-7 rounded-2xl bg-[#111625] min-w-[220px] shadow-lg">
                <span className="text-[14px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
                  THREAT SCORE
                </span>
                <RiskArcGauge score={result.riskScore ?? 0} />
                <span className="text-[16px] font-bold text-[#FFFFFF] mt-3 font-sans">
                  {typeof result.confidence === 'number' ? `Confidence: ${result.confidence}%` : 'Confidence unavailable'}
                </span>
              </div>
            </div>

            {/* ── SECTION: WHY WE FLAGGED IT / DECISION SIGNALS ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
                <div className="space-y-1">
                  <span className="font-mono text-[14px] uppercase tracking-wider text-[#F6821F] font-semibold">
                    DECISION SIGNALS
                  </span>
                  <h3 className="text-[26px] font-semibold text-[#FFFFFF]">
                    Why SAFENET reached this assessment
                  </h3>
                </div>
                <span className="font-mono text-[16px] text-[#9CA3AF] font-bold">
                  {result.contributions?.length || result.reasons?.length || 0} evaluated signal{(result.contributions?.length || result.reasons?.length || 0) === 1 ? '' : 's'}
                </span>
              </div>

              <div className="divide-y divide-[#1E2638]">
                {result.contributions && result.contributions.length > 0 ? (
                  result.contributions.map((contrib: any, index: number) => {
                    const num = String(index + 1).padStart(2, '0');
                    return (
                      <div key={index} className="py-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
                        <div className="md:col-span-1 font-mono text-[16px] text-[#9CA3AF] font-bold">
                          {num}
                        </div>
                        <div className="md:col-span-4">
                          <div className="text-[19px] text-[#FFFFFF] font-semibold">
                            {contrib.vector}
                          </div>
                          <div className="text-[15px] text-[#F6821F] mt-0.5 font-mono font-bold">
                            Contribution: +{contrib.points} pts
                          </div>
                        </div>
                        <div className="md:col-span-5 text-[18px] text-[#9CA3AF] leading-relaxed font-bold">
                          {contrib.reason}
                        </div>
                        <div className={`md:col-span-2 md:text-right font-mono text-[15px] font-semibold ${
                          contrib.points >= 30 ? 'text-[#FF5C6C]' : contrib.points >= 15 ? 'text-[#FFAB40]' : 'text-[#F6821F]'
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
                      <div key={index} className="py-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
                        <div className="md:col-span-1 font-mono text-[16px] text-[#9CA3AF] font-bold">{num}</div>
                        <div className="md:col-span-4 text-[19px] text-[#FFFFFF] font-semibold">Evaluation Finding {num}</div>
                        <div className="md:col-span-5 text-[18px] text-[#9CA3AF] leading-relaxed font-bold">{reason}</div>
                        <div className="md:col-span-2 md:text-right font-mono text-[15px] text-[#F6821F] font-semibold">VERIFIED</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center font-mono text-[17px] text-[#9CA3AF] font-bold">
                    No significant risk indicators were detected.
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION: AI THREAT REASONING ── */}
            {result.aiAnalysis && (
              <section className="space-y-4 border border-[#1E2638] bg-[#0E131F] p-7 rounded-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-[#1E2638]">
                  <span className="font-mono text-[14px] uppercase tracking-wider text-[#F6821F] font-semibold">
                    NEURAL THREAT REASONING
                  </span>
                  <span className="font-mono text-[14px] text-[#9CA3AF] font-bold">EVIDENCE-GROUNDED INFERENCE</span>
                </div>
                <h4 className="text-[22px] text-[#FFFFFF] font-semibold leading-snug">
                  {result.aiAnalysis.threatAssessment}
                </h4>
                <p className="text-[19px] text-[#9CA3AF] leading-relaxed font-bold">
                  {result.aiAnalysis.keyFindingsExplanation}
                </p>
                {result.aiAnalysis.contradictoryOrMissingEvidence?.length > 0 && (
                  <div className="pt-2 font-mono text-[15px] text-[#9CA3AF] font-bold">
                    Evidence gaps: {result.aiAnalysis.contradictoryOrMissingEvidence.join(' • ')}
                  </div>
                )}
              </section>
            )}

            {/* ── SECTION: TECHNICAL EVIDENCE ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
                <div className="space-y-1">
                  <span className="font-mono text-[14px] uppercase tracking-wider text-[#F6821F] font-semibold">
                    TECHNICAL EVIDENCE
                  </span>
                  <h3 className="text-[26px] font-semibold text-[#FFFFFF]">
                    Multi-source network intelligence
                  </h3>
                </div>
                <span className="font-mono text-[15px] text-[#9CA3AF] font-bold">
                  Authoritative Lookups
                </span>
              </div>

              <div className="font-mono text-[17px] divide-y divide-[#1E2638]">
                {/* 1. Identity & Asset */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[#9CA3AF] font-bold">Target Asset</span>
                  <span className="text-[#FFFFFF] font-semibold">{result.normalizedTarget || result.targetInput}</span>
                </div>

                {/* 2. DNS Resolution */}
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[#9CA3AF] font-bold">DNS Status</span>
                  <span className={result.dns ? (result.dns.isResolved || result.dns.resolved ? 'text-[#F6821F] font-semibold' : 'text-[#FFAB40] font-semibold') : 'text-[#9CA3AF]'}>
                    {result.dns ? ((result.dns.isResolved || result.dns.resolved) ? 'Resolved (A/AAAA Active)' : `No resolution (${result.dns.overallStatus || 'NXDOMAIN'})`) : 'Not applicable'}
                  </span>
                </div>

                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[#9CA3AF] font-bold">Resolved IPv4</span>
                  <span className="text-[#FFFFFF] font-bold">
                    {result.dns?.ipv4 && result.dns.ipv4.length > 0 ? result.dns.ipv4.join(', ') : 'None'}
                  </span>
                </div>

                {result.dns?.mx && result.dns.mx.length > 0 && (
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[#9CA3AF] font-bold">Mail Exchangers (MX)</span>
                    <span className="text-[#FFFFFF] font-bold">{result.dns.mx.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {result.dns?.ns && result.dns.ns.length > 0 && (
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[#9CA3AF] font-bold">Nameservers (NS)</span>
                    <span className="text-[#FFFFFF] font-bold">{result.dns.ns.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {/* 3. RDAP Registration */}
                {result.rdap && (
                  <>
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[#9CA3AF] font-bold">Domain Registrar</span>
                      <span className={result.rdap.registrarName ? 'text-[#FFFFFF] font-semibold' : 'text-[#9CA3AF]'}>
                        {result.rdap.registrarName ? `${result.rdap.registrarName}${result.rdap.registrarIanaId ? ` (IANA: ${result.rdap.registrarIanaId})` : ''}` : (result.rdap.status === 'unavailable' ? 'Unavailable via RDAP' : 'Not available')}
                      </span>
                    </div>

                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[#9CA3AF] font-bold">Domain Age & Creation</span>
                      <span className={result.rdap.registrationDateUtc ? 'text-[#FFFFFF] font-semibold' : 'text-[#9CA3AF]'}>
                        {result.rdap.registrationDateUtc ? `${result.rdap.domainAgeFormatted || 'Verified'} (Created: ${result.rdap.registrationDateUtc.split('T')[0]})` : 'Unavailable / Not returned by registry'}
                      </span>
                    </div>
                  </>
                )}

                {/* 4. TLS Certificate */}
                {result.tls && result.tls.status !== 'no_tls' && (
                  <>
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[#9CA3AF] font-bold">TLS Certificate Status</span>
                      <span className={result.tls.status === 'valid' ? 'text-[#F6821F] font-semibold' : 'text-[#FF5C6C] font-semibold'}>
                        {result.tls.status === 'valid' ? `Valid (${result.tls.daysRemaining} days remaining)` : `Anomaly: ${result.tls.status} (${result.tls.error || 'Verification error'})`}
                      </span>
                    </div>

                    {result.tls.issuer?.commonName && (
                      <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-[#9CA3AF] font-bold">Certificate Authority</span>
                        <span className="text-[#FFFFFF] font-bold">{result.tls.issuer.commonName}</span>
                      </div>
                    )}
                  </>
                )}

                {/* 5. HTTP & Transport */}
                {result.http && (
                  <>
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[#9CA3AF] font-bold">HTTP Endpoint Status</span>
                      <span className={result.http.isAccessible ? 'text-[#F6821F] font-semibold' : 'text-[#FFAB40] font-semibold'}>
                        {result.http.isAccessible ? `HTTP ${result.http.statusCode} (${result.http.durationMs}ms latency)` : `Unreachable (${result.http.error || 'Connection failed'})`}
                      </span>
                    </div>

                    {result.http.redirectCount > 0 && (
                      <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-[#9CA3AF] font-bold">Redirect Chain</span>
                        <span className="text-[#FFAB40] truncate max-w-md font-bold">
                          {result.http.redirectCount} hop(s) &rarr; {result.http.finalUrl}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* 6. Threat Feeds */}
                {result.threatFeeds && result.threatFeeds.findings?.length > 0 && (
                  <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-[#9CA3AF] font-bold">Threat Feed Detections</span>
                    <span className={result.threatFeeds.detectionsCount > 0 ? 'text-[#FF5C6C] font-semibold' : 'text-[#F6821F] font-semibold'}>
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
                  <span className="font-mono text-[14px] uppercase tracking-wider text-[#F6821F] font-semibold">
                    ACTIONABLE MITIGATION
                  </span>
                  <h3 className="text-[26px] font-semibold text-[#FFFFFF]">
                    Recommended action
                  </h3>
                </div>
                <span className="font-mono text-[15px] text-[#9CA3AF] font-bold">
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
                    <div key={index} className="py-4.5 grid grid-cols-1 md:grid-cols-12 gap-5 items-baseline">
                      <div className="md:col-span-1 font-mono text-[16px] text-[#9CA3AF] font-bold">
                        {num}
                      </div>
                      <div className="md:col-span-4 text-[19px] text-[#FFFFFF] font-semibold">
                        {index === 0 ? 'Authentication Protocol' : index === 1 ? 'Transaction Protocol' : 'Mitigation Protocol'}
                      </div>
                      <div className="md:col-span-7 text-[18px] text-[#9CA3AF] leading-relaxed font-bold">
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
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl max-w-2xl w-full p-7 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#1E2638]">
                <div>
                  <span className="font-mono text-[13px] uppercase text-[#F6821F] font-semibold">
                    PUBLIC NOTICE
                  </span>
                  <h3 className="text-[22px] font-semibold text-[#FFFFFF]">
                    Customer Safety Advisory
                  </h3>
                </div>
                <button
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="text-[#9CA3AF] hover:text-[#FFFFFF] p-1.5 cursor-pointer rounded-lg hover:bg-[#111625]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-3 font-mono text-[15px]">
                <span className="text-[#9CA3AF] font-bold">Language:</span>
                {(['en', 'hi', 'ta'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setAdvisoryLang(lang)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer font-bold ${
                      advisoryLang === lang
                        ? 'bg-[#111625] text-[#F6821F] border border-[#F6821F]'
                        : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'தமிழ் (Tamil)'}
                  </button>
                ))}
              </div>

              {/* Advisory Text Box */}
              <div className="bg-[#111625] border border-[#1E2638] p-5 font-mono text-[16px] text-[#FFFFFF] font-bold leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto rounded-xl">
                {advisories.social.content}
              </div>

              <div className="flex items-center justify-end gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="px-5 py-2.5 text-[17px] font-bold text-[#9CA3AF] hover:text-[#FFFFFF] cursor-pointer"
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F6821F] text-[#080B11] text-[17px] font-semibold rounded-xl hover:bg-[#2EB8A5] transition-all cursor-pointer shadow-md"
                >
                  {copiedAdvisory ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
    <Suspense fallback={<div className="p-12 text-center text-[#9CA3AF] font-mono text-[18px] font-bold">Loading investigation instrument...</div>}>
      <CheckRiskContent />
    </Suspense>
  );
}
