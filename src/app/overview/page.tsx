'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronRight,
  Search,
  Radio,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile, ThreatItem } from '@/types/brand';

export default function OverviewPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [timeRange, setTimeRange] = useState<'24H' | '7D' | '30D'>('24H');
  const [investigationsCount, setInvestigationsCount] = useState(0);

  useEffect(() => {
    const currentBrand = BrandStore.getBrand() || PRESET_BRANDS['Paytm'];
    setBrand(currentBrand);
    const threatList = BrandStore.getThreats();
    setThreats(threatList);
    setInvestigationsCount(BrandStore.getInvestigations().length);

    const handleStorage = () => {
      setBrand(BrandStore.getBrand());
      setThreats(BrandStore.getThreats());
      setInvestigationsCount(BrandStore.getInvestigations().length);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Compute honest severity counts from actual data
  const criticalCount = threats.filter((t) => t.riskScore >= 80 || t.riskLevel === 'CRITICAL').length;
  const highCount = threats.filter((t) => (t.riskScore >= 60 && t.riskScore < 80) || t.riskLevel === 'HIGH').length;
  const mediumCount = threats.filter((t) => (t.riskScore >= 30 && t.riskScore < 60) || t.riskLevel === 'MEDIUM').length;
  const lowCount = threats.filter((t) => t.riskScore < 30 || t.riskLevel === 'LOW').length;

  const totalDetected = threats.length;
  const needsAttention = criticalCount + highCount;

  // Compute active campaign clusters from actual data
  const campaignsCount = threats.length > 0
    ? (new Set(threats.map((t) => t.campaignId).filter(Boolean)).size || 1)
    : 0;

  // Compute dynamic hourly velocity from actual timestamps
  const hourlyActivity = React.useMemo(() => {
    const buckets = new Array(24).fill(0);
    if (threats.length === 0) return buckets;
    threats.forEach((t) => {
      try {
        const hour = new Date(t.discoveredAt).getUTCHours();
        if (hour >= 0 && hour < 24) buckets[hour]++;
      } catch {
        buckets[12]++;
      }
    });
    return buckets;
  }, [threats]);

  const maxHourly = Math.max(1, ...hourlyActivity);

  // Priority queue items requiring attention
  const priorityQueue = threats.slice(0, 5);

  return (
    <AppShell
      pageEyebrow="Radar Overview & Executive Telemetry"
      pageTitle="Radar Overview"
      pageSubtitle={`Global digital risk and social perimeter telemetry for ${brand?.name || 'Paytm'} • Live radar ingestion`}
    >
      <div className="space-y-8 pb-14">
        {/* ========================================================================= */}
        {/* 1. TOP BAR: TIME FILTER + CLOUDFLARE RADAR TELEMETRY CONTROLS             */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2638] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F6821F]/15 border border-[#F6821F]/30 text-[#F6821F] text-xs font-semibold font-sans uppercase tracking-wider">
                <Radio className="h-3 w-3 text-[#F6821F] animate-pulse" />
                LIVE RADAR TELEMETRY
              </span>
              <span className="text-[#1E2638]">/</span>
              <span className="text-sm text-slate-300 font-sans font-normal">
                {brand?.name || 'Paytm'} Perimeter Active
              </span>
            </div>

            {/* Action buttons & Time range selector */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/check"
                className="button-text px-3.5 py-1.5 bg-[#F6821F] hover:bg-[#FA8B28] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm inline-flex items-center gap-1.5 transition-all cursor-pointer font-sans"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Quick Check</span>
              </Link>

              <div className="flex items-center bg-[#0E131F] border border-[#1E2638] rounded-lg p-0.5 text-xs font-medium font-sans">
                {(['24H', '7D', '30D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer font-sans ${
                      timeRange === r
                        ? 'bg-[#F6821F] text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RADAR KPI METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 space-y-1.5 hover:border-pink-500/40 hover:bg-[#1C1344] transition-all shadow-lg">
              <div className="stat-label text-slate-400 font-sans text-xs uppercase tracking-wider font-semibold">
                Detected Candidates
              </div>
              <div className="stat-value text-3xl sm:text-4xl font-bold font-mono text-white leading-tight tabular-nums tracking-tight">
                {totalDetected}
              </div>
              <div className="small-text text-xs text-pink-400 font-sans font-normal flex items-center gap-1.5 pt-2 border-t border-purple-900/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EC4899]" />
                {totalDetected > 0 ? `${totalDetected} active candidates` : 'Perimeter nominal'}
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-4 space-y-1.5 hover:border-rose-500/50 hover:bg-[#1C1344] transition-all shadow-lg">
              <div className="stat-label text-slate-400 font-sans text-xs uppercase tracking-wider font-semibold">
                Needs Attention
              </div>
              <div className="stat-value text-3xl sm:text-4xl font-bold font-mono text-rose-400 leading-tight tabular-nums tracking-tight">
                {needsAttention}
              </div>
              <div className="small-text text-xs text-rose-400 font-sans font-normal flex items-center gap-1.5 pt-2 border-t border-purple-900/30">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                High / Critical priority
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 space-y-1.5 hover:border-amber-500/50 hover:bg-[#1C1344] transition-all shadow-lg">
              <div className="stat-label text-slate-400 font-sans text-xs uppercase tracking-wider font-semibold">
                Active Investigations
              </div>
              <div className="stat-value text-3xl sm:text-4xl font-bold font-mono text-amber-400 leading-tight tabular-nums tracking-tight">
                {investigationsCount}
              </div>
              <div className="small-text text-xs text-amber-400 font-sans font-normal flex items-center gap-1.5 pt-2 border-t border-purple-900/30">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Persisted forensic cases
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-4 space-y-1.5 hover:border-sky-500/50 hover:bg-[#1C1344] transition-all shadow-lg">
              <div className="stat-label text-slate-400 font-sans text-xs uppercase tracking-wider font-semibold">
                Campaign Clusters
              </div>
              <div className="stat-value text-3xl sm:text-4xl font-bold font-mono text-sky-400 leading-tight tabular-nums tracking-tight">
                {campaignsCount}
              </div>
              <div className="small-text text-xs text-sky-400 font-sans font-normal flex items-center gap-1.5 pt-2 border-t border-purple-900/30">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                Correlated threat hubs
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SPLIT ANALYTICAL REGION: VELOCITY GRAPH + RISK DISTRIBUTION             */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 8 COLS: THREAT ACTIVITY VELOCITY (HOURLY) */}
          <div className="lg:col-span-8 bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-baseline justify-between border-b border-purple-900/40 pb-3">
              <div className="space-y-0.5">
                <span className="eyebrow-text text-xs font-semibold uppercase tracking-wider text-purple-300 font-sans">
                  RADAR TEMPORAL SIGNALS
                </span>
                <h3 className="card-title text-base sm:text-lg font-semibold font-display text-white">
                  Threat Activity Velocity
                </h3>
              </div>
              <span className="small-text text-xs text-slate-400 font-sans">Interval: 60m UTC</span>
            </div>

            {/* Analytical density bar graph */}
            <div className="space-y-3 font-sans">
              <div className="h-40 flex items-end gap-1.5 pt-3 px-1">
                {hourlyActivity.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        val > 2 ? 'bg-[#FF4D4D]' : val > 0 ? 'bg-[#F6821F]' : 'bg-[#111625]'
                      } group-hover:bg-[#2C7BE5]`}
                      style={{ height: val > 0 ? `${Math.max(18, (val / maxHourly) * 100)}%` : '5px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-slate-400 text-xs pt-3 border-t border-[#1E2638] font-mono tabular-nums">
                <span>00:00 UTC</span>
                <span>06:00 UTC</span>
                <span>12:00 UTC</span>
                <span>18:00 UTC</span>
                <span className="text-[#F6821F] font-medium font-sans">Now</span>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: RISK SEVERITY DISTRIBUTION */}
          <div className="lg:col-span-4 bg-[#0E131F] border border-[#1E2638] rounded-xl p-5 space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-3">
              <div className="space-y-0.5">
                <span className="eyebrow-text text-xs font-sans font-semibold uppercase tracking-wider text-[#F6821F]">
                  SEVERITY COMPOSITION
                </span>
                <h3 className="card-title text-base sm:text-lg font-semibold font-display text-white">
                  Risk Distribution
                </h3>
              </div>
              <span className="data-text text-xs font-mono text-slate-400 tabular-nums">N = {totalDetected}</span>
            </div>

            <div className="space-y-3.5 font-sans">
              {/* Critical */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#FF4D4D] font-semibold">CRITICAL</span>
                  <span className="text-white font-mono text-xs tabular-nums font-medium">
                    {criticalCount} ({totalDetected > 0 ? Math.round((criticalCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#111625] h-2 rounded-full overflow-hidden border border-[#1E2638]">
                  <div
                    className="bg-[#FF4D4D] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(criticalCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* High */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#F6821F] font-semibold">HIGH</span>
                  <span className="text-white font-mono text-xs tabular-nums font-medium">
                    {highCount} ({totalDetected > 0 ? Math.round((highCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#111625] h-2 rounded-full overflow-hidden border border-[#1E2638]">
                  <div
                    className="bg-[#F6821F] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(highCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#FBBF24] font-semibold">MEDIUM</span>
                  <span className="text-white font-mono text-xs tabular-nums font-medium">
                    {mediumCount} ({totalDetected > 0 ? Math.round((mediumCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#111625] h-2 rounded-full overflow-hidden border border-[#1E2638]">
                  <div
                    className="bg-[#FBBF24] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(mediumCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#2C7BE5] font-semibold">LOW</span>
                  <span className="text-white font-mono text-xs tabular-nums font-medium">
                    {lowCount} ({totalDetected > 0 ? Math.round((lowCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#111625] h-2 rounded-full overflow-hidden border border-[#1E2638]">
                  <div
                    className="bg-[#2C7BE5] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(lowCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PRIORITY DETECTIONS TABLE (CLOUDFLARE RADAR FORMAT)                    */}
        {/* ========================================================================= */}
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-3">
            <div className="space-y-0.5">
              <span className="eyebrow-text text-xs font-sans font-semibold uppercase tracking-wider text-[#F6821F]">
                RADAR TRIAGE QUEUE
              </span>
              <h3 className="card-title text-base sm:text-lg font-semibold font-display text-white">
                Priority Detections
              </h3>
            </div>
            <Link
              href="/incidents"
              className="button-text text-xs sm:text-sm font-semibold text-[#F6821F] hover:underline transition-colors inline-flex items-center gap-1 font-sans"
            >
              <span>All Incidents ({threats.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm font-sans">
              <thead>
                <tr className="border-b border-[#1E2638] text-slate-400 text-xs uppercase tracking-wider font-sans font-semibold">
                  <th className="py-2.5 pr-3">Severity</th>
                  <th className="py-2.5 px-3">Target Asset</th>
                  <th className="py-2.5 px-3">Vector</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Discovered</th>
                  <th className="py-2.5 pl-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]">
                {priorityQueue.length > 0 ? (
                  priorityQueue.map((threat) => (
                    <tr key={threat.id} className="group hover:bg-[#111625] transition-colors">
                      <td className="py-3 pr-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-semibold uppercase tracking-wider border ${
                            threat.riskScore >= 80
                              ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/35'
                              : threat.riskScore >= 50
                              ? 'bg-[#F6821F]/15 text-[#F6821F] border-[#F6821F]/35'
                              : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/35'
                          }`}
                        >
                          {threat.riskScore >= 80 ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs sm:text-sm text-white font-medium">
                        {threat.targetAsset}
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-xs font-sans">
                        {threat.type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs sm:text-sm text-white tabular-nums font-semibold">
                        {threat.riskScore} <span className="text-slate-400 text-[11px] font-normal">/ 100</span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-400 font-mono tabular-nums">
                        {new Date(threat.discoveredAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <Link
                          href={`/threat/${threat.id}`}
                          className="button-text text-xs sm:text-sm font-semibold text-[#F6821F] hover:underline transition-colors inline-flex items-center gap-1 group-hover:translate-x-0.5 font-sans"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-sm font-sans">
                      No digital impersonation entities currently detected for {brand?.name || 'this brand'}.{' '}
                      <Link href="/check" className="text-[#F6821F] hover:underline ml-1 font-semibold">
                        Run a check to discover candidates →
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
