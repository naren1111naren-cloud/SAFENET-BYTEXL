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
      <div className="space-y-10 pb-16">
        {/* ========================================================================= */}
        {/* 1. TOP BAR: TIME FILTER + KPI CARDS                                       */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE TELEMETRY
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-[13px] text-slate-600 font-medium">
                {brand?.name || 'Paytm'} Perimeter Monitoring
              </span>
            </div>

            {/* Action buttons & Time range selector */}
            <div className="flex items-center gap-3">
              <Link
                href="/check"
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[12px] rounded-lg shadow-xs inline-flex items-center gap-1.5 transition-all"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Quick Check</span>
              </Link>

              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
                {(['24H', '7D', '30D'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-slate-100 text-slate-900 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
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
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-2">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                Detected Candidates
              </div>
              <div className="text-[34px] font-bold text-slate-900 leading-tight">
                {totalDetected}
              </div>
              <div className="text-[12px] text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {totalDetected > 0 ? `${totalDetected} live entities indexed` : 'Perimeter nominal'}
              </div>
            </div>

            {/* Needs Attention */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-2">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                Needs Attention
              </div>
              <div className="text-[34px] font-bold text-rose-600 leading-tight">
                {needsAttention}
              </div>
              <div className="text-[12px] text-rose-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                High / Critical severity triage
              </div>
            </div>

            {/* Active Investigations */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-2">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                Active Investigations
              </div>
              <div className="text-[34px] font-bold text-amber-600 leading-tight">
                {investigationsCount}
              </div>
              <div className="text-[12px] text-amber-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Persisted sessions & cases
              </div>
            </div>

            {/* Campaigns Discovered */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-2">
              <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                Campaigns Discovered
              </div>
              <div className="text-[34px] font-bold text-blue-600 leading-tight">
                {campaignsCount}
              </div>
              <div className="text-[12px] text-blue-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
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
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-5">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  TEMPORAL SIGNALS
                </span>
                <h3 className="text-[18px] font-bold text-slate-900">
                  Threat Activity Velocity
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Interval: 60m UTC</span>
            </div>

            {/* Clean analytical density bar graph */}
            <div className="space-y-3 font-sans">
              <div className="h-36 flex items-end gap-1.5 pt-4 px-2">
                {hourlyActivity.map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        val > 2 ? 'bg-rose-500' : val > 0 ? 'bg-blue-500' : 'bg-slate-100'
                      } group-hover:bg-blue-600`}
                      style={{ height: val > 0 ? `${Math.max(15, (val / maxHourly) * 100)}%` : '6px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] pt-3 border-t border-slate-100 font-mono">
                <span>00:00 UTC</span>
                <span>06:00 UTC</span>
                <span>12:00 UTC</span>
                <span>18:00 UTC</span>
                <span className="text-blue-600 font-bold">Now</span>
              </div>
            </div>
          </div>

          {/* RIGHT 4 COLS: RISK SEVERITY DISTRIBUTION */}
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-5">
            <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  SEVERITY COMPOSITION
                </span>
                <h3 className="text-[18px] font-bold text-slate-900">
                  Risk Distribution
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">N = {totalDetected}</span>
            </div>

            <div className="space-y-4">
              {/* Critical */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-rose-600">CRITICAL</span>
                  <span className="text-slate-700">
                    {criticalCount} ({totalDetected > 0 ? Math.round((criticalCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{ width: totalDetected > 0 ? `${(criticalCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* High */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-amber-600">HIGH</span>
                  <span className="text-slate-700">
                    {highCount} ({totalDetected > 0 ? Math.round((highCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: totalDetected > 0 ? `${(highCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-blue-600">MEDIUM</span>
                  <span className="text-slate-700">
                    {mediumCount} ({totalDetected > 0 ? Math.round((mediumCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: totalDetected > 0 ? `${(mediumCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Low */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-semibold">
                  <span className="text-emerald-600">LOW</span>
                  <span className="text-slate-700">
                    {lowCount} ({totalDetected > 0 ? Math.round((lowCount / totalDetected) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: totalDetected > 0 ? `${(lowCount / totalDetected) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PRIORITY INCIDENTS TABLE                                               */}
        {/* ========================================================================= */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-5">
          <div className="flex items-baseline justify-between border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                TRIAGE QUEUE
              </span>
              <h3 className="text-[18px] font-bold text-slate-900">
                Priority Incidents
              </h3>
            </div>
            <Link
              href="/incidents"
              className="text-[13px] font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
            >
              <span>All Incidents ({threats.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 pr-4 font-bold">Severity</th>
                  <th className="py-3 px-4 font-bold">Target Asset</th>
                  <th className="py-3 px-4 font-bold">Vector</th>
                  <th className="py-3 px-4 font-bold">Score</th>
                  <th className="py-3 px-4 font-bold">Discovered</th>
                  <th className="py-3 pl-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priorityQueue.length > 0 ? (
                  priorityQueue.map((threat) => (
                    <tr key={threat.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                            threat.riskScore >= 80
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : threat.riskScore >= 50
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {threat.riskScore >= 80 ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] font-semibold text-slate-900">
                        {threat.targetAsset}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[12px] uppercase font-mono">
                        {threat.type.replace('_', ' ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[13px] font-semibold text-slate-900">
                        {threat.riskScore} <span className="text-slate-400 text-[11px] font-normal">/ 100</span>
                      </td>
                      <td className="py-3.5 px-4 text-[12px] text-slate-500">
                        {new Date(threat.discoveredAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link
                          href={`/threat/${threat.id}`}
                          className="text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-[13px]">
                      No digital impersonation entities currently detected for {brand?.name || 'this brand'}.{' '}
                      <Link href="/setup" className="text-blue-600 hover:underline font-semibold ml-1">
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
