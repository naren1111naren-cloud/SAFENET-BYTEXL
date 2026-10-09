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
            stroke="#E2E8F0"
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
          <span className="font-mono text-[26px] font-bold text-slate-900 leading-none">
            {score}
          </span>
          <span className="font-mono text-[10px] text-slate-400 mt-1">/ {maxScore}</span>
        </div>
      </div>
      <span className="text-[12px] font-semibold text-slate-600 uppercase tracking-wider mt-1 text-center">
        {label}
      </span>
    </div>
  );
}

function RiskBandBadge({ band }: { band: RiskBand }) {
  switch (band) {
    case 'High priority':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono font-bold tracking-wide">
          <ShieldAlert className="h-3.5 w-3.5" />
          HIGH PRIORITY (80–100)
        </span>
      );
    case 'Suspicious':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-mono font-bold tracking-wide">
          <AlertTriangle className="h-3.5 w-3.5" />
          SUSPICIOUS (60–79)
        </span>
      );
    case 'Needs review':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-mono font-bold tracking-wide">
          <AlertOctagon className="h-3.5 w-3.5" />
          NEEDS REVIEW (30–59)
        </span>
      );
    case 'Low concern':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-bold tracking-wide">
          <ShieldCheck className="h-3.5 w-3.5" />
          LOW CONCERN (0–29)
        </span>
      );
  }
}

function VariationBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    exact_match: { label: 'EXACT MATCH', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    homoglyph_confusable: { label: 'UNICODE CONFUSABLE / HOMOGLYPH', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    added_keyword: { label: 'ADDED KEYWORDS (SUPPORT / OFFICIAL)', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    character_transposition: { label: 'ADJACENT TRANSPOSITION', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    separator_variation: { label: 'SEPARATOR / PUNCTUATION VARIATION', color: 'text-yellow-800 bg-yellow-50 border-yellow-200' },
    repeated_character: { label: 'REPEATED CHARACTERS', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    combosquatting: { label: 'COMBOSQUATTING AFFIX', color: 'text-orange-700 bg-orange-50 border-orange-200' },
    character_substitution: { label: 'CHARACTER SUBSTITUTION', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    character_insertion: { label: 'CHARACTER INSERTION', color: 'text-sky-700 bg-sky-50 border-sky-200' },
    character_deletion: { label: 'CHARACTER DELETION', color: 'text-sky-700 bg-sky-50 border-sky-200' },
    low_similarity: { label: 'LOW SIMILARITY / ORDINARY', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  };

  const item = map[type] || { label: type.toUpperCase().replace('_', ' '), color: 'text-slate-600 bg-slate-100 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[10px] font-bold border ${item.color}`}>
      {item.label}
    </span>
  );
}

export default function LookalikeDetectionWorkbench() {
  const [selectedBrandName, setSelectedBrandName] = useState('Paytm');
  const [candidateInput, setCandidateInput] = useState('Paytm Customer Care');
  const [platform, setPlatform] = useState('Twitter / X');
  const [profileUrl, setProfileUrl] = useState('');
  const [developer, setDeveloper] = useState('');
  const [description, setDescription] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<LookalikeRiskAssessment | null>(null);
  const [existingReview, setExistingReview] = useState<LookalikeReviewRecord | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);

  // Sync active brand from store on mount
  useEffect(() => {
    const brand = BrandStore.getBrand();
    if (brand && brand.name) {
      setSelectedBrandName(brand.name);
    }
  }, []);

  const handleRunAnalysis = async (candidateText = candidateInput, brand = selectedBrandName) => {
    if (!candidateText.trim()) return;
    setAnalyzing(true);
    setReviewMessage(null);

    try {
      const res = await fetch('/api/lookalike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: candidateText,
          brandName: brand,
          platform: platform !== 'All / Any' ? platform : undefined,
          profileUrl: profileUrl.trim() || undefined,
          developer: developer.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAssessment(data.assessment);
        setExistingReview(data.existingReview || null);
      }
    } catch (e) {
      console.error('Look-alike detection failed:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyPreset = (candidateText: string, brand = selectedBrandName) => {
    setCandidateInput(candidateText);
    setSelectedBrandName(brand);
    handleRunAnalysis(candidateText, brand);
  };

  const handleRecordReview = async (decision: ReviewDecisionType) => {
    if (!assessment) return;
    setSubmittingReview(true);
    setReviewMessage(null);

    try {
      const res = await fetch('/api/lookalike/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: assessment.brandName,
          brandName: assessment.brandName,
          candidateName: assessment.candidateName,
          platform,
          profileUrl,
          decision,
          similarityScore: assessment.similarityScore,
          riskScore: assessment.riskScore,
          variationType: assessment.variationType,
          notes: reviewNotes || `Decision marked as ${decision}`,
          reviewedBy: 'SOC Analyst (L2)',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExistingReview(data.record);
        setReviewMessage(`Review decision saved: Entity registered as "${decision.toUpperCase().replace('_', ' ')}".`);
        // Refresh assessment to reflect allowlist status if marked legitimate
        if (decision === 'legitimate') {
          handleRunAnalysis();
        }
      }
    } catch (e) {
      console.error('Review submission error:', e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const activeBrandProfile: BrandProfile =
    PRESET_BRANDS[selectedBrandName] || PRESET_BRANDS['Paytm'];

  return (
    <div className="space-y-8">
      {/* 1. Header & Context */}
      <div className="space-y-2 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-blue-600 font-bold">
            DETECTION ENGINE
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-[12px] text-slate-500 font-medium">
            Look-alike Name Detection & False-Positive Minimization
          </span>
        </div>
        <h2 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-slate-900">
          Analyze Brand Name Resemblance
        </h2>
        <p className="text-[14px] text-slate-600 max-w-3xl leading-relaxed">
          Evaluates Unicode confusables, character transpositions, added support affixes, and delimiters.
          Prevents false positives by evaluating independent contextual evidence and explicit allowlist registries.
        </p>
      </div>

      {/* 2. Interactive Input Instrument */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Brand Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Protected Brand Baseline
            </label>
            <div className="relative">
              <select
                value={selectedBrandName}
                onChange={(e) => {
                  setSelectedBrandName(e.target.value);
                  if (assessment) handleRunAnalysis(candidateInput, e.target.value);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 font-medium outline-none focus:bg-white focus:border-blue-500 transition-colors appearance-none cursor-pointer shadow-xs"
              >
                {Object.keys(PRESET_BRANDS).map((b) => (
                  <option key={b} value={b} className="bg-white text-slate-900">
                    {b} ({PRESET_BRANDS[b].domain})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Candidate Name Input */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
              Candidate Name or Handle
            </label>
            <input
              type="text"
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              placeholder="e.g. Paytm Customer Care, Pаytm, @payttm, bike..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] text-slate-900 font-mono outline-none focus:bg-white focus:border-blue-500 transition-colors shadow-xs"
            />
          </div>
        </div>

        {/* Optional Context Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <span>{showOptionalFields ? 'Hide' : 'Add'} Optional Platform, Destination & Bio Context</span>
          </button>
        </div>

        {/* Optional Context Fields */}
        {showOptionalFields && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 font-medium outline-none focus:bg-white"
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
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                Profile URL / Domain (Optional)
              </label>
              <input
                type="text"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://paytm-support-verify.xyz"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 font-mono outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                App Developer / Publisher (Optional)
              </label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="e.g. Rogue Developer Ltd"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Quick Test Presets & Action Button */}
        <div className="flex flex-col gap-4 pt-3 border-t border-slate-100">
          {/* Fictional Demonstration Suite (ApexPay) */}
          <div className="flex flex-wrap items-center gap-2 text-[12px] bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-bold uppercase text-[10px] tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" /> ApexPay Suite
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('@ApexPay', 'ApexPay')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-emerald-700 font-medium rounded-md transition-colors cursor-pointer border border-slate-200 shadow-xs"
            >
              1. Official Asset (@ApexPay)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ApexP\u0430y', 'ApexPay')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-amber-700 font-medium rounded-md transition-colors cursor-pointer border border-slate-200 shadow-xs"
            >
              2. Homoglyph (ApexPаy)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ApexPay Support Desk', 'ApexPay')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-orange-700 font-medium rounded-md transition-colors cursor-pointer border border-slate-200 shadow-xs"
            >
              3. Added Words (Support)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Apex_Pay', 'ApexPay')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-sky-700 font-medium rounded-md transition-colors cursor-pointer border border-slate-200 shadow-xs"
            >
              4. Separator (Apex_Pay)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Apex Tools & Hardware', 'ApexPay')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-md transition-colors cursor-pointer border border-slate-200 shadow-xs"
            >
              5. Ordinary Business Name
            </button>
          </div>

          {/* Real Brand Benchmarks */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="text-slate-400 font-medium mr-1 text-[11px] uppercase tracking-wider">Live Benchmarks:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('Paytm Support Helpline', 'Paytm')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors cursor-pointer"
              >
                Paytm Support
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('P\u0430ytm Care', 'Paytm')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors cursor-pointer"
              >
                Cyrillic Pаytm
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Pyatm', 'Paytm')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors cursor-pointer"
              >
                Pyatm Transposition
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('bike', 'Nike')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors cursor-pointer"
              >
                bike (Common Word)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('@Paytm', 'Paytm')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-colors cursor-pointer"
              >
                @Paytm (Official)
              </button>
            </div>

            <button
              type="button"
              disabled={analyzing || !candidateInput.trim()}
              onClick={() => handleRunAnalysis()}
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
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
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-[13px]">
              <Bookmark className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="text-blue-900 font-bold">
                  Analyst Decision on Record: {existingReview.decision.toUpperCase().replace('_', ' ')}
                </div>
                <div className="text-slate-600">
                  Reviewed by {existingReview.reviewedBy} on {new Date(existingReview.reviewedAt).toLocaleDateString()}
                  {existingReview.notes && ` — Note: "${existingReview.notes}"`}
                </div>
              </div>
            </div>
          )}

          {reviewMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2 text-[13px] font-medium text-emerald-800">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>{reviewMessage}</span>
            </div>
          )}

          {/* Primary Result Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
            {/* Top Bar: Matched Brand Baseline + Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">MATCHED BRAND:</span>
                  <span className="text-[16px] font-bold text-slate-900">
                    {assessment.brandName}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {activeBrandProfile.domain}
                  </span>
                </div>
                <div className="text-[13px] text-slate-600 font-mono">
                  Candidate Target: <span className="text-slate-900 font-bold">&quot;{assessment.candidateName}&quot;</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <VariationBadge type={assessment.variationType} />
                <RiskBandBadge band={assessment.riskBand} />
              </div>
            </div>

            {/* Middle: Distinct Gauges & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center border-b border-slate-100 pb-6">
              {/* Meter 1: Similarity Score (Lexical) */}
              <div className="flex flex-col items-center justify-center p-3 border-r border-slate-100 md:col-span-1">
                <ArcMeter
                  score={assessment.similarityScore}
                  label="Name Similarity"
                  color={
                    assessment.similarityScore >= 80
                      ? '#2563EB'
                      : assessment.similarityScore >= 60
                      ? '#D97706'
                      : '#64748B'
                  }
                />
              </div>

              {/* Meter 2: Contextual Risk Score */}
              <div className="flex flex-col items-center justify-center p-3 border-r border-slate-100 md:col-span-1">
                <ArcMeter
                  score={assessment.riskScore}
                  label="Threat Risk Score"
                  color={
                    assessment.riskScore >= 80
                      ? '#DC2626'
                      : assessment.riskScore >= 60
                      ? '#D97706'
                      : assessment.riskScore >= 30
                      ? '#F59E0B'
                      : '#059669'
                  }
                />
              </div>

              {/* Breakdown metrics in monospace */}
              <div className="md:col-span-2 space-y-2.5 text-[13px] font-mono">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Damerau-Levenshtein Edit Distance:</span>
                  <span className="text-slate-900 font-bold">
                    {assessment.similarityMetrics.editDistance} edit(s)
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Jaro-Winkler Prefix Metric:</span>
                  <span className="text-slate-900 font-bold">
                    {Math.round(assessment.similarityMetrics.jaroWinklerSimilarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Token Jaccard Word Overlap:</span>
                  <span className="text-slate-900 font-bold">
                    {Math.round(assessment.similarityMetrics.tokenSimilarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Allowlist / Registry Status:</span>
                  <span className={assessment.isAllowlisted ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
                    {assessment.isAllowlisted ? 'OFFICIAL ASSET ALLOWLISTED' : 'UNREGISTERED CANDIDATE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Heuristic Notice & Distinct Status Callout */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase text-amber-700">
                <Info className="h-4 w-4" />
                <span>Heuristic Anti-False-Positive Policy</span>
              </div>
              <p className="text-[13px] text-slate-700 leading-relaxed">
                {assessment.summaryPhrase}
              </p>
              <p className="text-[12px] text-slate-500 font-mono">
                {assessment.heuristicNotice}
              </p>
            </div>

            {/* Itemized Evidence & Contributing Signals */}
            <div className="space-y-3">
              <h3 className="text-[13px] uppercase tracking-wider text-slate-800 font-bold">
                Contributing Signals & Forensic Evidence
              </h3>

              <div className="space-y-2">
                {assessment.contributions.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-[13px]"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 font-mono uppercase">
                          [{c.category.replace('_', ' ')}]
                        </span>
                        <span className="text-slate-900 font-semibold">{c.description}</span>
                      </div>
                    </div>
                    <span className="text-[12px] font-mono text-blue-700 font-bold shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      +{c.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review and Feedback Decision Action Bar */}
            <div className="pt-5 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] uppercase tracking-wider text-slate-600 font-bold">
                  Analyst Review & Feedback Action
                </span>
                <span className="text-[12px] text-slate-400 font-medium">
                  Records decision in SAFENET database & updates allowlist
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional analyst review notes..."
                  className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-[13px] text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('legitimate')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[12px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Mark Legitimate
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('suspicious')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[12px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Mark Suspicious
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('confirmed_impersonation')}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[12px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
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
