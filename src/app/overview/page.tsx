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
  ShieldAlert,
  Search,
  ExternalLink,
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
      <div className="space-y-8 pb-16">
        {/* ========================================================================= */}
        {/* 1. TOP BAR: TIME FILTER + KPI CARDS                                       */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE2DC] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E7F0E9] border border-[#D1E3D5] text-[#477A60] text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#477A60] animate-pulse" />
                LIVE TELEMETRY
              </span>
              <span className="text-[#DDE2DC]">/</span>
              <span className="text-[13px] text-[#626B65] font-medium">
                {brand?.name || 'Paytm'} Perimeter Monitoring
              </span>
            </div>

            {/* Action buttons & Time range selector */}
            <div className="flex items-center gap-3">
              <Link
                href="/check"
                className="px-3.5 py-1.5 bg-[#477A60] hover:bg-[#365F49] text-white font-semibold text-[13px] rounded-lg shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Quick Check</span>
              </Link>

              <div className="flex items-center bg-[#ECEFEC] border border-[#DDE2DC] rounded-lg p-0.5">
                {(['24H', '7D', '30D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-[#FFFFFF] text-[#202723] font-bold shadow-xs'
                        : 'text-[#626B65] hover:text-[#202723]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Detected Candidates */}
            <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#C4CCC3] transition-all space-y-2">
              <div className="text-[12px] text-[#626B65] uppercase font-bold tracking-wider">
                Detected Candidates
              </div>
              <div className="text-[32px] sm:text-[36px] font-extrabold text-[#202723] leading-tight tabular-nums">
                {totalDetected}
              </div>
              <div className="text-[12px] text-[#347653] font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#347653]" />
                {totalDetected > 0 ? `${totalDetected} live entities indexed` : 'Perimeter nominal'}
              </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#F8D3D6] transition-all space-y-2">
              <div className="text-[12px] text-[#626B65] uppercase font-bold tracking-wider">
                Needs Attention
              </div>
              <div className="text-[32px] sm:text-[36px] font-extrabold text-[#C93643] leading-tight tabular-nums">
                {needsAttention}
              </div>
              <div className="text-[12px] text-[#C93643] font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C93643]" />
                High / Critical severity triage
              </div>
            </div>

            {/* Active Investigations */}
            <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#FBE8CA] transition-all space-y-2">
              <div className="text-[12px] text-[#626B65] uppercase font-bold tracking-wider">
                Active Investigations
              </div>
              <div className="text-[32px] sm:text-[36px] font-extrabold text-[#B7791F] leading-tight tabular-nums">
                {investigationsCount}
              </div>
              <div className="text-[12px] text-[#B7791F] font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#B7791F]" />
                Persisted sessions & cases
              </div>
            </div>

            {/* Campaigns Discovered */}
            <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-[#D3E1F5] transition-all space-y-2">
              <div className="text-[12px] text-[#626B65] uppercase font-bold tracking-wider">
                Campaigns Discovered
              </div>
              <div className="text-[32px] sm:text-[36px] font-extrabold text-[#3974C6] leading-tight tabular-nums">
                {campaignsCount}
              </div>
              <div className="text-[12px] text-[#3974C6] font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3974C6]" />
                Multi-vector clusters
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SPLIT ANALYTICAL REGION: VELOCITY GRAPH + RISK DISTRIBUTION             */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 8 COLS: THREAT ACTIVITY VELOCITY (HOURLY) */}
          <div className="lg:col-span-8 bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#858D86]">
                  TEMPORAL SIGNALS
                </span>
                <h3 className="text-[18px] font-bold text-[#202723]">
                  Threat Activity Velocity
                </h3>
              </div>
              <span className="text-[12px] font-mono text-[#858D86]">Interval: 60m UTC</span>
            </div>

            {/* Clean analytical density bar graph */}
            <div className="space-y-3 font-sans">
              <div className="h-36 flex items-end gap-1.5 pt-4 px-2">
                {hourlyActivity.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        val > 2 ? 'bg-[#C93643]' : val > 0 ? 'bg-[#477A60]' : 'bg-[#ECEFEC]'
                      } group-hover:bg-[#365F49]`}
                      style={{ height: val > 0 ? `${Math.max(15, (val / maxHourly) * 100)}%` : '6px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[#858D86] text-[11px] pt-3 border-t border-[#DDE2DC] font-mono">
                <span>00:00 UTC</span>
                <span>06:00 UTC</span>
                <span>12:00 UTC</span>
                <span>18:00 UTC</span>
                <span className="text-[#477A60] font-bold">Now</span>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: RISK SEVERITY DISTRIBUTION */}
          <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#858D86]">
                  SEVERITY COMPOSITION
                </span>
                <h3 className="text-[18px] font-bold text-[#202723]">
                  Risk Distribution
                </h3>
              </div>
              <span className="text-[12px] font-mono text-[#858D86]">N = {totalDetected}</span>
            </div>

            <div className="space-y-4">
              {/* Critical */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-[#C93643]">CRITICAL</span>
                  <span className="text-[#626B65] font-mono tabular-nums">
                    {criticalCount} ({totalDetected > 0 ? Math.round((criticalCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#ECEFEC] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#C93643] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(criticalCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* High */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-[#D95F36]">HIGH</span>
                  <span className="text-[#626B65] font-mono tabular-nums">
                    {highCount} ({totalDetected > 0 ? Math.round((highCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#ECEFEC] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D95F36] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(highCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-[#B7791F]">MEDIUM</span>
                  <span className="text-[#626B65] font-mono tabular-nums">
                    {mediumCount} ({totalDetected > 0 ? Math.round((mediumCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#ECEFEC] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#B7791F] h-full rounded-full transition-all"
                    style={{ width: totalDetected > 0 ? `${(mediumCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-[#3974C6]">LOW</span>
                  <span className="text-[#626B65] font-mono tabular-nums">
                    {lowCount} ({totalDetected > 0 ? Math.round((lowCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-[#ECEFEC] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#3974C6] h-full rounded-full transition-all"
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
        <section className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-baseline justify-between border-b border-[#DDE2DC] pb-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#858D86]">
                TRIAGE QUEUE
              </span>
              <h3 className="text-[18px] font-bold text-[#202723]">
                Priority Detections
              </h3>
            </div>
            <Link
              href="/incidents"
              className="text-[13px] font-semibold text-[#477A60] hover:text-[#365F49] transition-colors inline-flex items-center gap-1"
            >
              <span>All Incidents ({threats.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#DDE2DC] text-[#858D86] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 pr-4 font-bold">Severity</th>
                  <th className="py-3 px-4 font-bold">Target Asset</th>
                  <th className="py-3 px-4 font-bold">Vector</th>
                  <th className="py-3 px-4 font-bold">Score</th>
                  <th className="py-3 px-4 font-bold">Discovered</th>
                  <th className="py-3 pl-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE2DC]">
                {priorityQueue.length > 0 ? (
                  priorityQueue.map((threat) => (
                    <tr key={threat.id} className="group hover:bg-[#F7F8F6] transition-colors">
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            threat.riskScore >= 80
                              ? 'bg-[#FDF2F3] text-[#C93643] border-[#F8D3D6]'
                              : threat.riskScore >= 50
                              ? 'bg-[#FEF9F0] text-[#B7791F] border-[#FBE8CA]'
                              : 'bg-[#EFF7F2] text-[#347653] border-[#CBE4D4]'
                          }`}
                        >
                          {threat.riskScore >= 80 ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] font-semibold text-[#202723]">
                        {threat.targetAsset}
                      </td>
                      <td className="py-3.5 px-4 text-[#626B65] text-[12px] uppercase font-mono">
                        {threat.type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] font-semibold text-[#202723] tabular-nums">
                        {threat.riskScore} <span className="text-[#858D86] text-[11px] font-normal">/ 100</span>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-[#626B65]">
                        {new Date(threat.discoveredAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link
                          href={`/threat/${threat.id}`}
                          className="text-[12px] font-semibold text-[#477A60] hover:text-[#365F49] transition-colors inline-flex items-center gap-1 group-hover:translate-x-0.5"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#858D86] text-[13px]">
                      No digital impersonation entities currently detected for {brand?.name || 'this brand'}.{' '}
                      <Link href="/check" className="text-[#477A60] hover:underline font-semibold ml-1">
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
