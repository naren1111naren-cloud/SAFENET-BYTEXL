'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Info,
  RefreshCw,
  Check,
  Bookmark,
  Share2,
  Tag,
  Layers,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { PRESET_BRANDS, BrandStore } from '@/lib/brand-store';
import { BrandProfile } from '@/types/brand';
import { LookalikeRiskAssessment, RiskBand, CandidateClassification } from '@/lib/similarity/lookalike-risk-engine';
import { LookalikeReviewRecord, ReviewDecisionType } from '@/lib/similarity/review-store';

function ArcMeter({
  score,
  label,
  color,
  maxScore = 100,
}: {
  score: number;
  label: string;
  color: string;
  maxScore?: number;
}) {
  const size = 110;
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * Math.min(score, maxScore)) / maxScore;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-[135deg]">
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
          <span className="font-mono text-[26px] font-bold text-[#202723] leading-none tabular-nums">
            {score}
          </span>
          <span className="font-mono text-[11px] text-[#858D86] mt-1">/ {maxScore}</span>
        </div>
      </div>
      <span className="text-[12px] font-semibold text-[#626B65] uppercase tracking-wider mt-1 text-center">
        {label}
      </span>
    </div>
  );
}

function RiskBandBadge({ band }: { band: RiskBand }) {
  switch (band) {
    case 'High priority':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FDF2F3] border border-[#F8D3D6] text-[#C93643] text-[11px] font-mono font-bold tracking-wide">
          <ShieldAlert className="h-3.5 w-3.5" />
          HIGH PRIORITY (80–100)
        </span>
      );
    case 'Suspicious':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FDF5F2] border border-[#F8DDD4] text-[#D95F36] text-[11px] font-mono font-bold tracking-wide">
          <AlertTriangle className="h-3.5 w-3.5" />
          SUSPICIOUS (60–79)
        </span>
      );
    case 'Needs review':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FEF9F0] border border-[#FBE8CA] text-[#B7791F] text-[11px] font-mono font-bold tracking-wide">
          <AlertOctagon className="h-3.5 w-3.5" />
          NEEDS REVIEW (30–59)
        </span>
      );
    case 'Low concern':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#EFF7F2] border border-[#CBE4D4] text-[#347653] text-[11px] font-mono font-bold tracking-wide">
          <ShieldCheck className="h-3.5 w-3.5" />
          LOW CONCERN (0–29)
        </span>
      );
  }
}

function VariationBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#ECEFEC] border border-[#DDE2DC] text-[11px] font-mono text-[#626B65]">
      <Tag className="h-3 w-3 text-[#477A60]" />
      {type}
    </span>
  );
}

export default function LookalikeDetectionWorkbench() {
  const [selectedBrandName, setSelectedBrandName] = useState<string>('ApexPay');
  const [candidateInput, setCandidateInput] = useState<string>('ApexP\u0430y');
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [platform, setPlatform] = useState<string>('Twitter / X');
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [developer, setDeveloper] = useState<string>('');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<LookalikeRiskAssessment | null>(null);

  // Review & Feedback State
  const [existingReview, setExistingReview] = useState<LookalikeReviewRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  // Ensure active brand exists or fallback
  const activeBrandProfile: BrandProfile =
    PRESET_BRANDS[selectedBrandName] || PRESET_BRANDS['Paytm'];

  const handleRunAnalysis = async (candidateNameParam?: string, brandNameParam?: string) => {
    const candidateToAnalyze = (candidateNameParam !== undefined ? candidateNameParam : candidateInput).trim();
    const brandToAnalyze = brandNameParam !== undefined ? brandNameParam : selectedBrandName;

    if (!candidateToAnalyze) return;

    setAnalyzing(true);
    setReviewMessage(null);

    try {
      const res = await fetch('/api/lookalike-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: candidateToAnalyze,
          brandName: brandToAnalyze,
          platform: platform || undefined,
          profileUrl: profileUrl || undefined,
          developer: developer || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.assessment) {
        setAssessment(data.assessment);
        setExistingReview(data.review || null);
      }
    } catch (err) {
      console.error('Failed to run lookalike detection API:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyPreset = (candidate: string, brand: string) => {
    setSelectedBrandName(brand);
    setCandidateInput(candidate);
    handleRunAnalysis(candidate, brand);
  };

  const handleRecordReview = async (decision: ReviewDecisionType) => {
    if (!assessment) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/lookalike-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: assessment.candidateName,
          brandName: assessment.brandName,
          decision,
          notes: reviewNotes || undefined,
          reviewedBy: 'Security Analyst (Console)',
        }),
      });
      const data = await res.json();
      if (data.success && data.record) {
        setExistingReview(data.record);
        setReviewMessage(`Recorded analyst feedback as "${decision.toUpperCase().replace('_', ' ')}". Baseline allowlist updated.`);
        setReviewNotes('');
      }
    } catch (err) {
      console.error('Failed to record review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Run initial evaluation on mount
  useEffect(() => {
    handleRunAnalysis('ApexP\u0430y', 'ApexPay');
  }, []);

  return (
    <div className="space-y-8">
      {/* 1. Header & Context */}
      <div className="space-y-2 border-b border-[#DDE2DC] pb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#477A60] font-bold">
            DETECTION ENGINE
          </span>
          <span className="text-[#DDE2DC]">/</span>
          <span className="text-[13px] text-[#626B65] font-medium">
            Look-alike Name Detection & False-Positive Minimization
          </span>
        </div>
        <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-[#202723]">
          Analyze Brand Name Resemblance
        </h2>
        <p className="text-[14px] text-[#626B65] max-w-3xl leading-relaxed">
          Evaluates Unicode confusables, character transpositions, added support affixes, and delimiters.
          Prevents false positives by evaluating independent contextual evidence and explicit allowlist registries.
        </p>
      </div>

      {/* 2. Interactive Input Instrument */}
      <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-6 sm:p-7 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Brand Selector */}
          <div>
            <label className="block text-[12px] font-bold text-[#626B65] uppercase tracking-wider mb-2">
              Protected Brand Baseline
            </label>
            <div className="relative">
              <select
                value={selectedBrandName}
                onChange={(e) => {
                  setSelectedBrandName(e.target.value);
                  if (assessment) handleRunAnalysis(candidateInput, e.target.value);
                }}
                className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-4 py-2.5 text-[14px] text-[#202723] font-medium outline-none focus:border-[#477A60] focus:bg-[#FFFFFF] transition-colors appearance-none cursor-pointer shadow-xs"
              >
                {Object.keys(PRESET_BRANDS).map((b) => (
                  <option key={b} value={b} className="bg-[#FFFFFF] text-[#202723]">
                    {b} ({PRESET_BRANDS[b].domain})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-[#858D86] pointer-events-none" />
            </div>
          </div>

          {/* Candidate Name Input */}
          <div className="sm:col-span-2">
            <label className="block text-[12px] font-bold text-[#626B65] uppercase tracking-wider mb-2">
              Candidate Name or Handle
            </label>
            <input
              type="text"
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              placeholder="e.g. Paytm Customer Care, Pаytm, @payttm, bike..."
              className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-4 py-2.5 text-[14px] text-[#202723] font-mono outline-none focus:border-[#477A60] focus:bg-[#FFFFFF] transition-colors shadow-xs"
            />
          </div>
        </div>

        {/* Optional Context Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#626B65] hover:text-[#477A60] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#477A60]" />
            <span>{showOptionalFields ? 'Hide' : 'Add'} Optional Platform, Destination & Bio Context</span>
          </button>
        </div>

        {/* Optional Context Fields */}
        {showOptionalFields && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3 border-t border-[#DDE2DC]">
            <div>
              <label className="block text-[11px] font-bold text-[#858D86] uppercase mb-1.5">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3 py-2 text-[13px] text-[#202723] font-medium outline-none focus:border-[#477A60]"
              >
                <option value="Twitter / X">Twitter / X</option>
                <option value="Instagram">Instagram</option>
                <option value="YouTube">YouTube</option>
                <option value="Google Play">Google Play</option>
                <option value="Apple App Store">Apple App Store</option>
                <option value="Web / Domain">Web / Domain</option>
                <option value="All / Any">All / Any</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#858D86] uppercase mb-1.5">
                Profile URL / Domain (Optional)
              </label>
              <input
                type="text"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://paytm-support-verify.xyz"
                className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3 py-2 text-[13px] text-[#202723] font-mono outline-none focus:border-[#477A60]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#858D86] uppercase mb-1.5">
                App Developer / Publisher (Optional)
              </label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="e.g. Rogue Developer Ltd"
                className="w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-3 py-2 text-[13px] text-[#202723] outline-none focus:border-[#477A60]"
              />
            </div>
          </div>
        )}

        {/* Quick Test Presets & Action Button */}
        <div className="flex flex-col gap-4 pt-3 border-t border-[#DDE2DC]">
          {/* Fictional Demonstration Suite (ApexPay) */}
          <div className="flex flex-wrap items-center gap-2 text-[12px] bg-[#ECEFEC] p-3.5 rounded-xl border border-[#DDE2DC]">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E7F0E9] text-[#477A60] font-bold uppercase text-[10px] tracking-wider border border-[#D1E3D5]">
              <Sparkles className="h-3.5 w-3.5 text-[#477A60]" /> ApexPay Suite
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('@ApexPay', 'ApexPay')}
              className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F7F8F6] text-[#347653] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
            >
              1. Official Asset (@ApexPay)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ApexP\u0430y', 'ApexPay')}
              className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F7F8F6] text-[#B7791F] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
            >
              2. Homoglyph (ApexPаy)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ApexPay Support Desk', 'ApexPay')}
              className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F7F8F6] text-[#D95F36] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
            >
              3. Added Words (Support)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Apex_Pay', 'ApexPay')}
              className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F7F8F6] text-[#3974C6] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
            >
              4. Separator (Apex_Pay)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Apex Tools & Hardware', 'ApexPay')}
              className="px-2.5 py-1 bg-[#FFFFFF] hover:bg-[#F7F8F6] text-[#626B65] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
            >
              5. Ordinary Business Name
            </button>
          </div>

          {/* Real Brand Benchmarks */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="text-[#858D86] font-medium mr-1 text-[11px] uppercase tracking-wider">Live Benchmarks:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('Paytm Support Helpline', 'Paytm')}
                className="px-2.5 py-1 bg-[#ECEFEC] hover:bg-[#DDE2DC] text-[#626B65] hover:text-[#202723] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
              >
                Paytm Support
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('P\u0430ytm Care', 'Paytm')}
                className="px-2.5 py-1 bg-[#ECEFEC] hover:bg-[#DDE2DC] text-[#626B65] hover:text-[#202723] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
              >
                Cyrillic Pаytm
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Pyatm', 'Paytm')}
                className="px-2.5 py-1 bg-[#ECEFEC] hover:bg-[#DDE2DC] text-[#626B65] hover:text-[#202723] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
              >
                Pyatm Transposition
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('bike', 'Nike')}
                className="px-2.5 py-1 bg-[#ECEFEC] hover:bg-[#DDE2DC] text-[#626B65] hover:text-[#202723] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
              >
                bike (Common Word)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('@Paytm', 'Paytm')}
                className="px-2.5 py-1 bg-[#ECEFEC] hover:bg-[#DDE2DC] text-[#347653] font-medium rounded-md transition-colors cursor-pointer border border-[#DDE2DC]"
              >
                @Paytm (Official)
              </button>
            </div>

            <button
              type="button"
              disabled={analyzing || !candidateInput.trim()}
              onClick={() => handleRunAnalysis()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#477A60] hover:bg-[#365F49] text-white text-[13px] font-bold rounded-lg shadow-sm cursor-pointer transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Analyze Candidate</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Assessment Results Panel */}
      {assessment && (
        <div className="space-y-6 animate-in fade-in zoom-in-95">
          {/* Previous Review Alert if exists */}
          {existingReview && (
            <div className="bg-[#F2F6FC] border border-[#D3E1F5] rounded-xl p-4 flex items-start gap-3 text-[13px]">
              <Bookmark className="h-4 w-4 text-[#3974C6] mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="text-[#202723] font-bold">
                  Analyst Decision on Record: {existingReview.decision.toUpperCase().replace('_', ' ')}
                </div>
                <div className="text-[#626B65]">
                  Reviewed by {existingReview.reviewedBy} on {new Date(existingReview.reviewedAt).toLocaleDateString()}
                  {existingReview.notes && ` — Note: "${existingReview.notes}"`}
                </div>
              </div>
            </div>
          )}

          {reviewMessage && (
            <div className="bg-[#EFF7F2] border border-[#CBE4D4] rounded-xl p-4 flex items-center gap-2 text-[13px] font-medium text-[#347653]">
              <Check className="h-4 w-4 text-[#347653]" />
              <span>{reviewMessage}</span>
            </div>
          )}

          {/* Primary Result Card */}
          <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-6 sm:p-7 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            {/* Top Bar: Matched Brand Baseline + Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE2DC] pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#858D86] uppercase font-bold tracking-wider">MATCHED BRAND:</span>
                  <span className="text-[16px] font-bold text-[#202723]">
                    {assessment.brandName}
                  </span>
                  <span className="text-[11px] font-mono text-[#626B65] bg-[#ECEFEC] px-2 py-0.5 rounded border border-[#DDE2DC]">
                    {activeBrandProfile.domain}
                  </span>
                </div>
                <div className="text-[13px] text-[#626B65] font-mono">
                  Candidate Target: <span className="text-[#202723] font-bold">&quot;{assessment.candidateName}&quot;</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <VariationBadge type={assessment.variationType} />
                <RiskBandBadge band={assessment.riskBand} />
              </div>
            </div>

            {/* Middle: Distinct Gauges & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center border-b border-[#DDE2DC] pb-6">
              {/* Meter 1: Similarity Score (Lexical) */}
              <div className="flex flex-col items-center justify-center p-3 border-r border-[#DDE2DC] md:col-span-1">
                <ArcMeter
                  score={assessment.similarityScore}
                  label="Name Similarity"
                  color={
                    assessment.similarityScore >= 80
                      ? '#477A60'
                      : assessment.similarityScore >= 60
                      ? '#B7791F'
                      : '#858D86'
                  }
                />
              </div>

              {/* Meter 2: Contextual Risk Score */}
              <div className="flex flex-col items-center justify-center p-3 border-r border-[#DDE2DC] md:col-span-1">
                <ArcMeter
                  score={assessment.riskScore}
                  label="Threat Risk Score"
                  color={
                    assessment.riskScore >= 80
                      ? '#C93643'
                      : assessment.riskScore >= 60
                      ? '#D95F36'
                      : assessment.riskScore >= 30
                      ? '#B7791F'
                      : '#347653'
                  }
                />
              </div>

              {/* Breakdown metrics in monospace */}
              <div className="md:col-span-2 space-y-2.5 text-[13px] font-mono">
                <div className="flex items-center justify-between text-[#626B65]">
                  <span>Damerau-Levenshtein Edit Distance:</span>
                  <span className="text-[#202723] font-bold tabular-nums">
                    {assessment.similarityMetrics.editDistance} edit(s)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#626B65]">
                  <span>Jaro-Winkler Prefix Metric:</span>
                  <span className="text-[#202723] font-bold tabular-nums">
                    {Math.round(assessment.similarityMetrics.jaroWinklerSimilarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#626B65]">
                  <span>Token Jaccard Word Overlap:</span>
                  <span className="text-[#202723] font-bold tabular-nums">
                    {Math.round(assessment.similarityMetrics.tokenSimilarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#626B65]">
                  <span>Allowlist / Registry Status:</span>
                  <span className={assessment.isAllowlisted ? 'text-[#347653] font-bold' : 'text-[#858D86] font-medium'}>
                    {assessment.isAllowlisted ? 'OFFICIAL ASSET ALLOWLISTED' : 'UNREGISTERED CANDIDATE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Heuristic Notice */}
            <div className="p-4 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase text-[#B7791F]">
                <Info className="h-4 w-4" />
                <span>Heuristic Anti-False-Positive Policy</span>
              </div>
              <p className="text-[13px] text-[#202723] leading-relaxed">
                {assessment.summaryPhrase}
              </p>
              <p className="text-[12px] text-[#626B65] font-mono">
                {assessment.heuristicNotice}
              </p>
            </div>

            {/* Itemized Evidence */}
            <div className="space-y-3">
              <h3 className="text-[13px] uppercase tracking-wider text-[#626B65] font-bold">
                Contributing Signals & Forensic Evidence
              </h3>

              <div className="space-y-2">
                {assessment.contributions.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-[#F7F8F6] border border-[#DDE2DC] rounded-xl flex items-start justify-between gap-3 text-[13px]"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#858D86] font-mono uppercase">
                          [{c.category.replace('_', ' ')}]
                        </span>
                        <span className="text-[#202723] font-semibold">{c.description}</span>
                      </div>
                    </div>
                    <span className="text-[12px] font-mono text-[#477A60] font-bold shrink-0 bg-[#E7F0E9] px-2 py-0.5 rounded border border-[#D1E3D5]">
                      +{c.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Action Bar */}
            <div className="pt-5 border-t border-[#DDE2DC] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] uppercase tracking-wider text-[#626B65] font-bold">
                  Analyst Review & Feedback Action
                </span>
                <span className="text-[12px] text-[#858D86] font-medium">
                  Records decision in SAFENET database & updates allowlist
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional analyst review notes..."
                  className="flex-1 w-full bg-[#F7F8F6] border border-[#DDE2DC] rounded-lg px-4 py-2 text-[13px] text-[#202723] outline-none focus:border-[#477A60] focus:bg-[#FFFFFF] transition-colors"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('legitimate')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#EFF7F2] hover:bg-[#E0EFE5] border border-[#CBE4D4] text-[#347653] text-[12px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Mark Legitimate
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('suspicious')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#FEF9F0] hover:bg-[#FDF3E3] border border-[#FBE8CA] text-[#B7791F] text-[12px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Mark Suspicious
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('confirmed_impersonation')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#FDF2F3] hover:bg-[#FCE5E7] border border-[#F8D3D6] text-[#C93643] text-[12px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Confirm Threat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
