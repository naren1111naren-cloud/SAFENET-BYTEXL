'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Search,
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
      pageTitle="Command Center"
      pageSubtitle={`Real-time digital risk intelligence for ${brand?.name || 'Paytm'} • Monitored brand perimeter active`}
    >
      <div className="space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. TOP BAR: TIME FILTER + OPEN NON-BOXY KPI METRICS                       */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#303946] pb-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#35D0BA]/15 border border-[#35D0BA]/35 text-[#35D0BA] text-[15px] font-bold">
                <span className="h-2 w-2 rounded-full bg-[#35D0BA] animate-pulse" />
                LIVE TELEMETRY
              </span>
              <span className="text-[#303946]">/</span>
              <span className="text-[18px] text-[#FFFFFF] font-bold">
                {brand?.name || 'Paytm'} Perimeter Monitoring
              </span>
            </div>

            {/* Action buttons & Time range selector */}
            <div className="flex items-center gap-3">
              <Link
                href="/check"
                className="px-4 py-2 bg-[#35D0BA] hover:bg-[#2bbca6] text-[#080B10] font-bold text-[17px] rounded-lg shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <Search className="h-4 w-4" />
                <span>Quick Check</span>
              </Link>

              <div className="flex items-center bg-[#121821] border border-[#303946] rounded-lg p-1 text-[16px] font-bold">
                {(['24H', '7D', '30D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3.5 py-1 rounded-md transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-[#35D0BA] text-[#080B10] font-bold'
                        : 'text-[#FFFFFF] hover:text-[#35D0BA]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* OPEN NON-BOXY METRICS: Floating values with descriptive labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-2">
            {/* Metric 1 */}
            <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-[#303946] pb-4 sm:pb-0 pr-4">
              <div className="text-[17px] text-[#D0D7E0] uppercase font-bold tracking-wider">
                Detected Candidates
              </div>
              <div className="text-[44px] sm:text-[52px] font-extrabold text-[#FFFFFF] leading-none tabular-nums tracking-tight">
                {totalDetected}
              </div>
              <div className="text-[16px] text-[#35D0BA] font-bold flex items-center gap-2 pt-1">
                <span className="h-2 w-2 rounded-full bg-[#35D0BA]" />
                {totalDetected > 0 ? `${totalDetected} live entities indexed` : 'Perimeter nominal'}
              </div>
            </div>

            {/* Metric 2 */}
            <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-[#303946] pb-4 sm:pb-0 pr-4">
              <div className="text-[17px] text-[#D0D7E0] uppercase font-bold tracking-wider">
                Needs Attention
              </div>
              <div className="text-[44px] sm:text-[52px] font-extrabold text-[#FF5C6C] leading-none tabular-nums tracking-tight">
                {needsAttention}
              </div>
              <div className="text-[16px] text-[#FF5C6C] font-bold flex items-center gap-2 pt-1">
                <span className="h-2 w-2 rounded-full bg-[#FF5C6C]" />
                High / Critical triage
              </div>
            </div>

            {/* Metric 3 */}
            <div className="space-y-2 border-b sm:border-b-0 sm:border-r border-[#303946] pb-4 sm:pb-0 pr-4">
              <div className="text-[17px] text-[#D0D7E0] uppercase font-bold tracking-wider">
                Active Investigations
              </div>
              <div className="text-[44px] sm:text-[52px] font-extrabold text-[#FFCD4D] leading-none tabular-nums tracking-tight">
                {investigationsCount}
              </div>
              <div className="text-[16px] text-[#FFCD4D] font-bold flex items-center gap-2 pt-1">
                <span className="h-2 w-2 rounded-full bg-[#FFCD4D]" />
                Persisted forensic cases
              </div>
            </div>

            {/* Metric 4 */}
            <div className="space-y-2">
              <div className="text-[17px] text-[#D0D7E0] uppercase font-bold tracking-wider">
                Campaign Clusters
              </div>
              <div className="text-[44px] sm:text-[52px] font-extrabold text-[#64A9FF] leading-none tabular-nums tracking-tight">
                {campaignsCount}
              </div>
              <div className="text-[16px] text-[#64A9FF] font-bold flex items-center gap-2 pt-1">
                <span className="h-2 w-2 rounded-full bg-[#64A9FF]" />
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
          <div className="lg:col-span-8 bg-[#0D1118] border border-[#303946] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex items-baseline justify-between border-b border-[#303946] pb-4">
              <div className="space-y-1">
                <span className="text-[14px] font-bold uppercase tracking-wider text-[#35D0BA]">
                  TEMPORAL SIGNALS
                </span>
                <h3 className="text-[24px] font-bold text-[#FFFFFF]">
                  Threat Activity Velocity
                </h3>
              </div>
              <span className="text-[16px] font-mono text-[#D0D7E0] font-bold">Interval: 60m UTC</span>
            </div>

            {/* Analytical density bar graph */}
            <div className="space-y-4 font-sans">
              <div className="h-44 flex items-end gap-2 pt-4 px-2">
                {hourlyActivity.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        val > 2 ? 'bg-[#FF5C6C]' : val > 0 ? 'bg-[#35D0BA]' : 'bg-[#19222D]'
                      } group-hover:bg-[#64A9FF]`}
                      style={{ height: val > 0 ? `${Math.max(18, (val / maxHourly) * 100)}%` : '6px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[#D0D7E0] text-[15px] pt-4 border-t border-[#303946] font-mono font-bold">
                <span>00:00 UTC</span>
                <span>06:00 UTC</span>
                <span>12:00 UTC</span>
                <span>18:00 UTC</span>
                <span className="text-[#35D0BA] font-bold">Now</span>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: RISK SEVERITY DISTRIBUTION */}
          <div className="lg:col-span-4 bg-[#0D1118] border border-[#303946] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex items-baseline justify-between border-b border-[#303946] pb-4">
              <div className="space-y-1">
                <span className="text-[14px] font-bold uppercase tracking-wider text-[#35D0BA]">
                  SEVERITY COMPOSITION
                </span>
                <h3 className="text-[24px] font-bold text-[#FFFFFF]">
                  Risk Distribution
                </h3>
              </div>
              <span className="text-[16px] font-mono text-[#D0D7E0] font-bold">N = {totalDetected}</span>
            </div>

            <div className="space-y-5">
              {/* Critical */}
              <div className="space-y-2">
                <div className="flex justify-between text-[16px] font-bold">
                  <span className="text-[#FF5C6C]">CRITICAL</span>
                  <span className="text-[#FFFFFF] font-mono tabular-nums">
                    {criticalCount} ({totalDetected > 0 ? Math.round((criticalCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#121821] h-3 rounded-full overflow-hidden border border-[#303946]/50">
                  <div
                    className="bg-[#FF5C6C] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(criticalCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* High */}
              <div className="space-y-2">
                <div className="flex justify-between text-[16px] font-bold">
                  <span className="text-[#FF8E4D]">HIGH</span>
                  <span className="text-[#FFFFFF] font-mono tabular-nums">
                    {highCount} ({totalDetected > 0 ? Math.round((highCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#121821] h-3 rounded-full overflow-hidden border border-[#303946]/50">
                  <div
                    className="bg-[#FF8E4D] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(highCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-2">
                <div className="flex justify-between text-[16px] font-bold">
                  <span className="text-[#FFCD4D]">MEDIUM</span>
                  <span className="text-[#FFFFFF] font-mono tabular-nums">
                    {mediumCount} ({totalDetected > 0 ? Math.round((mediumCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#121821] h-3 rounded-full overflow-hidden border border-[#303946]/50">
                  <div
                    className="bg-[#FFCD4D] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(mediumCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-2">
                <div className="flex justify-between text-[16px] font-bold">
                  <span className="text-[#64A9FF]">LOW</span>
                  <span className="text-[#FFFFFF] font-mono tabular-nums">
                    {lowCount} ({totalDetected > 0 ? Math.round((lowCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#121821] h-3 rounded-full overflow-hidden border border-[#303946]/50">
                  <div
                    className="bg-[#64A9FF] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(lowCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PRIORITY DETECTIONS TABLE                                              */}
        {/* ========================================================================= */}
        <section className="bg-[#0D1118] border border-[#303946] rounded-xl p-6 sm:p-7 space-y-6">
          <div className="flex items-baseline justify-between border-b border-[#303946] pb-4">
            <div className="space-y-1">
              <span className="text-[14px] font-bold uppercase tracking-wider text-[#35D0BA]">
                TRIAGE QUEUE
              </span>
              <h3 className="text-[24px] font-bold text-[#FFFFFF]">
                Priority Detections
              </h3>
            </div>
            <Link
              href="/incidents"
              className="text-[17px] font-bold text-[#35D0BA] hover:underline transition-colors inline-flex items-center gap-1.5"
            >
              <span>All Incidents ({threats.length})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[18px]">
              <thead>
                <tr className="border-b border-[#303946] text-[#D0D7E0] font-bold text-[15px] uppercase tracking-wider">
                  <th className="py-3.5 pr-4">Severity</th>
                  <th className="py-3.5 px-4">Target Asset</th>
                  <th className="py-3.5 px-4">Vector</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Discovered</th>
                  <th className="py-3.5 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303946]">
                {priorityQueue.length > 0 ? (
                  priorityQueue.map((threat) => (
                    <tr key={threat.id} className="group hover:bg-[#121821] transition-colors">
                      <td className="py-4 pr-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-[13px] font-mono font-bold uppercase border ${
                            threat.riskScore >= 80
                              ? 'bg-[#FF5C6C]/15 text-[#FF5C6C] border-[#FF5C6C]/35'
                              : threat.riskScore >= 50
                              ? 'bg-[#FFCD4D]/15 text-[#FFCD4D] border-[#FFCD4D]/35'
                              : 'bg-[#35D0BA]/15 text-[#35D0BA] border-[#35D0BA]/35'
                          }`}
                        >
                          {threat.riskScore >= 80 ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-[17px] font-bold text-[#FFFFFF]">
                        {threat.targetAsset}
                      </td>
                      <td className="py-4 px-4 text-[#D0D7E0] text-[16px] uppercase font-mono font-bold">
                        {threat.type.replace('_', ' ')}
                      </td>
                      <td className="py-4 px-4 font-mono text-[17px] font-bold text-[#FFFFFF] tabular-nums">
                        {threat.riskScore} <span className="text-[#D0D7E0] text-[14px]">/ 100</span>
                      </td>
                      <td className="py-4 px-4 text-[16px] text-[#D0D7E0] font-bold">
                        {new Date(threat.discoveredAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 pl-4 text-right">
                        <Link
                          href={`/threat/${threat.id}`}
                          className="text-[16px] font-bold text-[#35D0BA] hover:underline transition-colors inline-flex items-center gap-1.5 group-hover:translate-x-0.5"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-[#D0D7E0] text-[18px] font-bold">
                      No digital impersonation entities currently detected for {brand?.name || 'this brand'}.{' '}
                      <Link href="/check" className="text-[#35D0BA] hover:underline font-bold ml-1">
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
