'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  Info,
  RefreshCw,
  Check,
  Bookmark,
  Tag,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile } from '@/types/brand';
import { LookalikeRiskAssessment, RiskBand } from '@/lib/similarity/lookalike-risk-engine';
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
  const size = 130;
  const strokeWidth = 8;
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
            stroke="#303946"
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
          <span className="font-mono text-[34px] font-extrabold text-[#FFFFFF] leading-none tabular-nums">
            {score}
          </span>
          <span className="font-mono text-[16px] font-bold text-[#D0D7E0] mt-1">/ {maxScore}</span>
        </div>
      </div>
      <span className="text-[17px] font-bold text-[#FFFFFF] uppercase tracking-wider mt-2 text-center">
        {label}
      </span>
    </div>
  );
}

function RiskBandBadge({ band }: { band: RiskBand }) {
  switch (band) {
    case 'High priority':
      return (
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#2D1216] border border-[#FF5C6C]/40 text-[#FF5C6C] text-[16px] font-mono font-bold tracking-wide">
          <ShieldAlert className="h-4 w-4" />
          HIGH PRIORITY (80–100)
        </span>
      );
    case 'Suspicious':
      return (
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#2C1C0D] border border-[#FFAB40]/40 text-[#FFAB40] text-[16px] font-mono font-bold tracking-wide">
          <AlertTriangle className="h-4 w-4" />
          SUSPICIOUS (60–79)
        </span>
      );
    case 'Needs review':
      return (
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#292211] border border-[#FFD166]/40 text-[#FFD166] text-[16px] font-mono font-bold tracking-wide">
          <AlertOctagon className="h-4 w-4" />
          NEEDS REVIEW (30–59)
        </span>
      );
    case 'Low concern':
    default:
      return (
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0F2620] border border-[#35D0BA]/40 text-[#35D0BA] text-[16px] font-mono font-bold tracking-wide">
          <ShieldCheck className="h-4 w-4" />
          LOW CONCERN (0–29)
        </span>
      );
  }
}

function VariationBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121821] border border-[#303946] text-[16px] font-mono font-bold text-[#FFFFFF]">
      <Tag className="h-4 w-4 text-[#35D0BA]" />
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
    <div className="space-y-10">
      {/* 1. Header & Context */}
      <div className="space-y-3 border-b border-[#303946] pb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[15px] uppercase tracking-wider text-[#35D0BA] font-extrabold">
            DETECTION ENGINE
          </span>
          <span className="text-[#303946]">/</span>
          <span className="text-[17px] text-[#D0D7E0] font-bold">
            Look-alike Name Detection & False-Positive Minimization
          </span>
        </div>
        <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight text-[#FFFFFF]">
          Analyze Brand Name Resemblance
        </h2>
        <p className="text-[20px] text-[#D0D7E0] max-w-4xl leading-relaxed font-bold">
          Evaluates Unicode confusables, character transpositions, added support affixes, and delimiters.
          Prevents false positives by evaluating independent contextual evidence and explicit allowlist registries.
        </p>
      </div>

      {/* 2. Interactive Input Instrument (Open, Non-Boxy) */}
      <div className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 space-y-7 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Brand Selector */}
          <div>
            <label className="block text-[18px] font-extrabold text-[#FFFFFF] uppercase tracking-wider mb-2.5">
              Protected Brand Baseline
            </label>
            <div className="relative">
              <select
                value={selectedBrandName}
                onChange={(e) => {
                  setSelectedBrandName(e.target.value);
                  if (assessment) handleRunAnalysis(candidateInput, e.target.value);
                }}
                className="w-full bg-[#121821] border border-[#303946] rounded-xl px-4 py-3.5 text-[19px] text-[#FFFFFF] font-bold outline-none focus:border-[#35D0BA] transition-colors appearance-none cursor-pointer"
              >
                {Object.keys(PRESET_BRANDS).map((b) => (
                  <option key={b} value={b} className="bg-[#0D1118] text-[#FFFFFF]">
                    {b} ({PRESET_BRANDS[b].domain})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-4 h-5 w-5 text-[#D0D7E0] pointer-events-none" />
            </div>
          </div>

          {/* Candidate Name Input */}
          <div className="sm:col-span-2">
            <label className="block text-[18px] font-extrabold text-[#FFFFFF] uppercase tracking-wider mb-2.5">
              Candidate Name or Handle
            </label>
            <input
              type="text"
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              placeholder="e.g. Paytm Customer Care, Pаytm, @payttm, bike..."
              className="w-full bg-[#121821] border border-[#303946] rounded-xl px-4 py-3.5 text-[19px] text-[#FFFFFF] font-mono font-bold outline-none focus:border-[#35D0BA] transition-colors"
            />
          </div>
        </div>

        {/* Optional Context Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="inline-flex items-center gap-2.5 text-[18px] font-bold text-[#D0D7E0] hover:text-[#35D0BA] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-5 w-5 text-[#35D0BA]" />
            <span>{showOptionalFields ? 'Hide' : 'Add'} Optional Platform, Destination & Bio Context</span>
          </button>
        </div>

        {/* Optional Context Fields */}
        {showOptionalFields && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#303946]">
            <div>
              <label className="block text-[16px] font-bold text-[#D0D7E0] uppercase mb-2">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#121821] border border-[#303946] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-bold outline-none focus:border-[#35D0BA]"
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
              <label className="block text-[16px] font-bold text-[#D0D7E0] uppercase mb-2">
                Profile URL / Domain (Optional)
              </label>
              <input
                type="text"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://paytm-support-verify.xyz"
                className="w-full bg-[#121821] border border-[#303946] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-mono font-bold outline-none focus:border-[#35D0BA]"
              />
            </div>
            <div>
              <label className="block text-[16px] font-bold text-[#D0D7E0] uppercase mb-2">
                App Developer / Publisher (Optional)
              </label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="e.g. Rogue Developer Ltd"
                className="w-full bg-[#121821] border border-[#303946] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-bold outline-none focus:border-[#35D0BA]"
              />
            </div>
          </div>
        )}

        {/* Quick Test Presets & Action Button */}
        <div className="flex flex-col gap-5 pt-4 border-t border-[#303946]">
          {/* Fictional Demonstration Suite (ApexPay) */}
          <div className="flex flex-wrap items-center gap-2.5 text-[16px] bg-[#121821] p-4 rounded-xl border border-[#303946]">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#080B10] text-[#35D0BA] font-extrabold uppercase text-[14px] tracking-wider border border-[#303946]">
              <Sparkles className="h-4 w-4 text-[#35D0BA]" /> ApexPay Suite
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('@ApexPay', 'ApexPay')}
              className="px-3.5 py-1.5 bg-[#080B10] hover:bg-[#19222D] text-[#35D0BA] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
            >
              1. Official Asset (@ApexPay)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ApexP\u0430y', 'ApexPay')}
              className="px-3.5 py-1.5 bg-[#080B10] hover:bg-[#19222D] text-[#FFAB40] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
            >
              2. Homoglyph (ApexPаy)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ApexPay Support Desk', 'ApexPay')}
              className="px-3.5 py-1.5 bg-[#080B10] hover:bg-[#19222D] text-[#FF5C6C] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
            >
              3. Added Words (Support)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Apex_Pay', 'ApexPay')}
              className="px-3.5 py-1.5 bg-[#080B10] hover:bg-[#19222D] text-[#64A9FF] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
            >
              4. Separator (Apex_Pay)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Apex Tools & Hardware', 'ApexPay')}
              className="px-3.5 py-1.5 bg-[#080B10] hover:bg-[#19222D] text-[#D0D7E0] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
            >
              5. Ordinary Business Name
            </button>
          </div>

          {/* Real Brand Benchmarks */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex flex-wrap items-center gap-2.5 text-[15px]">
              <span className="text-[#D0D7E0] font-bold mr-1 text-[15px] uppercase tracking-wider">Live Benchmarks:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('Paytm Support Helpline', 'Paytm')}
                className="px-3 py-1.5 bg-[#121821] hover:bg-[#19222D] text-[#FFFFFF] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
              >
                Paytm Support
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('P\u0430ytm Care', 'Paytm')}
                className="px-3 py-1.5 bg-[#121821] hover:bg-[#19222D] text-[#FFFFFF] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
              >
                Cyrillic Pаytm
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Pyatm', 'Paytm')}
                className="px-3 py-1.5 bg-[#121821] hover:bg-[#19222D] text-[#FFFFFF] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
              >
                Pyatm Transposition
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('bike', 'Nike')}
                className="px-3 py-1.5 bg-[#121821] hover:bg-[#19222D] text-[#FFFFFF] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
              >
                bike (Common Word)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('@Paytm', 'Paytm')}
                className="px-3 py-1.5 bg-[#121821] hover:bg-[#19222D] text-[#35D0BA] font-bold rounded-lg transition-colors cursor-pointer border border-[#303946]"
              >
                @Paytm (Official)
              </button>
            </div>

            <button
              type="button"
              disabled={analyzing || !candidateInput.trim()}
              onClick={() => handleRunAnalysis()}
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-[#35D0BA] hover:bg-[#2EB8A5] text-[#080B10] text-[19px] font-extrabold rounded-xl shadow-lg cursor-pointer transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>Analyze Candidate</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Assessment Results Panel */}
      {assessment && (
        <div className="space-y-8 animate-in fade-in zoom-in-95">
          {/* Previous Review Alert if exists */}
          {existingReview && (
            <div className="bg-[#121821] border border-[#303946] rounded-xl p-5 flex items-start gap-3.5 text-[18px]">
              <Bookmark className="h-5 w-5 text-[#64A9FF] mt-1 shrink-0" />
              <div className="space-y-1">
                <div className="text-[#FFFFFF] font-extrabold">
                  Analyst Decision on Record: {existingReview.decision.toUpperCase().replace('_', ' ')}
                </div>
                <div className="text-[#D0D7E0] font-bold">
                  Reviewed by {existingReview.reviewedBy} on {new Date(existingReview.reviewedAt).toLocaleDateString()}
                  {existingReview.notes && ` — Note: "${existingReview.notes}"`}
                </div>
              </div>
            </div>
          )}

          {reviewMessage && (
            <div className="bg-[#0F2620] border border-[#35D0BA]/50 rounded-xl p-5 flex items-center gap-3 text-[18px] font-bold text-[#35D0BA]">
              <Check className="h-5 w-5 text-[#35D0BA]" />
              <span>{reviewMessage}</span>
            </div>
          )}

          {/* Primary Result Section (Open, Non-Boxy) */}
          <div className="bg-[#0D1118] border border-[#303946] rounded-2xl p-7 sm:p-9 space-y-8 shadow-xl">
            {/* Top Bar: Matched Brand Baseline + Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#303946] pb-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-[15px] text-[#D0D7E0] uppercase font-bold tracking-wider">MATCHED BRAND:</span>
                  <span className="text-[22px] font-extrabold text-[#FFFFFF]">
                    {assessment.brandName}
                  </span>
                  <span className="text-[15px] font-mono text-[#35D0BA] bg-[#121821] px-3 py-1 rounded-md border border-[#303946] font-bold">
                    {activeBrandProfile.domain}
                  </span>
                </div>
                <div className="text-[18px] text-[#D0D7E0] font-mono font-bold">
                  Candidate Target: <span className="text-[#FFFFFF] font-extrabold">&quot;{assessment.candidateName}&quot;</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <VariationBadge type={assessment.variationType} />
                <RiskBandBadge band={assessment.riskBand} />
              </div>
            </div>

            {/* Middle: Distinct Gauges & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center border-b border-[#303946] pb-8">
              {/* Meter 1: Similarity Score (Lexical) */}
              <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-[#303946] md:col-span-1">
                <ArcMeter
                  score={assessment.similarityScore}
                  label="Name Similarity"
                  color={
                    assessment.similarityScore >= 80
                      ? '#35D0BA'
                      : assessment.similarityScore >= 60
                      ? '#FFAB40'
                      : '#64A9FF'
                  }
                />
              </div>

              {/* Meter 2: Contextual Risk Score */}
              <div className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-[#303946] md:col-span-1">
                <ArcMeter
                  score={assessment.riskScore}
                  label="Threat Risk Score"
                  color={
                    assessment.riskScore >= 80
                      ? '#FF5C6C'
                      : assessment.riskScore >= 60
                      ? '#FFAB40'
                      : assessment.riskScore >= 30
                      ? '#FFD166'
                      : '#35D0BA'
                  }
                />
              </div>

              {/* Breakdown metrics in monospace */}
              <div className="md:col-span-2 space-y-3.5 text-[18px] font-mono">
                <div className="flex items-center justify-between text-[#D0D7E0]">
                  <span>Damerau-Levenshtein Edit Distance:</span>
                  <span className="text-[#FFFFFF] font-extrabold tabular-nums">
                    {assessment.similarityMetrics.editDistance} edit(s)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#D0D7E0]">
                  <span>Jaro-Winkler Prefix Metric:</span>
                  <span className="text-[#FFFFFF] font-extrabold tabular-nums">
                    {Math.round(assessment.similarityMetrics.jaroWinklerSimilarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#D0D7E0]">
                  <span>Token Jaccard Word Overlap:</span>
                  <span className="text-[#FFFFFF] font-extrabold tabular-nums">
                    {Math.round(assessment.similarityMetrics.tokenSimilarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#D0D7E0]">
                  <span>Allowlist / Registry Status:</span>
                  <span className={assessment.isAllowlisted ? 'text-[#35D0BA] font-extrabold' : 'text-[#D0D7E0] font-bold'}>
                    {assessment.isAllowlisted ? 'OFFICIAL ASSET ALLOWLISTED' : 'UNREGISTERED CANDIDATE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Heuristic Notice */}
            <div className="p-5 bg-[#121821] border border-[#303946] rounded-xl space-y-2">
              <div className="flex items-center gap-2.5 text-[16px] font-extrabold uppercase text-[#FFAB40]">
                <Info className="h-5 w-5" />
                <span>Heuristic Anti-False-Positive Policy</span>
              </div>
              <p className="text-[19px] text-[#FFFFFF] leading-relaxed font-bold">
                {assessment.summaryPhrase}
              </p>
              <p className="text-[16px] text-[#D0D7E0] font-mono font-bold">
                {assessment.heuristicNotice}
              </p>
            </div>

            {/* Itemized Evidence */}
            <div className="space-y-4">
              <h3 className="text-[17px] uppercase tracking-wider text-[#FFFFFF] font-extrabold">
                Contributing Signals & Forensic Evidence
              </h3>

              <div className="space-y-3">
                {assessment.contributions.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-[#121821] border border-[#303946] rounded-xl flex items-start justify-between gap-4 text-[18px]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-extrabold text-[#64A9FF] font-mono uppercase">
                          [{c.category.replace('_', ' ')}]
                        </span>
                        <span className="text-[#FFFFFF] font-bold">{c.description}</span>
                      </div>
                    </div>
                    <span className="text-[16px] font-mono text-[#35D0BA] font-extrabold shrink-0 bg-[#080B10] px-3 py-1 rounded-md border border-[#303946]">
                      +{c.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Action Bar */}
            <div className="pt-6 border-t border-[#303946] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[16px] uppercase tracking-wider text-[#FFFFFF] font-extrabold">
                  Analyst Review & Feedback Action
                </span>
                <span className="text-[16px] text-[#D0D7E0] font-bold">
                  Records decision in SAFENET database & updates allowlist
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional analyst review notes..."
                  className="flex-1 w-full bg-[#121821] border border-[#303946] rounded-xl px-4 py-3 text-[18px] text-[#FFFFFF] font-bold outline-none focus:border-[#35D0BA] transition-colors"
                />

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('legitimate')}
                    className="flex-1 sm:flex-initial px-5 py-3 bg-[#0F2620] hover:bg-[#15382F] border border-[#35D0BA]/50 text-[#35D0BA] text-[17px] font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    Mark Legitimate
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('suspicious')}
                    className="flex-1 sm:flex-initial px-5 py-3 bg-[#2C1C0D] hover:bg-[#3D2712] border border-[#FFAB40]/50 text-[#FFAB40] text-[17px] font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                  >
                    Mark Suspicious
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('confirmed_impersonation')}
                    className="flex-1 sm:flex-initial px-5 py-3 bg-[#2D1216] hover:bg-[#3E1A1F] border border-[#FF5C6C]/50 text-[#FF5C6C] text-[17px] font-bold rounded-xl transition-colors cursor-pointer shadow-md"
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
