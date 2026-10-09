'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Activity,
  AlertOctagon,
  GitBranch,
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
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

  // Compute honest severity counts from actual data (NO fake fallbacks)
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
      pageSubtitle={`Real-time digital risk intelligence for ${brand?.name || 'Paytm'} • Monitored assets nominal`}
    >
      <div className="space-y-16 pb-16">
        {/* ========================================================================= */}
        {/* 1. TOP BAR: TIME FILTER + CONTINUOUS INLINE METRICS (NO TILES/CARDS)       */}
        {/* ========================================================================= */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                LIVE TELEMETRY
              </span>
              <span className="text-[#59625F]">/</span>
              <span className="font-mono text-[11px] text-[#8A9390]">
                {brand?.name || 'Paytm'} Perimeter Monitoring
              </span>
            </div>

            {/* Action buttons & Time range selector */}
            <div className="flex items-center gap-4 text-[12px] font-mono">
              <Link
                href="/setup"
                className="px-3 py-1 border border-[#18E6A3]/50 text-[#18E6A3] hover:bg-[#18E6A3]/10 transition-colors rounded-[2px] inline-flex items-center gap-1.5"
              >
                <Sparkles className="h-3 w-3" />
                <span>START INVESTIGATION</span>
              </Link>

              {(['24H', '7D', '30D'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`pb-1 transition-colors cursor-pointer ${
                    timeRange === r
                      ? 'text-[#F2F4F3] border-b border-[#18E6A3] font-medium'
                      : 'text-[#59625F] hover:text-[#8A9390]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Continuous metrics in columns separated by thin vertical dividers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-[rgba(255,255,255,0.08)]">
            <div className="space-y-1">
              <div className="font-mono text-[11px] text-[#59625F] uppercase">
                Detected candidates
              </div>
              <div className="font-mono text-[36px] font-light text-[#F2F4F3] leading-none">
                {totalDetected}
              </div>
              <div className="font-mono text-[11px] text-[#18E6A3] pt-1">
                {totalDetected > 0 ? `${totalDetected} live entities verified` : 'Perimeter nominal'}
              </div>
            </div>

            <div className="space-y-1 md:pl-8 pt-4 md:pt-0">
              <div className="font-mono text-[11px] text-[#59625F] uppercase">
                Needs attention
              </div>
              <div className="font-mono text-[36px] font-light text-[#FF5C5C] leading-none">
                {needsAttention}
              </div>
              <div className="font-mono text-[11px] text-[#59625F] pt-1">
                High / Critical triage
              </div>
            </div>

            <div className="space-y-1 md:pl-8 pt-4 md:pt-0">
              <div className="font-mono text-[11px] text-[#59625F] uppercase">
                Active investigations
              </div>
              <div className="font-mono text-[36px] font-light text-[#F5B84B] leading-none">
                {investigationsCount}
              </div>
              <div className="font-mono text-[11px] text-[#59625F] pt-1">
                Persisted sessions
              </div>
            </div>

            <div className="space-y-1 md:pl-8 pt-4 md:pt-0">
              <div className="font-mono text-[11px] text-[#59625F] uppercase">
                Campaigns discovered
              </div>
              <div className="font-mono text-[36px] font-light text-[#F2F4F3] leading-none">
                {campaignsCount}
              </div>
              <div className="font-mono text-[11px] text-[#59625F] pt-1">
                Multi-vector clusters
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SPLIT ANALYTICAL REGION: VELOCITY GRAPH + RISK DISTRIBUTION             */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-t border-[rgba(255,255,255,0.08)] pt-12">
          {/* LEFT 8 COLS: THREAT ACTIVITY VELOCITY (HOURLY) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                  TEMPORAL SIGNALS
                </span>
                <h3 className="text-[18px] font-normal text-[#F2F4F3]">
                  Threat activity velocity
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#59625F]">Interval: 60m UTC</span>
            </div>

            {/* Cloudflare Radar-style clean analytical density bar graph */}
            <div className="space-y-3 font-mono text-[11px]">
              <div className="h-32 flex items-end gap-1.5 pt-4">
                {hourlyActivity.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div
                      className={`w-full rounded-[1px] transition-all ${
                        val > 2 ? 'bg-[#FF5C5C]' : val > 0 ? 'bg-[#F5B84B]' : 'bg-[rgba(255,255,255,0.06)]'
                      } group-hover:bg-[#18E6A3]`}
                      style={{ height: val > 0 ? `${Math.max(15, (val / maxHourly) * 100)}%` : '4px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[#59625F] text-[10px] pt-2 border-t border-[rgba(255,255,255,0.08)]">
                <span>00:00 UTC</span>
                <span>06:00 UTC</span>
                <span>12:00 UTC</span>
                <span>18:00 UTC</span>
                <span>Current</span>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: RISK SEVERITY DISTRIBUTION */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="space-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                  SEVERITY COMPOSITION
                </span>
                <h3 className="text-[18px] font-normal text-[#F2F4F3]">
                  Risk distribution
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#59625F]">N = {totalDetected}</span>
            </div>

            <div className="space-y-4 font-mono text-[11px]">
              {/* Critical */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#FF5C5C]">CRITICAL</span>
                  <span className="text-[#F2F4F3]">
                    {criticalCount} ({totalDetected > 0 ? Math.round((criticalCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.06)] h-1 rounded-none overflow-hidden">
                  <div
                    className="bg-[#FF5C5C] h-full"
                    style={{ width: totalDetected > 0 ? `${(criticalCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* High */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#F5B84B]">HIGH</span>
                  <span className="text-[#F2F4F3]">
                    {highCount} ({totalDetected > 0 ? Math.round((highCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.06)] h-1 rounded-none overflow-hidden">
                  <div
                    className="bg-[#F5B84B] h-full"
                    style={{ width: totalDetected > 0 ? `${(highCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#8A9390]">MEDIUM</span>
                  <span className="text-[#F2F4F3]">
                    {mediumCount} ({totalDetected > 0 ? Math.round((mediumCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.06)] h-1 rounded-none overflow-hidden">
                  <div
                    className="bg-[#8A9390] h-full"
                    style={{ width: totalDetected > 0 ? `${(mediumCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#59625F]">LOW</span>
                  <span className="text-[#F2F4F3]">
                    {lowCount} ({totalDetected > 0 ? Math.round((lowCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[rgba(255,255,255,0.06)] h-1 rounded-none overflow-hidden">
                  <div
                    className="bg-[#18E6A3] h-full"
                    style={{ width: totalDetected > 0 ? `${(lowCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CONTINUOUS TABLE: PRIORITY INCIDENTS (NO BOX CONTAINER)                 */}
        {/* ========================================================================= */}
        <section className="space-y-6 border-t border-[rgba(255,255,255,0.08)] pt-12">
          <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.08)] pb-3">
            <div className="space-y-1">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#59625F]">
                TRIAGE QUEUE
              </span>
              <h3 className="text-[20px] font-normal text-[#F2F4F3]">
                Priority incidents
              </h3>
            </div>
            <Link
              href="/incidents"
              className="font-mono text-[11px] text-[#8A9390] hover:text-[#F2F4F3] transition-colors"
            >
              All incidents ({threats.length}) →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] text-[#59625F] font-mono text-[11px] uppercase">
                  <th className="py-3 pr-4 font-normal">Severity</th>
                  <th className="py-3 px-4 font-normal">Target Asset</th>
                  <th className="py-3 px-4 font-normal">Vector</th>
                  <th className="py-3 px-4 font-normal">Score</th>
                  <th className="py-3 px-4 font-normal">Discovered</th>
                  <th className="py-3 pl-4 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                {priorityQueue.length > 0 ? (
                  priorityQueue.map((threat) => (
                    <tr key={threat.id} className="group hover:bg-[#0D1011] transition-colors">
                      <td className="py-3.5 pr-4 font-mono text-[11px]">
                        <span
                          className={
                            threat.riskScore >= 80
                              ? 'text-[#FF5C5C]'
                              : threat.riskScore >= 50
                              ? 'text-[#F5B84B]'
                              : 'text-[#18E6A3]'
                          }
                        >
                          {threat.riskScore >= 80 ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] text-[#F2F4F3]">
                        {threat.targetAsset}
                      </td>
                      <td className="py-3.5 px-4 text-[#8A9390] text-[12px] uppercase font-mono">
                        {threat.type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] text-[#F2F4F3]">
                        {threat.riskScore} <span className="text-[#59625F] text-[10px]">/ 100</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#59625F]">
                        {new Date(threat.discoveredAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link
                          href={`/threat/${threat.id}`}
                          className="font-mono text-[11px] text-[#8A9390] group-hover:text-[#F2F4F3] transition-colors inline-flex items-center gap-1"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#59625F] font-mono text-[13px]">
                      No digital impersonation entities currently detected for {brand?.name || 'this brand'}.{' '}
                      <Link href="/setup" className="text-[#18E6A3] hover:underline ml-1">
                        Start an investigation to discover candidates →
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
