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
      <div className="max-w-6xl mx-auto space-y-10 pb-16">
        {/* ========================================================================= */}
        {/* 1. FILTER TABS & ACTIONS                                                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#1E2638] pb-5">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-[16px]">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-4 py-2 rounded-xl transition font-extrabold cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-[#F6821F] text-[#080B11]'
                  : 'bg-[#111625] border border-[#1E2638] text-[#9CA3AF] hover:text-[#FFFFFF]'
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
                  className={`px-4 py-2 rounded-xl transition font-extrabold cursor-pointer ${
                    selectedFilter === st
                      ? 'bg-[#F6821F] text-[#080B11]'
                      : 'bg-[#111625] border border-[#1E2638] text-[#9CA3AF] hover:text-[#FFFFFF]'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          <Link
            href="/check"
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#F6821F] hover:bg-[#2EB8A5] text-[#080B11] text-[17px] font-extrabold rounded-xl transition shadow-lg shrink-0"
          >
            <Plus className="h-4 w-4 text-[#080B11]" />
            <span>Check new artifact</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 2. OPERATIONAL TABLE (Open, Non-Boxy)                                     */}
        {/* ========================================================================= */}
        {filteredThreats.length === 0 ? (
          <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl p-16 text-center space-y-4 shadow-xl">
            <h3 className="text-[22px] font-extrabold text-[#FFFFFF]">No incidents match the active filter</h3>
            <p className="text-[18px] text-[#9CA3AF] max-w-md mx-auto font-bold">
              Investigate a suspicious link or change filters to review queued entities.
            </p>
            <div className="pt-2">
              <Link
                href="/check"
                className="font-mono text-[16px] text-[#F6821F] hover:text-[#2EB8A5] font-extrabold underline underline-offset-4"
              >
                Launch check instrument →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[18px]">
                <thead>
                  <tr className="bg-[#111625] border-b border-[#1E2638] text-[#9CA3AF] font-mono text-[14px] uppercase font-extrabold">
                    <th className="py-4 px-5">Severity</th>
                    <th className="py-4 px-5">Entity / Asset</th>
                    <th className="py-4 px-5">Vector</th>
                    <th className="py-4 px-5">Score</th>
                    <th className="py-4 px-5">First Seen</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-5">Analyst</th>
                    <th className="py-4 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2638]">
                  {filteredThreats.map((threat) => {
                    const isCrit = threat.riskScore >= 80;
                    const currentStatus = mapStatusToOperational(threat.status);

                    return (
                      <tr
                        key={threat.id}
                        onClick={() => router.push(`/threat/${threat.id}`)}
                        className="group hover:bg-[#111625] transition cursor-pointer"
                      >
                        <td className="py-4 px-5 font-mono text-[14px]">
                          <span
                            className={`font-extrabold px-3 py-1 rounded-md border ${
                              isCrit
                                ? 'text-[#FF5C6C] bg-[#2D1216] border-[#FF5C6C]/40'
                                : threat.riskScore >= 50
                                ? 'text-[#FFAB40] bg-[#2C1C0D] border-[#FFAB40]/40'
                                : 'text-[#F6821F] bg-[#0F2620] border-[#F6821F]/40'
                            }`}
                          >
                            {isCrit ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                          </span>
                        </td>

                        <td className="py-4 px-5 font-mono text-[18px] text-[#FFFFFF] font-extrabold max-w-xs truncate">
                          {threat.targetAsset}
                        </td>

                        <td className="py-4 px-5 text-[#9CA3AF] text-[16px] uppercase font-mono font-bold">
                          {threat.type.replace('_', ' ')}
                        </td>

                        <td className="py-4 px-5 font-mono text-[18px] text-[#FFFFFF] font-extrabold">
                          {threat.riskScore} <span className="text-[#9CA3AF] text-[14px] font-bold">/ 100</span>
                        </td>

                        <td className="py-4 px-5 font-mono text-[15px] text-[#9CA3AF] font-bold">
                          {threat.discoveredAt ? new Date(threat.discoveredAt).toLocaleDateString() : 'Today'}
                        </td>

                        <td className="py-4 px-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={currentStatus}
                            onChange={(e) => handleUpdateStatus(threat.id, e.target.value as OperationalStatus)}
                            className="bg-[#111625] border border-[#1E2638] text-[15px] font-mono text-[#FFFFFF] font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:border-[#F6821F]"
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s} className="bg-[#0E131F] text-[#FFFFFF]">{s}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-4 px-5 font-mono text-[15px] text-[#9CA3AF] font-bold whitespace-nowrap">
                          {threat.assignedAnalyst || 'SOC Analyst'}
                        </td>

                        <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/threat/${threat.id}`}
                            className="font-mono text-[16px] text-[#F6821F] hover:text-[#2EB8A5] font-extrabold transition inline-flex items-center gap-1.5"
                          >
                            <span>Investigate</span>
                            <ChevronRight className="h-4 w-4" />
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
