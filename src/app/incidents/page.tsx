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
      pageTitle="Incident Response Queue"
      pageSubtitle="Operational triage, status lifecycle, and mitigation workflow."
    >
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* ========================================================================= */}
        {/* 1. FILTER TABS & ACTIONS                                                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DDE2DC] pb-4">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition font-semibold ${
                selectedFilter === 'ALL'
                  ? 'bg-[#202723] text-white'
                  : 'bg-white border border-[#DDE2DC] text-[#626B65] hover:text-[#202723]'
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
                  className={`px-3 py-1.5 rounded-lg transition font-semibold ${
                    selectedFilter === st
                      ? 'bg-[#202723] text-white'
                      : 'bg-white border border-[#DDE2DC] text-[#626B65] hover:text-[#202723]'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#477A60] hover:bg-[#365F49] text-white text-[12px] font-bold rounded-lg transition shadow-xs shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Check new artifact</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 2. OPERATIONAL TABLE                                                      */}
        {/* ========================================================================= */}
        {filteredThreats.length === 0 ? (
          <div className="bg-white border border-[#DDE2DC] rounded-xl p-16 text-center space-y-3 shadow-xs">
            <h3 className="text-[16px] font-bold text-[#202723]">No incidents match the active filter</h3>
            <p className="text-[13px] text-[#626B65] max-w-sm mx-auto">
              Investigate a suspicious link or change filters to review queued entities.
            </p>
            <div className="pt-2">
              <Link
                href="/check"
                className="font-mono text-[12px] text-[#477A60] hover:text-[#365F49] font-bold underline underline-offset-4"
              >
                Launch check instrument →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#DDE2DC] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="bg-[#F7F8F6] border-b border-[#DDE2DC] text-[#858D86] font-mono text-[11px] uppercase font-bold">
                    <th className="py-3.5 px-4 font-bold">Severity</th>
                    <th className="py-3.5 px-4 font-bold">Entity / Asset</th>
                    <th className="py-3.5 px-4 font-bold">Vector</th>
                    <th className="py-3.5 px-4 font-bold">Score</th>
                    <th className="py-3.5 px-4 font-bold">First Seen</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold">Analyst</th>
                    <th className="py-3.5 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE2DC]">
                  {filteredThreats.map((threat) => {
                    const isCrit = threat.riskScore >= 80;
                    const currentStatus = mapStatusToOperational(threat.status);

                    return (
                      <tr
                        key={threat.id}
                        onClick={() => router.push(`/threat/${threat.id}`)}
                        className="group hover:bg-[#F7F8F6] transition cursor-pointer"
                      >
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full ${
                              isCrit
                                ? 'text-[#C93643] bg-[#C93643]/10 border border-[#C93643]/30'
                                : threat.riskScore >= 50
                                ? 'text-[#D95F36] bg-[#D95F36]/10 border border-[#D95F36]/30'
                                : 'text-[#347653] bg-[#347653]/10 border border-[#347653]/30'
                            }`}
                          >
                            {isCrit ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[13px] text-[#202723] font-bold max-w-xs truncate">
                          {threat.targetAsset}
                        </td>

                        <td className="py-3.5 px-4 text-[#626B65] text-[12px] uppercase font-mono">
                          {threat.type.replace('_', ' ')}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[13px] text-[#202723] font-bold">
                          {threat.riskScore} <span className="text-[#858D86] text-[10px] font-normal">/ 100</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#858D86]">
                          {threat.discoveredAt ? new Date(threat.discoveredAt).toLocaleDateString() : 'Today'}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={currentStatus}
                            onChange={(e) => handleUpdateStatus(threat.id, e.target.value as OperationalStatus)}
                            className="bg-white border border-[#DDE2DC] text-[11px] font-mono text-[#202723] rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:border-[#477A60]"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#626B65] whitespace-nowrap">
                          {threat.assignedAnalyst || 'SOC Analyst'}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/threat/${threat.id}`}
                            className="font-mono text-[12px] text-[#477A60] hover:text-[#365F49] font-bold transition inline-flex items-center gap-1"
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
