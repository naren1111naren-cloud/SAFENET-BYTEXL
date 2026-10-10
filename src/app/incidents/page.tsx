'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertOctagon,
  ChevronRight,
  Plus,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { ThreatItem, ThreatStatus, BrandProfile } from '@/types/brand';

type OperationalStatus = 'New' | 'Investigating' | 'Confirmed' | 'Contained' | 'Resolved';

export default function IncidentsPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | OperationalStatus>('ALL');

  useEffect(() => {
    const activeBrand = BrandStore.getBrand() || PRESET_BRANDS['Paytm'];
    setBrand(activeBrand);
    setThreats(BrandStore.getThreats());

    const handleStorage = () => {
      setBrand(BrandStore.getBrand());
      setThreats(BrandStore.getThreats());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const mapStatusToOperational = (status: ThreatStatus): OperationalStatus => {
    switch (status) {
      case 'active':
        return 'New';
      case 'under_review':
        return 'Investigating';
      case 'confirmed':
        return 'Confirmed';
      case 'takedown_requested':
        return 'Contained';
      case 'resolved':
        return 'Resolved';
      default:
        return 'Investigating';
    }
  };

  const handleUpdateStatus = (threatId: string, newStatus: OperationalStatus) => {
    let backendStatus: ThreatStatus = 'active';
    if (newStatus === 'New') backendStatus = 'active';
    else if (newStatus === 'Investigating') backendStatus = 'under_review';
    else if (newStatus === 'Confirmed') backendStatus = 'confirmed';
    else if (newStatus === 'Contained') backendStatus = 'takedown_requested';
    else if (newStatus === 'Resolved') backendStatus = 'resolved';

    BrandStore.updateThreatStatus(threatId, backendStatus, `Analyst marked incident as ${newStatus}`);
    setThreats(BrandStore.getThreats());
  };

  const filteredThreats = threats.filter((t) => {
    if (selectedFilter === 'ALL') return true;
    return mapStatusToOperational(t.status) === selectedFilter;
  });

  const statuses: OperationalStatus[] = ['New', 'Investigating', 'Confirmed', 'Contained', 'Resolved'];

  return (
    <AppShell
      pageEyebrow="Security Operations Response"
      pageTitle="Incident Response Queue"
      pageSubtitle="Operational triage, status lifecycle, and mitigation workflow."
    >
      <div className="max-w-6xl mx-auto space-y-10 pb-16">
        {/* ========================================================================= */}
        {/* 1. FILTER TABS & ACTIONS                                                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-900/40 pb-4">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full transition button-text cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-white border border-pink-500/50 font-semibold'
                  : 'bg-[#130D2E]/80 border border-purple-900/50 text-slate-300 hover:text-white hover:border-pink-500/30'
              }`}
            >
              All ({threats.length})
            </button>
            {statuses.map((st) => {
              const count = threats.filter((t) => mapStatusToOperational(t.status) === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setSelectedFilter(st)}
                  className={`px-3.5 py-1.5 rounded-full transition button-text cursor-pointer ${
                    selectedFilter === st
                      ? 'bg-gradient-to-r from-purple-600/50 to-pink-600/50 text-white border border-pink-500/50 font-semibold'
                      : 'bg-[#130D2E]/80 border border-purple-900/50 text-slate-300 hover:text-white hover:border-pink-500/30'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          <Link
            href="/check"
            className="btn-accent inline-flex items-center gap-2 px-5 py-2 button-text font-semibold shadow-lg shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Check new artifact</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 2. OPERATIONAL TABLE (Open, Non-Boxy)                                     */}
        {/* ========================================================================= */}
        {filteredThreats.length === 0 ? (
          <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-12 text-center space-y-3 shadow-xl">
            <h3 className="card-title text-white">No incidents match the active filter</h3>
            <p className="small-text text-slate-400 max-w-md mx-auto">
              Investigate a suspicious link or change filters to review queued entities.
            </p>
            <div className="pt-2">
              <Link
                href="/check"
                className="button-text text-pink-400 hover:text-pink-300 underline underline-offset-4"
              >
                Launch check instrument →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#0D0722]/80 border-b border-purple-900/40 text-slate-400">
                    <th className="table-header-text py-3 px-4">Severity</th>
                    <th className="table-header-text py-3 px-4">Entity / Asset</th>
                    <th className="table-header-text py-3 px-4">Vector</th>
                    <th className="table-header-text py-3 px-4">Score</th>
                    <th className="table-header-text py-3 px-4">First Seen</th>
                    <th className="table-header-text py-3 px-4">Status</th>
                    <th className="table-header-text py-3 px-4">Analyst</th>
                    <th className="table-header-text py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30 font-sans">
                  {filteredThreats.map((threat) => {
                    const isCrit = threat.riskScore >= 80;
                    const currentStatus = mapStatusToOperational(threat.status);

                    return (
                      <tr
                        key={threat.id}
                        onClick={() => router.push(`/threat/${threat.id}`)}
                        className="group hover:bg-purple-900/20 transition cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span
                            className={`eyebrow-text px-2.5 py-0.5 rounded-full border ${
                              isCrit
                                ? 'text-rose-400 bg-rose-950/40 border-rose-500/30'
                                : threat.riskScore >= 50
                                ? 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                                : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                            }`}
                          >
                            {isCrit ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                          </span>
                        </td>

                        <td className="py-3 px-4 data-text text-white font-medium max-w-xs truncate">
                          {threat.targetAsset}
                        </td>

                        <td className="py-3 px-4 text-slate-300 text-xs uppercase font-sans">
                          {threat.type.replace('_', ' ')}
                        </td>

                        <td className="py-3 px-4 data-text text-white font-semibold">
                          {threat.riskScore} <span className="text-slate-400 text-xs">/ 100</span>
                        </td>

                        <td className="py-3 px-4 data-text text-slate-400">
                          {threat.discoveredAt ? new Date(threat.discoveredAt).toLocaleDateString() : 'Today'}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={currentStatus}
                            onChange={(e) => handleUpdateStatus(threat.id, e.target.value as OperationalStatus)}
                            className="bg-[#0D0722] border border-purple-900/50 text-xs font-sans text-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-pink-500/50"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s} className="bg-[#130D2E] text-white">{s}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-400 font-sans whitespace-nowrap">
                          {threat.assignedAnalyst || 'SOC Analyst'}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/threat/${threat.id}`}
                            className="button-text text-pink-400 hover:text-pink-300 transition inline-flex items-center gap-1 font-sans"
                          >
                            <span>Investigate</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
