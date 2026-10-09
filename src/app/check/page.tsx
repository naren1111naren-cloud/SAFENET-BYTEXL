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

  const color = score >= 70 ? '#C93643' : score >= 40 ? '#B7791F' : '#347653';

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-[135deg]">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ECEFEC"
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
        <span className="font-mono text-[32px] font-bold text-[#202723] leading-none tracking-tight tabular-nums">
          {score}
        </span>
        <span className="font-mono text-[11px] text-[#858D86] mt-1">/ {maxScore}</span>
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
        {/* 1. INVESTIGATION INPUT INSTRUMENT                                         */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-2">
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
              CHECK RISK
            </span>
            <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-[#202723]">
              What are you checking?
            </h1>
            <p className="text-[14px] text-[#626B65] max-w-2xl leading-relaxed">
              Paste a URL, domain, message, account or application to investigate its risk signals across brand baseline and live telemetry.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center gap-6 border-b border-[#DDE2DC] pb-2 text-[12px] font-mono">
            <button
              type="button"
              onClick={() => loadDemoPreset('url')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center gap-2 ${
                checkType === 'url'
                  ? 'text-[#477A60] border-b-2 border-[#477A60] font-bold'
                  : 'text-[#626B65] hover:text-[#202723] font-medium'
              }`}
            >
              <Globe className={`h-3.5 w-3.5 ${checkType === 'url' ? 'text-[#477A60]' : 'text-[#858D86]'}`} />
              URL / DOMAIN
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('message')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center gap-2 ${
                checkType === 'message'
                  ? 'text-[#477A60] border-b-2 border-[#477A60] font-bold'
                  : 'text-[#626B65] hover:text-[#202723] font-medium'
              }`}
            >
              <MessageSquare className={`h-3.5 w-3.5 ${checkType === 'message' ? 'text-[#477A60]' : 'text-[#858D86]'}`} />
              MESSAGE / EMAIL
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('social')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center gap-2 ${
                checkType === 'social'
                  ? 'text-[#477A60] border-b-2 border-[#477A60] font-bold'
                  : 'text-[#626B65] hover:text-[#202723] font-medium'
              }`}
            >
              <AtSign className={`h-3.5 w-3.5 ${checkType === 'social' ? 'text-[#477A60]' : 'text-[#858D86]'}`} />
              SOCIAL ACCOUNT
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('app')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center gap-2 ${
                checkType === 'app'
                  ? 'text-[#477A60] border-b-2 border-[#477A60] font-bold'
                  : 'text-[#626B65] hover:text-[#202723] font-medium'
              }`}
            >
              <Smartphone className={`h-3.5 w-3.5 ${checkType === 'app' ? 'text-[#477A60]' : 'text-[#858D86]'}`} />
              APP / APK
            </button>
            <button
              type="button"
              onClick={() => loadDemoPreset('lookalike')}
              className={`pb-2.5 transition-all cursor-pointer flex items-center gap-2 ${
                checkType === 'lookalike'
                  ? 'text-[#477A60] border-b-2 border-[#477A60] font-bold'
                  : 'text-[#626B65] hover:text-[#202723] font-medium'
              }`}
            >
              <Sparkles className={`h-3.5 w-3.5 ${checkType === 'lookalike' ? 'text-[#477A60]' : 'text-[#858D86]'}`} />
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
                className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4"
              >
                <div className="relative">
                  <textarea
                    rows={checkType === 'message' ? 3 : 2}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste a suspicious URL, message, account handle, or package name..."
                    className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl px-4 py-3.5 text-[14px] text-[#202723] placeholder-[#858D86] focus:bg-[#FFFFFF] focus:border-[#477A60] focus:ring-1 focus:ring-[#477A60] outline-none font-mono resize-none transition-all shadow-xs"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  {/* Presets in clean pills */}
                  <div className="flex items-center gap-2 text-[12px] font-mono text-[#858D86] overflow-x-auto">
                    <span className="font-semibold text-[#626B65]">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckType('url');
                        setInputValue('http://paytm-support-verify.xyz');
                      }}
                      className="px-2 py-0.5 bg-[#ECEFEC] hover:bg-[#DDE2DC] text-[#626B65] hover:text-[#202723] rounded transition-colors"
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
                      className="px-2 py-0.5 bg-[#ECEFEC] hover:bg-[#DDE2DC] text-[#626B65] hover:text-[#202723] rounded transition-colors"
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
                      className="px-2 py-0.5 bg-[#ECEFEC] hover:bg-[#DDE2DC] text-[#626B65] hover:text-[#202723] rounded transition-colors"
                    >
                      com.paytm.cashback.reward.apk
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={analyzing || !inputValue.trim()}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#477A60] hover:bg-[#365F49] text-white text-[13px] font-bold tracking-tight rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 shrink-0"
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
                <div className="pt-4 border-t border-[#DDE2DC] space-y-3">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#626B65]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#477A60] animate-pulse" />
                    <span>EVALUATING ARTIFACT TELEMETRY:</span>
                    <span className="text-[#202723] font-semibold">{inputValue.slice(0, 45)}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                    {scanningStages.map((stage, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 transition-opacity ${
                          idx <= analysisStep ? 'text-[#202723]' : 'text-[#858D86]'
                        }`}
                      >
                        <span className={idx <= analysisStep ? 'text-[#477A60]' : 'text-[#858D86]'}>
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
          <div className="space-y-4 border border-[#F8D3D6] bg-[#FDF2F3] p-8 rounded-xl text-center my-8">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#C93643] font-bold">
              Analysis unavailable
            </span>
            <h3 className="text-[18px] text-[#202723] font-bold">
              {errorMessage}
            </h3>
            <p className="text-[13px] text-[#626B65] max-w-lg mx-auto leading-relaxed">
              SAFENET could not complete this check. Please verify the target input, network status, or try again.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. RISK RESULT EXPERIENCE                                                 */}
        {/* ========================================================================= */}
        {result && !analyzing && checkType !== 'lookalike' && (
          <div className="space-y-12 border-t border-[#DDE2DC] pt-10">
            {/* ── TOP RESULT HERO: SCORE + VERDICT ── */}
            <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div className="space-y-4 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#858D86]">
                    RISK ASSESSMENT
                  </span>
                  <span className="text-[#DDE2DC]">/</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold uppercase border ${
                      result.riskScore >= 70
                        ? 'bg-[#FDF2F3] text-[#C93643] border-[#F8D3D6]'
                        : result.riskScore >= 40
                        ? 'bg-[#FEF9F0] text-[#B7791F] border-[#FBE8CA]'
                        : 'bg-[#EFF7F2] text-[#347653] border-[#CBE4D4]'
                    }`}
                  >
                    {result.riskLevel || (result.riskScore >= 70 ? 'HIGH RISK' : result.riskScore >= 40 ? 'MEDIUM RISK' : 'SAFE / LOW RISK')}
                  </span>
                  <span className="text-[#DDE2DC]">/</span>
                  <span className="text-[11px] font-mono text-[#626B65] uppercase tracking-wider bg-[#ECEFEC] px-2 py-0.5 rounded">
                    {result.isLLMPowered ? 'AI + HEURISTIC' : 'DETERMINISTIC HEURISTIC'}
                  </span>
                </div>

                <h2 className="text-[24px] sm:text-[30px] font-mono text-[#202723] font-bold break-all leading-tight">
                  {result.targetInput}
                </h2>

                <p className="text-[15px] text-[#626B65] leading-relaxed max-w-2xl">
                  {result.summaryPhrase || (
                    result.riskScore >= 70
                      ? `SAFENET detected high-risk indicators targeting ${result.brand?.name || 'protected assets'}.`
                      : result.riskScore >= 40
                      ? `SAFENET detected moderate risk indicators requiring verification.`
                      : `No significant threat indicators detected for ${result.targetInput}.`
                  )}
                </p>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleCreateIncident}
                    disabled={incidentCreated}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-all shadow-xs ${
                      incidentCreated
                        ? 'bg-[#EFF7F2] text-[#347653] border border-[#CBE4D4]'
                        : result.riskScore >= 50
                        ? 'bg-[#C93643] text-white hover:bg-[#b52f3b]'
                        : 'bg-[#477A60] text-white hover:bg-[#365F49]'
                    }`}
                  >
                    <AlertOctagon className="h-4 w-4" />
                    {incidentCreated ? '✓ Incident Logged' : 'Create Incident'}
                  </button>

                  <Link
                    href="/campaigns"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#DDE2DC] bg-[#FFFFFF] text-[#202723] text-[13px] font-medium hover:bg-[#F7F8F6] rounded-lg shadow-xs transition-colors"
                  >
                    <GitBranch className="h-4 w-4 text-[#858D86]" />
                    Investigate Campaign
                  </Link>

                  <button
                    type="button"
                    onClick={() => setAdvisoryModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#DDE2DC] bg-[#FFFFFF] text-[#202723] text-[13px] font-medium hover:bg-[#F7F8F6] rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-[#858D86]" />
                    Customer Advisory
                  </button>

                  <button
                    type="button"
                    onClick={handleShareResult}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 text-[#626B65] hover:text-[#202723] text-[13px] font-medium rounded-lg hover:bg-[#ECEFEC] transition-colors cursor-pointer"
                  >
                    <Share2 className="h-4 w-4" />
                    {copiedShare ? 'Copied Link' : 'Share'}
                  </button>
                </div>

                {incidentCreated && (
                  <div className="pt-2 flex items-center gap-2 text-[13px] font-medium text-[#347653]">
                    <span className="h-2 w-2 rounded-full bg-[#347653]" />
                    <span>Incident successfully queued in response center.</span>
                    <Link href="/incidents" className="text-[#477A60] hover:underline font-semibold ml-1">
                      View in queue →
                    </Link>
                  </div>
                )}
              </div>

              {/* Arc Gauge */}
              <div className="flex flex-col items-center justify-center shrink-0 border border-[#DDE2DC] p-6 rounded-xl bg-[#F7F8F6] min-w-[200px] shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#858D86] mb-3">
                  THREAT SCORE
                </span>
                <RiskArcGauge score={result.riskScore ?? 0} />
                <span className="text-[12px] font-medium text-[#626B65] mt-3 font-sans">
                  {typeof result.confidence === 'number' ? `Confidence: ${result.confidence}%` : 'Confidence unavailable'}
                </span>
              </div>
            </div>

            {/* ── SECTION: WHY WE FLAGGED IT / DECISION SIGNALS ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86]">
                    DECISION SIGNALS
                  </span>
                  <h3 className="text-[20px] font-bold text-[#202723]">
                    Why SAFENET reached this assessment
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#858D86]">
                  {result.contributions?.length || result.reasons?.length || 0} evaluated signal{(result.contributions?.length || result.reasons?.length || 0) === 1 ? '' : 's'}
                </span>
              </div>

              <div className="divide-y divide-[#DDE2DC]">
                {result.contributions && result.contributions.length > 0 ? (
                  result.contributions.map((contrib: any, index: number) => {
                    const num = String(index + 1).padStart(2, '0');
                    return (
                      <div key={index} className="py-4.5 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
                        <div className="md:col-span-1 font-mono text-[12px] text-[#858D86]">
                          {num}
                        </div>
                        <div className="md:col-span-4">
                          <div className="text-[14px] text-[#202723] font-semibold">
                            {contrib.vector}
                          </div>
                          <div className="text-[12px] text-[#626B65] mt-0.5 font-mono">
                            Contribution: +{contrib.points} pts
                          </div>
                        </div>
                        <div className="md:col-span-5 text-[13px] text-[#626B65] leading-relaxed">
                          {contrib.reason}
                        </div>
                        <div className={`md:col-span-2 md:text-right font-mono text-[11px] font-bold ${
                          contrib.points >= 30 ? 'text-[#C93643]' : contrib.points >= 15 ? 'text-[#B7791F]' : 'text-[#347653]'
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
                        <div className="md:col-span-1 font-mono text-[12px] text-[#858D86]">{num}</div>
                        <div className="md:col-span-4 text-[14px] text-[#202723] font-semibold">Evaluation Finding {num}</div>
                        <div className="md:col-span-5 text-[13px] text-[#626B65] leading-relaxed">{reason}</div>
                        <div className="md:col-span-2 md:text-right font-mono text-[11px] text-[#347653] font-bold">VERIFIED</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center font-mono text-[13px] text-[#858D86]">
                    No significant risk indicators were detected.
                  </div>
                )}
              </div>
            </section>

            {/* ── SECTION: AI THREAT REASONING ── */}
            {result.aiAnalysis && (
              <section className="space-y-4 border border-[#D1E3D5] bg-[#EFF7F2] p-6 rounded-xl">
                <div className="flex items-center justify-between pb-2 border-b border-[#D1E3D5]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#477A60] font-bold">
                    NEURAL THREAT REASONING
                  </span>
                  <span className="font-mono text-[10px] text-[#858D86]">EVIDENCE-GROUNDED INFERENCE</span>
                </div>
                <h4 className="text-[16px] text-[#202723] font-bold leading-snug">
                  {result.aiAnalysis.threatAssessment}
                </h4>
                <p className="text-[13px] text-[#626B65] leading-relaxed">
                  {result.aiAnalysis.keyFindingsExplanation}
                </p>
                {result.aiAnalysis.contradictoryOrMissingEvidence?.length > 0 && (
                  <div className="pt-2 font-mono text-[11px] text-[#858D86]">
                    Evidence gaps: {result.aiAnalysis.contradictoryOrMissingEvidence.join(' • ')}
                  </div>
                )}
              </section>
            )}

            {/* ── SECTION: TECHNICAL EVIDENCE ── */}
            <section className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86]">
                    TECHNICAL EVIDENCE
                  </span>
                  <h3 className="text-[20px] font-bold text-[#202723]">
                    Multi-source network intelligence
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#858D86]">
                  Authoritative Lookups
                </span>
              </div>

              <div className="font-mono text-[12px] divide-y divide-[#DDE2DC]">
                {/* 1. Identity & Asset */}
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#858D86]">Target Asset</span>
                  <span className="text-[#202723] font-semibold">{result.normalizedTarget || result.targetInput}</span>
                </div>

                {/* 2. DNS Resolution */}
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#858D86]">DNS Status</span>
                  <span className={result.dns ? (result.dns.isResolved || result.dns.resolved ? 'text-[#347653] font-bold' : 'text-[#B7791F] font-bold') : 'text-[#858D86]'}>
                    {result.dns ? ((result.dns.isResolved || result.dns.resolved) ? 'Resolved (A/AAAA Active)' : `No resolution (${result.dns.overallStatus || 'NXDOMAIN'})`) : 'Not applicable'}
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[#858D86]">Resolved IPv4</span>
                  <span className="text-[#202723]">
                    {result.dns?.ipv4 && result.dns.ipv4.length > 0 ? result.dns.ipv4.join(', ') : 'None'}
                  </span>
                </div>

                {result.dns?.mx && result.dns.mx.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#858D86]">Mail Exchangers (MX)</span>
                    <span className="text-[#202723]">{result.dns.mx.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {result.dns?.ns && result.dns.ns.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#858D86]">Nameservers (NS)</span>
                    <span className="text-[#202723]">{result.dns.ns.slice(0, 2).join(', ')}</span>
                  </div>
                )}

                {/* 3. RDAP Registration */}
                {result.rdap && (
                  <>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#858D86]">Domain Registrar</span>
                      <span className={result.rdap.registrarName ? 'text-[#202723]' : 'text-[#858D86]'}>
                        {result.rdap.registrarName ? `${result.rdap.registrarName}${result.rdap.registrarIanaId ? ` (IANA: ${result.rdap.registrarIanaId})` : ''}` : (result.rdap.status === 'unavailable' ? 'Unavailable via RDAP' : 'Not available')}
                      </span>
                    </div>

                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#858D86]">Domain Age & Creation</span>
                      <span className={result.rdap.registrationDateUtc ? 'text-[#202723]' : 'text-[#858D86]'}>
                        {result.rdap.registrationDateUtc ? `${result.rdap.domainAgeFormatted || 'Verified'} (Created: ${result.rdap.registrationDateUtc.split('T')[0]})` : 'Unavailable / Not returned by registry'}
                      </span>
                    </div>
                  </>
                )}

                {/* 4. TLS Certificate */}
                {result.tls && result.tls.status !== 'no_tls' && (
                  <>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#858D86]">TLS Certificate Status</span>
                      <span className={result.tls.status === 'valid' ? 'text-[#347653] font-bold' : 'text-[#C93643] font-bold'}>
                        {result.tls.status === 'valid' ? `Valid (${result.tls.daysRemaining} days remaining)` : `Anomaly: ${result.tls.status} (${result.tls.error || 'Verification error'})`}
                      </span>
                    </div>

                    {result.tls.issuer?.commonName && (
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#858D86]">Certificate Authority</span>
                        <span className="text-[#626B65]">{result.tls.issuer.commonName}</span>
                      </div>
                    )}
                  </>
                )}

                {/* 5. HTTP & Transport */}
                {result.http && (
                  <>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[#858D86]">HTTP Endpoint Status</span>
                      <span className={result.http.isAccessible ? 'text-[#347653] font-bold' : 'text-[#B7791F] font-bold'}>
                        {result.http.isAccessible ? `HTTP ${result.http.statusCode} (${result.http.durationMs}ms latency)` : `Unreachable (${result.http.error || 'Connection failed'})`}
                      </span>
                    </div>

                    {result.http.redirectCount > 0 && (
                      <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[#858D86]">Redirect Chain</span>
                        <span className="text-[#B7791F] truncate max-w-md">
                          {result.http.redirectCount} hop(s) &rarr; {result.http.finalUrl}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {/* 6. Threat Feeds */}
                {result.threatFeeds && result.threatFeeds.findings?.length > 0 && (
                  <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[#858D86]">Threat Feed Detections</span>
                    <span className={result.threatFeeds.detectionsCount > 0 ? 'text-[#C93643] font-bold' : 'text-[#347653] font-bold'}>
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
              <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
                <div className="space-y-1">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#858D86]">
                    ACTIONABLE MITIGATION
                  </span>
                  <h3 className="text-[20px] font-bold text-[#202723]">
                    Recommended action
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-[#858D86]">
                  Immediate protocols
                </span>
              </div>

              <div className="divide-y divide-[#DDE2DC]">
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
                      <div className="md:col-span-1 font-mono text-[12px] text-[#858D86]">
                        {num}
                      </div>
                      <div className="md:col-span-4 text-[14px] text-[#202723] font-semibold">
                        {index === 0 ? 'Authentication Protocol' : index === 1 ? 'Transaction Protocol' : 'Mitigation Protocol'}
                      </div>
                      <div className="md:col-span-7 text-[13px] text-[#626B65] leading-relaxed">
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
        {/* CUSTOMER ADVISORY MODAL                                                   */}
        {/* ========================================================================= */}
        {advisoryModalOpen && advisories && (
          <div className="fixed inset-0 z-50 bg-[#202723]/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#DDE2DC]">
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#858D86] font-bold">
                    PUBLIC NOTICE
                  </span>
                  <h3 className="text-[16px] font-bold text-[#202723]">
                    Customer Safety Advisory
                  </h3>
                </div>
                <button
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="text-[#858D86] hover:text-[#202723] p-1 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-[#858D86]">Language:</span>
                {(['en', 'hi', 'ta'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setAdvisoryLang(lang)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      advisoryLang === lang
                        ? 'bg-[#E7F0E9] text-[#477A60] font-semibold'
                        : 'text-[#626B65] hover:text-[#202723]'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'தமிழ் (Tamil)'}
                  </button>
                ))}
              </div>

              {/* Advisory Text Box */}
              <div className="bg-[#F7F8F6] border border-[#DDE2DC] p-4 font-mono text-[12px] text-[#202723] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto rounded-lg">
                {advisories.social.content}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvisoryModalOpen(false)}
                  className="px-4 py-2 text-[13px] font-medium text-[#626B65] hover:text-[#202723] cursor-pointer"
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#477A60] text-white text-[13px] font-semibold rounded-lg hover:bg-[#365F49] transition-all cursor-pointer"
                >
                  {copiedAdvisory ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
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
    <Suspense fallback={<div className="p-12 text-center text-[#858D86] font-mono text-[13px]">Loading investigation instrument...</div>}>
      <CheckRiskContent />
    </Suspense>
  );
}
