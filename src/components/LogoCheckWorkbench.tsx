'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck,
  Info,
  Clock,
  PlusCircle,
} from 'lucide-react';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { LogoAnalysisReport, EvaluatedLogoCandidate } from '@/lib/logo-detector/logo-orchestrator';

interface LogoCheckWorkbenchProps {
  onPromoteIncident?: (candidate: EvaluatedLogoCandidate) => void;
}

export default function LogoCheckWorkbench({ onPromoteIncident }: LogoCheckWorkbenchProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [report, setReport] = useState<LogoAnalysisReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scanStages = [
    'Validating image signature & magic bytes',
    'Extracting typography & visual cues (Gemini Vision)',
    'Querying reverse image search engine (Google Lens)',
    'Downloading thumbnails via SSRF-safe gateway',
    'Calculating dHash distance & color histograms',
    'Classifying candidates against Brand Baseline',
  ];

  const handleFileSelection = (file: File) => {
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMessage(`Selected image exceeds the 4 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Please choose a valid PNG, JPEG, or WebP image.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setReport(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const executeLogoScan = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setErrorMessage(null);
    setReport(null);
    setCurrentStageIndex(0);

    // Staged progress ticker
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < scanStages.length - 1) return prev + 1;
        return prev;
      });
    }, 900);

    try {
      const activeBrand = BrandStore.getBrand() || PRESET_BRANDS['Paytm'];
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('brandName', activeBrand.name);
      formData.append('brandDomain', activeBrand.domain);

      const res = await fetch('/api/logo/search', {
        method: 'POST',
        body: formData,
      });

      clearInterval(interval);
      setCurrentStageIndex(scanStages.length - 1);

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to complete logo verification analysis.');
      } else {
        setReport(data.report);
      }
    } catch (err: any) {
      clearInterval(interval);
      setErrorMessage(`Network error during scan: ${err?.message || err}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePromote = (cand: EvaluatedLogoCandidate) => {
    setPromotedIds((prev) => new Set([...prev, cand.id]));

    // Store in localStorage incidents
    try {
      const existing = JSON.parse(localStorage.getItem('safenet_incidents') || '[]');
      const newIncident = {
        id: `inc_logo_${Date.now()}`,
        target: cand.domain,
        url: cand.sourceUrl,
        type: 'logo_impersonation',
        severity: cand.riskScore >= 75 ? 'critical' : cand.riskScore >= 50 ? 'high' : 'medium',
        score: cand.riskScore,
        status: 'open',
        title: `Visual Lookalike on ${cand.domain}`,
        detectedAt: new Date().toISOString(),
        details: {
          similarityScore: cand.similarityScore,
          signals: cand.signals,
          reasons: cand.reasons,
          thumbnailUrl: cand.thumbnailUrl,
        },
      };
      localStorage.setItem('safenet_incidents', JSON.stringify([newIncident, ...existing]));
    } catch {
      // Local storage fallback
    }

    if (onPromoteIncident) {
      onPromoteIncident(cand);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload & Dropzone Area */}
      <div className="bg-[#121619] border border-[#262C30] rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          {/* Dropzone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[190px] ${
              isDragging
                ? 'border-[#00F5A0] bg-[#00F5A0]/5'
                : 'border-[#262C30] hover:border-[#00F5A0]/50 bg-[#161B1E]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
            />

            <div className="p-3 bg-[#1C2226] border border-[#2E373B] rounded-full text-[#00F5A0] mb-3 shadow-inner">
              <UploadCloud className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-[#F0F6FC] mb-1">
              Drag & Drop brand artwork or <span className="text-[#00F5A0] hover:underline">browse file</span>
            </p>
            <p className="text-xs text-[#8B949E]">
              Supports PNG, JPG, WebP • Max 4 MB • Strips EXIF metadata automatically
            </p>
          </div>

          {/* Preview & Action Panel */}
          {selectedFile && previewUrl && (
            <div className="w-full md:w-80 bg-[#161B1E] border border-[#262C30] rounded-xl p-4 flex flex-col items-center text-center">
              <div className="relative w-28 h-28 bg-[#0D1117] border border-[#2E373B] rounded-lg overflow-hidden flex items-center justify-center p-2 mb-3 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Selected Logo Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <span className="font-mono text-xs text-[#F0F6FC] font-medium truncate max-w-[240px] mb-1">
                {selectedFile.name}
              </span>
              <span className="text-[11px] text-[#8B949E] mb-4">
                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type.split('/')[1]?.toUpperCase()}
              </span>

              <button
                type="button"
                onClick={executeLogoScan}
                disabled={analyzing}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-[#0A0D0F] font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-[#00F5A0]/20 hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Visuals...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Scan Logo Similarity
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-[#FF3366]/10 border border-[#FF3366]/30 rounded-lg flex items-center gap-3 text-xs text-[#FF85A2]">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FF3366]" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Progress Stages */}
      {analyzing && (
        <div className="bg-[#121619] border border-[#262C30] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8B949E] flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#00F5A0] animate-spin" />
              Perceptual Intelligence & Reverse Search Pipeline
            </h4>
            <span className="text-xs font-mono text-[#00F5A0]">
              Step {currentStageIndex + 1} of {scanStages.length}
            </span>
          </div>

          <div className="w-full bg-[#1C2226] h-1.5 rounded-full overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] h-full transition-all duration-700"
              style={{ width: `${((currentStageIndex + 1) / scanStages.length) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {scanStages.map((stage, idx) => {
              const isDone = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stage}
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${
                    isDone
                      ? 'bg-[#00F5A0]/5 border-[#00F5A0]/30 text-[#F0F6FC]'
                      : isCurrent
                      ? 'bg-[#1C2226] border-[#00F5A0] text-[#00F5A0] shadow-sm'
                      : 'bg-[#161B1E]/40 border-[#262C30] text-[#59625F]'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-[#00F5A0] shrink-0" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-4 h-4 text-[#00F5A0] animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-[#59625F] shrink-0" />
                  )}
                  <span className="leading-snug">{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {report && !analyzing && (
        <div className="space-y-6">
          {/* Summary & Gemini Insights Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vision Insight Box */}
            <div className="md:col-span-2 bg-[#121619] border border-[#262C30] rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#00D9F5]">
                  <Sparkles className="w-4 h-4" />
                  Gemini Vision Typography & Feature Extraction
                </div>
                {report.geminiVision.status === 'SUCCESS' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/20">
                    Live Vision OCR
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#8B949E]/10 text-[#8B949E] border border-[#8B949E]/20">
                    Not Configured
                  </span>
                )}
              </div>

              {report.geminiVision.status === 'SUCCESS' ? (
                <div className="space-y-2 text-xs text-[#8B949E]">
                  {report.geminiVision.extractedText && (
                    <div className="flex items-start gap-2">
                      <span className="font-mono text-[#F0F6FC] font-semibold shrink-0">Extracted Text:</span>
                      <span className="font-mono px-2 py-0.5 rounded bg-[#1C2226] text-[#00F5A0]">
                        &quot;{report.geminiVision.extractedText}&quot;
                      </span>
                    </div>
                  )}
                  {report.geminiVision.visualDescription && (
                    <p className="leading-relaxed">
                      <span className="font-semibold text-[#F0F6FC]">Visual Elements: </span>
                      {report.geminiVision.visualDescription}
                    </p>
                  )}
                  {report.geminiVision.detectedColors.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="font-semibold text-[#F0F6FC]">Dominant Colors:</span>
                      <div className="flex gap-1.5">
                        {report.geminiVision.detectedColors.map((color) => (
                          <span
                            key={color}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1C2226] text-[#C9D1D9] border border-[#2E373B]"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#8B949E] leading-relaxed">
                  {report.geminiVision.explanation}
                </p>
              )}
            </div>

            {/* Provider Status & SHA-256 Info */}
            <div className="bg-[#121619] border border-[#262C30] rounded-xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8B949E] block mb-1">
                  Reverse Image Provider
                </span>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-[#F0F6FC]">
                    {report.providerStatus.provider === 'serpapi_google_lens' ? 'Google Lens (SerpAPI)' : 'Provider Engine'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                      report.providerStatus.status === 'SUCCESS'
                        ? 'bg-[#00F5A0]/10 text-[#00F5A0]'
                        : 'bg-[#F5B84B]/10 text-[#F5B84B]'
                    }`}
                  >
                    {report.providerStatus.status}
                  </span>
                </div>
                {report.providerStatus.message && (
                  <p className="text-[11px] text-[#8B949E] leading-tight mb-2">
                    {report.providerStatus.message}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[#262C30] text-[10px] font-mono text-[#59625F] flex items-center justify-between">
                <span>SHA-256: {report.imageHash.slice(0, 10)}...</span>
                <span>{report.durationMs}ms</span>
              </div>
            </div>
          </div>

          {/* Candidates Header */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-sm font-bold text-[#F0F6FC] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#00F5A0]" />
              Reverse Image Matches & Trademark Lookalike Analysis
              <span className="text-xs font-mono font-normal text-[#8B949E]">
                ({report.summary.totalCandidates} candidates indexed)
              </span>
            </h3>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/20">
                {report.summary.officialCount} Official
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/20">
                {report.summary.lookalikeCount} Lookalikes
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#8B949E]/10 text-[#8B949E] border border-[#8B949E]/20">
                {report.summary.unknownCount} Unknown
              </span>
            </div>
          </div>

          {/* Candidate Result Cards */}
          {report.candidates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.candidates.map((cand) => {
                const isPromoted = promotedIds.has(cand.id);

                return (
                  <div
                    key={cand.id}
                    className={`bg-[#121619] border rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-[#384247] ${
                      cand.classification === 'OFFICIAL'
                        ? 'border-[#00F5A0]/30 hover:border-[#00F5A0]/60'
                        : cand.classification === 'POSSIBLE_LOOKALIKE'
                        ? 'border-[#FF3366]/30 hover:border-[#FF3366]/60 bg-[#161B1E]'
                        : 'border-[#262C30]'
                    }`}
                  >
                    <div>
                      {/* Top Header with Classification Chip */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          {/* Candidate Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-[#0D1117] border border-[#262C30] overflow-hidden flex items-center justify-center shrink-0 p-1">
                            {cand.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={cand.thumbnailUrl}
                                alt={cand.title || 'Candidate icon'}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  // Fallback icon on broken image
                                  (e.target as any).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-[#59625F]" />
                            )}
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-[#F0F6FC] leading-snug line-clamp-1">
                              {cand.name || cand.title || cand.domain}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
                              <span className="font-mono text-[#00D9F5]">{cand.domain}</span>
                              {cand.sourceUrl && (
                                <a
                                  href={cand.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Classification Chip */}
                        {cand.classification === 'OFFICIAL' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 flex items-center gap-1 shrink-0">
                            <ShieldCheck className="w-3 h-3" />
                            Official
                          </span>
                        )}
                        {cand.classification === 'POSSIBLE_LOOKALIKE' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/30 flex items-center gap-1 shrink-0">
                            <ShieldAlert className="w-3 h-3" />
                            Possible Lookalike
                          </span>
                        )}
                        {cand.classification === 'UNKNOWN' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#8B949E]/10 text-[#8B949E] border border-[#8B949E]/30 flex items-center gap-1 shrink-0">
                            <HelpCircle className="w-3 h-3" />
                            Unknown
                          </span>
                        )}
                      </div>

                      {/* Similarity & Risk Progress Bar */}
                      <div className="space-y-1.5 mb-3 bg-[#161B1E] p-3 rounded-lg border border-[#262C30]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#8B949E]">Visual Perceptual Similarity:</span>
                          <span className="font-mono font-bold text-[#F0F6FC]">
                            {cand.similarityScore}%
                          </span>
                        </div>
                        <div className="w-full bg-[#0D1117] h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cand.similarityScore >= 75
                                ? 'bg-[#FF3366]'
                                : cand.similarityScore >= 50
                                ? 'bg-[#F5B84B]'
                                : 'bg-[#00F5A0]'
                            }`}
                            style={{ width: `${cand.similarityScore}%` }}
                          />
                        </div>

                        {cand.similarityMetrics && (
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#59625F] pt-1">
                            <span>dHash Dist: {cand.similarityMetrics.dHashDistance}/64</span>
                            <span>Color Match: {(cand.similarityMetrics.colorSimilarity * 100).toFixed(0)}%</span>
                          </div>
                        )}
                      </div>

                      {/* Signals & Evidence Reasons */}
                      <div className="space-y-1 mb-4">
                        {cand.reasons.map((reason, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#8B949E]">
                            <span className="text-[#00F5A0] mt-0.5 font-bold">•</span>
                            <span className="leading-tight">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#262C30]">
                      <span className="text-xs font-mono font-semibold">
                        Risk Score:{' '}
                        <span
                          className={
                            cand.riskScore >= 75
                              ? 'text-[#FF3366]'
                              : cand.riskScore >= 40
                              ? 'text-[#F5B84B]'
                              : 'text-[#00F5A0]'
                          }
                        >
                          {cand.riskScore}/100
                        </span>
                      </span>

                      {cand.classification !== 'OFFICIAL' && (
                        <button
                          type="button"
                          onClick={() => handlePromote(cand)}
                          disabled={isPromoted}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isPromoted
                              ? 'bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 cursor-default'
                              : 'bg-[#1C2226] hover:bg-[#262C30] text-[#F0F6FC] border border-[#2E373B]'
                          }`}
                        >
                          {isPromoted ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Promoted to Incident
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5" />
                              Promote to Incident
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#121619] border border-[#262C30] rounded-xl p-8 text-center text-[#8B949E]">
              <FileCheck className="w-8 h-8 text-[#59625F] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#F0F6FC] mb-1">
                No active lookalikes or reverse image matches found
              </p>
              <p className="text-xs">
                {report.providerStatus.status === 'NOT_CONFIGURED'
                  ? 'Reverse image provider is currently in offline mode. Configure SERPAPI_API_KEY to search Google Lens live.'
                  : 'No unauthorized visual duplicates detected across public search indices.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
