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
  const strokeWidth = 5;
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
            stroke="rgba(255,255,255,0.08)"
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
          <span className="font-mono text-[26px] font-semibold text-[#F2F4F3] leading-none">
            {score}
          </span>
          <span className="font-mono text-[10px] text-[#59625F] mt-0.5">/ {maxScore}</span>
        </div>
      </div>
      <span className="font-mono text-[11px] text-[#8A9390] uppercase tracking-wider mt-1 text-center">
        {label}
      </span>
    </div>
  );
}

function RiskBandBadge({ band }: { band: RiskBand }) {
  switch (band) {
    case 'High priority':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-[#FF5C5C] text-[11px] font-mono font-bold tracking-wide">
          <ShieldAlert className="h-3 w-3" />
          HIGH PRIORITY (80–100)
        </span>
      );
    case 'Suspicious':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#F5B84B]/10 border border-[#F5B84B]/30 text-[#F5B84B] text-[11px] font-mono font-bold tracking-wide">
          <AlertTriangle className="h-3 w-3" />
          SUSPICIOUS (60–79)
        </span>
      );
    case 'Needs review':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-mono font-medium tracking-wide">
          <AlertOctagon className="h-3 w-3" />
          NEEDS REVIEW (30–59)
        </span>
      );
    case 'Low concern':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#18E6A3]/10 border border-[#18E6A3]/30 text-[#18E6A3] text-[11px] font-mono font-medium tracking-wide">
          <ShieldCheck className="h-3 w-3" />
          LOW CONCERN (0–29)
        </span>
      );
  }
}

function VariationBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    exact_match: { label: 'EXACT MATCH', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
    homoglyph_confusable: { label: 'UNICODE CONFUSABLE / HOMOGLYPH', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' },
    added_keyword: { label: 'ADDED KEYWORDS (SUPPORT / OFFICIAL)', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
    character_transposition: { label: 'ADJACENT TRANSPOSITION', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
    separator_variation: { label: 'SEPARATOR / PUNCTUATION VARIATION', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
    repeated_character: { label: 'REPEATED CHARACTERS', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
    combosquatting: { label: 'COMBOSQUATTING AFFIX', color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
    character_substitution: { label: 'CHARACTER SUBSTITUTION', color: 'text-amber-300 bg-amber-300/10 border-amber-300/30' },
    character_insertion: { label: 'CHARACTER INSERTION', color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
    character_deletion: { label: 'CHARACTER DELETION', color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
    low_similarity: { label: 'LOW SIMILARITY / ORDINARY', color: 'text-slate-400 bg-slate-800/40 border-slate-700' },
  };

  const item = map[type] || { label: type.toUpperCase().replace('_', ' '), color: 'text-slate-400 bg-slate-800 border-slate-700' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-bold border ${item.color}`}>
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
    <div className="space-y-10">
      {/* 1. Header & Context */}
      <div className="space-y-2 border-b border-[rgba(255,255,255,0.08)] pb-5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#18E6A3]">
            DETECTION ENGINE
          </span>
          <span className="text-[#59625F]">/</span>
          <span className="font-mono text-[11px] text-[#8A9390]">
            Look-alike Name Detection & False-Positive Minimization
          </span>
        </div>
        <h2 className="text-[22px] sm:text-[26px] font-normal tracking-tight text-[#F2F4F3]">
          Analyze Brand Name Resemblance
        </h2>
        <p className="text-[13px] text-[#8A9390] max-w-3xl leading-relaxed">
          Evaluates Unicode confusables, character transpositions, added support affixes, and delimiters.
          Prevents false positives by evaluating independent contextual evidence and explicit allowlist registries.
        </p>
      </div>

      {/* 2. Interactive Input Instrument */}
      <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Brand Selector */}
          <div>
            <label className="block text-[11px] font-mono text-[#8A9390] uppercase tracking-wider mb-2">
              Protected Brand Baseline
            </label>
            <div className="relative">
              <select
                value={selectedBrandName}
                onChange={(e) => {
                  setSelectedBrandName(e.target.value);
                  if (assessment) handleRunAnalysis(candidateInput, e.target.value);
                }}
                className="w-full bg-[#080A0B] border border-[rgba(255,255,255,0.12)] rounded-[2px] px-3.5 py-2.5 text-[13px] text-[#F2F4F3] font-mono outline-none focus:border-[#18E6A3] transition-colors appearance-none cursor-pointer"
              >
                {Object.keys(PRESET_BRANDS).map((b) => (
                  <option key={b} value={b} className="bg-[#0D1011] text-[#F2F4F3]">
                    {b} ({PRESET_BRANDS[b].domain})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-[#59625F] pointer-events-none" />
            </div>
          </div>

          {/* Candidate Name Input */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-mono text-[#8A9390] uppercase tracking-wider mb-2">
              Candidate Name or Handle
            </label>
            <input
              type="text"
              value={candidateInput}
              onChange={(e) => setCandidateInput(e.target.value)}
              placeholder="e.g. Paytm Customer Care, Pаytm, @payttm, bike..."
              className="w-full bg-[#080A0B] border border-[rgba(255,255,255,0.12)] rounded-[2px] px-3.5 py-2.5 text-[14px] text-[#F2F4F3] font-mono outline-none focus:border-[#18E6A3] transition-colors"
            />
          </div>
        </div>

        {/* Optional Context Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="inline-flex items-center gap-1.5 text-[12px] font-mono text-[#8A9390] hover:text-[#F2F4F3] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#18E6A3]" />
            <span>{showOptionalFields ? 'Hide' : 'Add'} Optional Platform, Destination & Bio Context</span>
          </button>
        </div>

        {/* Optional Context Fields */}
        {showOptionalFields && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[rgba(255,255,255,0.05)]">
            <div>
              <label className="block text-[11px] font-mono text-[#59625F] uppercase mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3 py-2 text-[12px] text-[#F2F4F3] font-mono outline-none"
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
              <label className="block text-[11px] font-mono text-[#59625F] uppercase mb-1">
                Profile URL / Domain (Optional)
              </label>
              <input
                type="text"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                placeholder="https://paytm-support-verify.xyz"
                className="w-full bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3 py-2 text-[12px] text-[#F2F4F3] font-mono outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#59625F] uppercase mb-1">
                App Developer / Publisher (Optional)
              </label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="e.g. Rogue Developer Ltd"
                className="w-full bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3 py-2 text-[12px] text-[#F2F4F3] font-mono outline-none"
              />
            </div>
          </div>
        )}

        {/* Quick Test Presets & Action Button */}
        <div className="flex flex-col gap-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
          {/* Fictional Demonstration Suite (ApexPay) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono bg-[#07090A] p-2.5 rounded-[2px] border border-[rgba(24,230,163,0.15)]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] bg-[#18E6A3]/10 text-[#18E6A3] font-bold uppercase tracking-wider text-[10px]">
              <Sparkles className="h-3 w-3" /> DEMO MODE: ApexPay (Fictional Brand)
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset('@ApexPay', 'ApexPay')}
              className="px-2 py-0.5 bg-[#14181A] hover:bg-[#1E2326] text-[#18E6A3] rounded-[2px] transition-colors cursor-pointer border border-[#18E6A3]/20"
            >
              1. Official Asset (@ApexPay)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ApexP\u0430y', 'ApexPay')}
              className="px-2 py-0.5 bg-[#14181A] hover:bg-[#1E2326] text-amber-300 rounded-[2px] transition-colors cursor-pointer border border-amber-300/20"
            >
              2. Homoglyph (ApexPаy)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('ApexPay Support Desk', 'ApexPay')}
              className="px-2 py-0.5 bg-[#14181A] hover:bg-[#1E2326] text-orange-300 rounded-[2px] transition-colors cursor-pointer border border-orange-300/20"
            >
              3. Added Words (Support)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Apex_Pay', 'ApexPay')}
              className="px-2 py-0.5 bg-[#14181A] hover:bg-[#1E2326] text-sky-300 rounded-[2px] transition-colors cursor-pointer border border-sky-300/20"
            >
              4. Separator (Apex_Pay)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('Apex Tools & Hardware', 'ApexPay')}
              className="px-2 py-0.5 bg-[#14181A] hover:bg-[#1E2326] text-[#8A9390] hover:text-[#F2F4F3] rounded-[2px] transition-colors cursor-pointer"
            >
              5. Ordinary Business Name
            </button>
          </div>

          {/* Real Brand Benchmarks */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
              <span className="text-[#59625F] mr-1">Live Benchmarks:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('Paytm Support Helpline', 'Paytm')}
                className="px-2 py-1 bg-[#14181A] hover:bg-[#1E2326] text-[#8A9390] hover:text-[#F2F4F3] rounded-[2px] transition-colors cursor-pointer"
              >
                Paytm Support
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('P\u0430ytm Care', 'Paytm')}
                className="px-2 py-1 bg-[#14181A] hover:bg-[#1E2326] text-[#8A9390] hover:text-[#F2F4F3] rounded-[2px] transition-colors cursor-pointer"
              >
                Cyrillic Pаytm
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('Pyatm', 'Paytm')}
                className="px-2 py-1 bg-[#14181A] hover:bg-[#1E2326] text-[#8A9390] hover:text-[#F2F4F3] rounded-[2px] transition-colors cursor-pointer"
              >
                Pyatm Transposition
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('bike', 'Nike')}
                className="px-2 py-1 bg-[#14181A] hover:bg-[#1E2326] text-[#8A9390] hover:text-[#F2F4F3] rounded-[2px] transition-colors cursor-pointer"
              >
                bike (Common Word vs Nike)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('@Paytm', 'Paytm')}
                className="px-2 py-1 bg-[#14181A] hover:bg-[#1E2326] text-[#8A9390] hover:text-[#F2F4F3] rounded-[2px] transition-colors cursor-pointer"
              >
                @Paytm (Official)
              </button>
            </div>

            <button
              type="button"
              disabled={analyzing || !candidateInput.trim()}
              onClick={() => handleRunAnalysis()}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#18E6A3] hover:bg-[#18E6A3]/90 text-[#080A0B] text-[13px] font-semibold rounded-[2px] uppercase font-mono tracking-wider cursor-pointer transition-all disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>EVALUATING...</span>
                </>
              ) : (
                <>
                  <span>ANALYZE CANDIDATE</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live Assessment Results Panel */}
      {assessment && (
        <div className="space-y-8 animate-fadeIn">
          {/* Previous Review Alert if exists */}
          {existingReview && (
            <div className="bg-[#101416] border border-cyan-500/30 rounded-[2px] p-3.5 flex items-start gap-3 text-[12px] font-mono">
              <Bookmark className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <div className="text-cyan-300 font-semibold">
                  Analyst Decision on Record: {existingReview.decision.toUpperCase().replace('_', ' ')}
                </div>
                <div className="text-[#8A9390]">
                  Reviewed by {existingReview.reviewedBy} on {new Date(existingReview.reviewedAt).toLocaleDateString()}
                  {existingReview.notes && ` — Note: "${existingReview.notes}"`}
                </div>
              </div>
            </div>
          )}

          {reviewMessage && (
            <div className="bg-[#18E6A3]/10 border border-[#18E6A3]/30 rounded-[2px] p-3 flex items-center gap-2 text-[12px] font-mono text-[#18E6A3]">
              <Check className="h-4 w-4" />
              <span>{reviewMessage}</span>
            </div>
          )}

          {/* Primary Result Card */}
          <div className="bg-[#0D1011] border border-[rgba(255,255,255,0.08)] rounded-[2px] p-6 space-y-6">
            {/* Top Bar: Matched Brand Baseline + Badges */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#59625F] uppercase">MATCHED BRAND:</span>
                  <span className="text-[15px] font-semibold text-[#F2F4F3] font-mono">
                    {assessment.brandName}
                  </span>
                  <span className="text-[11px] font-mono text-[#8A9390] bg-[#14181A] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.05)]">
                    {activeBrandProfile.domain}
                  </span>
                </div>
                <div className="text-[12px] text-[#8A9390] font-mono">
                  Candidate Target: <span className="text-[#F2F4F3]">"{assessment.candidateName}"</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <VariationBadge type={assessment.variationType} />
                <RiskBandBadge band={assessment.riskBand} />
              </div>
            </div>

            {/* Middle: Distinct Gauges & Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center border-b border-[rgba(255,255,255,0.06)] pb-6">
              {/* Meter 1: Similarity Score (Lexical) */}
              <div className="flex flex-col items-center justify-center p-3 border-r border-[rgba(255,255,255,0.05)] md:col-span-1">
                <ArcMeter
                  score={assessment.similarityScore}
                  label="Name Similarity"
                  color={
                    assessment.similarityScore >= 80
                      ? '#18E6A3'
                      : assessment.similarityScore >= 60
                      ? '#F5B84B'
                      : '#8A9390'
                  }
                />
              </div>

              {/* Meter 2: Contextual Risk Score */}
              <div className="flex flex-col items-center justify-center p-3 border-r border-[rgba(255,255,255,0.05)] md:col-span-1">
                <ArcMeter
                  score={assessment.riskScore}
                  label="Threat Risk Score"
                  color={
                    assessment.riskScore >= 80
                      ? '#FF5C5C'
                      : assessment.riskScore >= 60
                      ? '#F5B84B'
                      : assessment.riskScore >= 30
                      ? '#FCD34D'
                      : '#18E6A3'
                  }
                />
              </div>

              {/* Breakdown metrics in monospace */}
              <div className="md:col-span-2 space-y-2.5 text-[12px] font-mono">
                <div className="flex items-center justify-between text-[#8A9390]">
                  <span>Damerau-Levenshtein Edit Distance:</span>
                  <span className="text-[#F2F4F3] font-bold">
                    {assessment.similarityMetrics.editDistance} edit(s)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8A9390]">
                  <span>Jaro-Winkler Prefix Metric:</span>
                  <span className="text-[#F2F4F3] font-bold">
                    {Math.round(assessment.similarityMetrics.jaroWinklerSimilarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8A9390]">
                  <span>Token Jaccard Word Overlap:</span>
                  <span className="text-[#F2F4F3] font-bold">
                    {Math.round(assessment.similarityMetrics.tokenSimilarity * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8A9390]">
                  <span>Allowlist / Registry Status:</span>
                  <span className={assessment.isAllowlisted ? 'text-[#18E6A3] font-bold' : 'text-[#8A9390]'}>
                    {assessment.isAllowlisted ? 'OFFICIAL ASSET ALLOWLISTED' : 'UNREGISTERED CANDIDATE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Heuristic Notice & Distinct Status Callout */}
            <div className="p-3.5 bg-[#14181A] border border-[rgba(255,255,255,0.06)] rounded-[2px] space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase text-[#F5B84B]">
                <Info className="h-3.5 w-3.5" />
                <span>Heuristic Anti-False-Positive Policy</span>
              </div>
              <p className="text-[12px] text-[#8A9390] leading-relaxed">
                {assessment.summaryPhrase}
              </p>
              <p className="text-[11px] text-[#59625F] font-mono">
                {assessment.heuristicNotice}
              </p>
            </div>

            {/* Itemized Evidence & Contributing Signals */}
            <div className="space-y-3">
              <h3 className="font-mono text-[12px] uppercase tracking-wider text-[#F2F4F3] font-semibold">
                Contributing Signals & Forensic Evidence
              </h3>

              <div className="space-y-2">
                {assessment.contributions.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-[#080A0B] border border-[rgba(255,255,255,0.06)] rounded-[2px] flex items-start justify-between gap-3 text-[12px]"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#8A9390] uppercase">
                          [{c.category.replace('_', ' ')}]
                        </span>
                        <span className="text-[#F2F4F3] font-medium">{c.description}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-cyan-400 font-bold shrink-0">
                      +{c.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review and Feedback Decision Action Bar */}
            <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#8A9390]">
                  Analyst Review & Feedback Action
                </span>
                <span className="text-[11px] font-mono text-[#59625F]">
                  Records decision in SAFENET database & updates allowlist
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Optional analyst review notes..."
                  className="flex-1 w-full bg-[#080A0B] border border-[rgba(255,255,255,0.08)] rounded-[2px] px-3.5 py-2 text-[12px] text-[#F2F4F3] font-mono outline-none focus:border-[rgba(255,255,255,0.25)]"
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('legitimate')}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#18E6A3]/10 hover:bg-[#18E6A3]/20 border border-[#18E6A3]/30 text-[#18E6A3] text-[12px] font-mono font-medium rounded-[2px] transition-colors cursor-pointer"
                  >
                    Mark Legitimate
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('suspicious')}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[12px] font-mono font-medium rounded-[2px] transition-colors cursor-pointer"
                  >
                    Mark Suspicious
                  </button>

                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => handleRecordReview('confirmed_impersonation')}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#FF5C5C]/10 hover:bg-[#FF5C5C]/20 border border-[#FF5C5C]/30 text-[#FF5C5C] text-[12px] font-mono font-medium rounded-[2px] transition-colors cursor-pointer"
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
