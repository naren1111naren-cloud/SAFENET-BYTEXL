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
      pageTitle="Radar Overview"
      pageSubtitle={`Global digital risk and social perimeter telemetry for ${brand?.name || 'Paytm'} • Live radar ingestion`}
    >
      <div className="space-y-10 pb-16">
        {/* ========================================================================= */}
        {/* 1. TOP BAR: TIME FILTER + CLOUDFLARE RADAR TELEMETRY CONTROLS             */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2638] pb-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F6821F]/15 border border-[#F6821F]/35 text-[#F6821F] text-[14px] font-bold font-mono">
                <Radio className="h-3.5 w-3.5 text-[#F6821F] animate-pulse" />
                LIVE RADAR TELEMETRY
              </span>
              <span className="text-[#1E2638]">/</span>
              <span className="text-[17px] text-[#FFFFFF] font-bold">
                {brand?.name || 'Paytm'} Perimeter Active
              </span>
            </div>

            {/* Action buttons & Time range selector */}
            <div className="flex items-center gap-3">
              <Link
                href="/check"
                className="px-4 py-2 bg-[#F6821F] hover:bg-[#FA8B28] text-[#FFFFFF] font-bold text-[16px] rounded-lg shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Quick Check</span>
              </Link>

              <div className="flex items-center bg-[#0E131F] border border-[#1E2638] rounded-lg p-1 text-[15px] font-bold">
                {(['24H', '7D', '30D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3.5 py-1 rounded-md transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-[#F6821F] text-[#FFFFFF] font-bold'
                        : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CLOUDFLARE RADAR KPI METRICS: Clean dark cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Metric 1 */}
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-5 space-y-2 hover:border-[#28334E] hover:bg-[#111625] transition-all">
              <div className="text-[15px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                Detected Candidates
              </div>
              <div className="text-[44px] sm:text-[48px] font-extrabold text-[#FFFFFF] leading-none tabular-nums tracking-tight">
                {totalDetected}
              </div>
              <div className="text-[14px] text-[#F6821F] font-bold flex items-center gap-2 pt-2 border-t border-[#1E2638]">
                <span className="h-2 w-2 rounded-full bg-[#F6821F]" />
                {totalDetected > 0 ? `${totalDetected} active candidates` : 'Perimeter nominal'}
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-5 space-y-2 hover:border-[#28334E] hover:bg-[#111625] transition-all">
              <div className="text-[15px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                Needs Attention
              </div>
              <div className="text-[44px] sm:text-[48px] font-extrabold text-[#FF4D4D] leading-none tabular-nums tracking-tight">
                {needsAttention}
              </div>
              <div className="text-[14px] text-[#FF4D4D] font-bold flex items-center gap-2 pt-2 border-t border-[#1E2638]">
                <span className="h-2 w-2 rounded-full bg-[#FF4D4D]" />
                High / Critical priority
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-5 space-y-2 hover:border-[#28334E] hover:bg-[#111625] transition-all">
              <div className="text-[15px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                Active Investigations
              </div>
              <div className="text-[44px] sm:text-[48px] font-extrabold text-[#FBBF24] leading-none tabular-nums tracking-tight">
                {investigationsCount}
              </div>
              <div className="text-[14px] text-[#FBBF24] font-bold flex items-center gap-2 pt-2 border-t border-[#1E2638]">
                <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
                Persisted forensic cases
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-5 space-y-2 hover:border-[#28334E] hover:bg-[#111625] transition-all">
              <div className="text-[15px] text-[#9CA3AF] uppercase font-bold tracking-wider">
                Campaign Clusters
              </div>
              <div className="text-[44px] sm:text-[48px] font-extrabold text-[#2C7BE5] leading-none tabular-nums tracking-tight">
                {campaignsCount}
              </div>
              <div className="text-[14px] text-[#2C7BE5] font-bold flex items-center gap-2 pt-2 border-t border-[#1E2638]">
                <span className="h-2 w-2 rounded-full bg-[#2C7BE5]" />
                Correlated threat hubs
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SPLIT ANALYTICAL REGION: VELOCITY GRAPH + RISK DISTRIBUTION             */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 8 COLS: THREAT ACTIVITY VELOCITY (HOURLY) */}
          <div className="lg:col-span-8 bg-[#0E131F] border border-[#1E2638] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
              <div className="space-y-1">
                <span className="text-[13px] font-mono font-bold uppercase tracking-wider text-[#F6821F]">
                  RADAR TEMPORAL SIGNALS
                </span>
                <h3 className="text-[22px] font-bold text-[#FFFFFF]">
                  Threat Activity Velocity
                </h3>
              </div>
              <span className="text-[15px] font-mono text-[#9CA3AF] font-bold">Interval: 60m UTC</span>
            </div>

            {/* Analytical density bar graph */}
            <div className="space-y-4 font-sans">
              <div className="h-44 flex items-end gap-2 pt-4 px-2">
                {hourlyActivity.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        val > 2 ? 'bg-[#FF4D4D]' : val > 0 ? 'bg-[#F6821F]' : 'bg-[#111625]'
                      } group-hover:bg-[#2C7BE5]`}
                      style={{ height: val > 0 ? `${Math.max(18, (val / maxHourly) * 100)}%` : '6px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[#9CA3AF] text-[14px] pt-4 border-t border-[#1E2638] font-mono font-bold">
                <span>00:00 UTC</span>
                <span>06:00 UTC</span>
                <span>12:00 UTC</span>
                <span>18:00 UTC</span>
                <span className="text-[#F6821F] font-bold">Now</span>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: RISK SEVERITY DISTRIBUTION */}
          <div className="lg:col-span-4 bg-[#0E131F] border border-[#1E2638] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
              <div className="space-y-1">
                <span className="text-[13px] font-mono font-bold uppercase tracking-wider text-[#F6821F]">
                  SEVERITY COMPOSITION
                </span>
                <h3 className="text-[22px] font-bold text-[#FFFFFF]">
                  Risk Distribution
                </h3>
              </div>
              <span className="text-[15px] font-mono text-[#9CA3AF] font-bold">N = {totalDetected}</span>
            </div>

            <div className="space-y-4">
              {/* Critical */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[15px] font-bold">
                  <span className="text-[#FF4D4D]">CRITICAL</span>
                  <span className="text-[#FFFFFF] font-mono tabular-nums">
                    {criticalCount} ({totalDetected > 0 ? Math.round((criticalCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#111625] h-2.5 rounded-full overflow-hidden border border-[#1E2638]">
                  <div
                    className="bg-[#FF4D4D] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(criticalCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* High */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[15px] font-bold">
                  <span className="text-[#F6821F]">HIGH</span>
                  <span className="text-[#FFFFFF] font-mono tabular-nums">
                    {highCount} ({totalDetected > 0 ? Math.round((highCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#111625] h-2.5 rounded-full overflow-hidden border border-[#1E2638]">
                  <div
                    className="bg-[#F6821F] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(highCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[15px] font-bold">
                  <span className="text-[#FBBF24]">MEDIUM</span>
                  <span className="text-[#FFFFFF] font-mono tabular-nums">
                    {mediumCount} ({totalDetected > 0 ? Math.round((mediumCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#111625] h-2.5 rounded-full overflow-hidden border border-[#1E2638]">
                  <div
                    className="bg-[#FBBF24] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(mediumCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[15px] font-bold">
                  <span className="text-[#2C7BE5]">LOW</span>
                  <span className="text-[#FFFFFF] font-mono tabular-nums">
                    {lowCount} ({totalDetected > 0 ? Math.round((lowCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#111625] h-2.5 rounded-full overflow-hidden border border-[#1E2638]">
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
        <section className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-6 sm:p-7 space-y-6">
          <div className="flex items-baseline justify-between border-b border-[#1E2638] pb-4">
            <div className="space-y-1">
              <span className="text-[13px] font-mono font-bold uppercase tracking-wider text-[#F6821F]">
                RADAR TRIAGE QUEUE
              </span>
              <h3 className="text-[22px] font-bold text-[#FFFFFF]">
                Priority Detections
              </h3>
            </div>
            <Link
              href="/incidents"
              className="text-[16px] font-bold text-[#F6821F] hover:underline transition-colors inline-flex items-center gap-1.5"
            >
              <span>All Incidents ({threats.length})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[17px]">
              <thead>
                <tr className="border-b border-[#1E2638] text-[#9CA3AF] font-bold text-[14px] uppercase tracking-wider font-mono">
                  <th className="py-3.5 pr-4">Severity</th>
                  <th className="py-3.5 px-4">Target Asset</th>
                  <th className="py-3.5 px-4">Vector</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Discovered</th>
                  <th className="py-3.5 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2638]">
                {priorityQueue.length > 0 ? (
                  priorityQueue.map((threat) => (
                    <tr key={threat.id} className="group hover:bg-[#111625] transition-colors">
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-[12px] font-mono font-bold uppercase border ${
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
                      <td className="py-4 px-4 font-mono text-[16px] font-bold text-[#FFFFFF]">
                        {threat.targetAsset}
                      </td>
                      <td className="py-4 px-4 text-[#9CA3AF] text-[15px] uppercase font-mono font-bold">
                        {threat.type.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-4 font-mono text-[16px] font-bold text-[#FFFFFF] tabular-nums">
                        {threat.riskScore} <span className="text-[#9CA3AF] text-[13px]">/ 100</span>
                      </td>
                      <td className="py-4 px-4 text-[15px] text-[#9CA3AF] font-bold">
                        {new Date(threat.discoveredAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <Link
                          href={`/threat/${threat.id}`}
                          className="text-[15px] font-bold text-[#F6821F] hover:underline transition-colors inline-flex items-center gap-1.5 group-hover:translate-x-0.5"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-[#9CA3AF] text-[17px] font-bold">
                      No digital impersonation entities currently detected for {brand?.name || 'this brand'}.{' '}
                      <Link href="/check" className="text-[#F6821F] hover:underline font-bold ml-1">
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
