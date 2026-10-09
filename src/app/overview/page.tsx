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
      <div className="space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. TOP BAR: TIME FILTER + SENTINEL METRIC TILES                           */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F5A0] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F5A0]" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#00D2FF] font-semibold">
                LIVE TELEMETRY
              </span>
              <span className="text-slate-700">/</span>
              <span className="font-mono text-[11px] text-[#94A3B8]">
                {brand?.name || 'Paytm'} Perimeter Monitoring Active
              </span>
            </div>

            {/* Action buttons & Time range selector */}
            <div className="flex items-center gap-4 text-[12px] font-mono">
              <Link
                href="/setup"
                className="px-3 py-1.5 border border-cyan-500/40 text-[#00D2FF] bg-cyan-500/10 hover:bg-cyan-500/20 transition-all rounded-[3px] inline-flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,210,255,0.1)]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>START INVESTIGATION</span>
              </Link>

              <div className="flex items-center gap-1 bg-[#0B101A] p-0.5 rounded-[4px] border border-slate-800">
                {(['24H', '7D', '30D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 text-[11px] rounded-[3px] transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-cyan-500/20 text-[#00D2FF] font-semibold border border-cyan-500/30'
                        : 'text-[#64748B] hover:text-[#94A3B8]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sentinel High-Density Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-[4px] bg-[#0B101A]/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-1 group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">
                  Detected Candidates
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
              </div>
              <div className="font-mono text-[34px] font-bold text-[#F3F6FB] leading-none pt-1">
                {totalDetected}
              </div>
              <div className="font-mono text-[11px] text-[#00F5A0] pt-1">
                {totalDetected > 0 ? `${totalDetected} live entities verified` : 'Perimeter nominal'}
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-[#0B101A]/80 border border-slate-800 hover:border-rose-500/30 transition-all space-y-1 group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">
                  Needs Attention
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#FF3366] shadow-[0_0_6px_#FF3366]" />
              </div>
              <div className="font-mono text-[34px] font-bold text-[#FF3366] leading-none pt-1">
                {needsAttention}
              </div>
              <div className="font-mono text-[11px] text-[#94A3B8] pt-1">
                High / Critical triage queue
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-[#0B101A]/80 border border-slate-800 hover:border-amber-500/30 transition-all space-y-1 group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">
                  Active Investigations
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#F5B84B]" />
              </div>
              <div className="font-mono text-[34px] font-bold text-[#F5B84B] leading-none pt-1">
                {investigationsCount}
              </div>
              <div className="font-mono text-[11px] text-[#94A3B8] pt-1">
                Persisted threat sessions
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-[#0B101A]/80 border border-slate-800 hover:border-cyan-500/30 transition-all space-y-1 group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-wider">
                  Discovered Campaigns
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
              </div>
              <div className="font-mono text-[34px] font-bold text-[#00D2FF] leading-none pt-1">
                {campaignsCount}
              </div>
              <div className="font-mono text-[11px] text-[#94A3B8] pt-1">
                Multi-vector clusters
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SPLIT ANALYTICAL REGION: VELOCITY GRAPH + RISK DISTRIBUTION             */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-800/80 pt-10">
          {/* LEFT 8 COLS: THREAT ACTIVITY VELOCITY (HOURLY) */}
          <div className="lg:col-span-8 p-5 rounded-[4px] bg-[#0B101A]/80 border border-slate-800 space-y-6">
            <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#00D2FF] font-semibold">
                  TEMPORAL SIGNALS
                </span>
                <h3 className="text-[17px] font-semibold text-[#F3F6FB]">
                  Threat Activity Velocity
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#64748B]">Interval: 60m UTC</span>
            </div>

            {/* Sentinel Bar Chart */}
            <div className="space-y-3 font-mono text-[11px]">
              <div className="h-36 flex items-end gap-1.5 pt-4">
                {hourlyActivity.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div
                      className={`w-full rounded-[1px] transition-all ${
                        val > 2
                          ? 'bg-[#FF3366] shadow-[0_0_8px_rgba(255,51,102,0.4)]'
                          : val > 0
                          ? 'bg-[#00D2FF] shadow-[0_0_6px_rgba(0,210,255,0.3)]'
                          : 'bg-slate-800/60'
                      } group-hover:bg-[#00F5A0] group-hover:shadow-[0_0_8px_rgba(0,245,160,0.5)]`}
                      style={{ height: val > 0 ? `${Math.max(16, (val / maxHourly) * 100)}%` : '4px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[#64748B] text-[10px] pt-2 border-t border-slate-800/80">
                <span>00:00 UTC</span>
                <span>06:00 UTC</span>
                <span>12:00 UTC</span>
                <span>18:00 UTC</span>
                <span>Current</span>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: RISK SEVERITY DISTRIBUTION */}
          <div className="lg:col-span-4 p-5 rounded-[4px] bg-[#0B101A]/80 border border-slate-800 space-y-6">
            <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#00D2FF] font-semibold">
                  SEVERITY COMPOSITION
                </span>
                <h3 className="text-[17px] font-semibold text-[#F3F6FB]">
                  Risk Distribution
                </h3>
              </div>
              <span className="font-mono text-[11px] text-[#64748B]">N = {totalDetected}</span>
            </div>

            <div className="space-y-4 font-mono text-[11px]">
              {/* Critical */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#FF3366] font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF3366]" />
                    CRITICAL
                  </span>
                  <span className="text-[#F3F6FB] font-bold">
                    {criticalCount} ({totalDetected > 0 ? Math.round((criticalCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FF3366] h-full rounded-full shadow-[0_0_6px_#FF3366]"
                    style={{ width: totalDetected > 0 ? `${(criticalCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* High */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#F5B84B] font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F5B84B]" />
                    HIGH
                  </span>
                  <span className="text-[#F3F6FB] font-bold">
                    {highCount} ({totalDetected > 0 ? Math.round((highCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F5B84B] h-full rounded-full shadow-[0_0_6px_#F5B84B]"
                    style={{ width: totalDetected > 0 ? `${(highCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#00D2FF] font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF]" />
                    MEDIUM
                  </span>
                  <span className="text-[#F3F6FB] font-bold">
                    {mediumCount} ({totalDetected > 0 ? Math.round((mediumCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00D2FF] h-full rounded-full shadow-[0_0_6px_#00D2FF]"
                    style={{ width: totalDetected > 0 ? `${(mediumCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#00F5A0] font-semibold flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0]" />
                    LOW / NOMINAL
                  </span>
                  <span className="text-[#F3F6FB] font-bold">
                    {lowCount} ({totalDetected > 0 ? Math.round((lowCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#00F5A0] h-full rounded-full shadow-[0_0_6px_#00F5A0]"
                    style={{ width: totalDetected > 0 ? `${(lowCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CONTINUOUS TABLE: PRIORITY INCIDENTS                                   */}
        {/* ========================================================================= */}
        <section className="space-y-4 border-t border-slate-800/80 pt-10">
          <div className="flex items-baseline justify-between border-b border-slate-800/80 pb-3">
            <div className="space-y-0.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#00D2FF] font-semibold">
                SOC TRIAGE QUEUE
              </span>
              <h3 className="text-[20px] font-semibold text-[#F3F6FB]">
                Priority Incidents
              </h3>
            </div>
            <Link
              href="/incidents"
              className="font-mono text-[11px] text-[#00D2FF] hover:underline transition-colors flex items-center gap-1"
            >
              <span>All incidents ({threats.length})</span>
              <span>→</span>
            </Link>
          </div>

          <div className="overflow-x-auto rounded-[4px] border border-slate-800/80 bg-[#0B101A]/60">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-800/80 text-[#64748B] font-mono text-[10px] uppercase bg-[#080C14]">
                  <th className="py-3 px-4 font-semibold">Severity</th>
                  <th className="py-3 px-4 font-semibold">Target Asset</th>
                  <th className="py-3 px-4 font-semibold">Vector</th>
                  <th className="py-3 px-4 font-semibold">Score</th>
                  <th className="py-3 px-4 font-semibold">Discovered</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {priorityQueue.length > 0 ? (
                  priorityQueue.map((threat) => (
                    <tr key={threat.id} className="group hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-[2px] font-bold ${
                            threat.riskScore >= 80
                              ? 'badge-critical'
                              : threat.riskScore >= 50
                              ? 'badge-high'
                              : 'badge-nominal'
                          }`}
                        >
                          {threat.riskScore >= 80 ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] text-[#F3F6FB] group-hover:text-[#00D2FF] transition-colors">
                        {threat.targetAsset}
                      </td>
                      <td className="py-3.5 px-4 text-[#94A3B8] text-[11px] uppercase font-mono">
                        {threat.type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] text-[#F3F6FB] font-bold">
                        {threat.riskScore} <span className="text-[#64748B] text-[10px] font-normal">/ 100</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#64748B]">
                        {new Date(threat.discoveredAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/threat/${threat.id}`}
                          className="font-mono text-[11px] text-[#00D2FF] hover:text-white transition-colors inline-flex items-center gap-1 group-hover:translate-x-0.5"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#64748B] font-mono text-[13px]">
                      No digital impersonation entities currently detected for {brand?.name || 'this brand'}.{' '}
                      <Link href="/setup" className="text-[#00D2FF] hover:underline ml-1">
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
