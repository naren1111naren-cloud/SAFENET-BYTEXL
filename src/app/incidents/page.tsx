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
      <div className="max-w-6xl mx-auto space-y-12 pb-16">
        {/* ========================================================================= */}
        {/* 1. FILTER TABS & ACTIONS                                                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center gap-6 font-mono text-[12px]">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`pb-1 transition-colors cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'text-[#F2F4F3] border-b border-[#18E6A3] font-medium'
                  : 'text-[#59625F] hover:text-[#8A9390]'
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
                  className={`pb-1 transition-colors cursor-pointer ${
                    selectedFilter === st
                      ? 'text-[#F2F4F3] border-b border-[#18E6A3] font-medium'
                      : 'text-[#59625F] hover:text-[#8A9390]'
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>

          <Link
            href="/check"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2F4F3] text-[#080A0B] text-[12px] font-medium rounded-[2px] hover:bg-white transition-all shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Check new artifact</span>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* 2. CONTINUOUS OPERATIONAL TABLE                                           */}
        {/* ========================================================================= */}
        {filteredThreats.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <h3 className="text-[16px] font-normal text-[#F2F4F3]">No incidents match the active filter</h3>
            <p className="text-[13px] text-[#59625F] max-w-sm mx-auto">
              Investigate a suspicious link or change filters to review queued entities.
            </p>
            <div className="pt-2">
              <Link
                href="/check"
                className="font-mono text-[12px] text-[#8A9390] hover:text-[#F2F4F3] underline underline-offset-4"
              >
                Launch check instrument →
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] text-[#59625F] font-mono text-[11px] uppercase">
                  <th className="py-3 pr-4 font-normal">Severity</th>
                  <th className="py-3 px-4 font-normal">Entity / Asset</th>
                  <th className="py-3 px-4 font-normal">Vector</th>
                  <th className="py-3 px-4 font-normal">Score</th>
                  <th className="py-3 px-4 font-normal">First Seen</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Analyst</th>
                  <th className="py-3 pl-4 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                {filteredThreats.map((threat) => {
                  const isCrit = threat.riskScore >= 80;
                  const currentStatus = mapStatusToOperational(threat.status);

                  return (
                    <tr
                      key={threat.id}
                      onClick={() => router.push(`/threat/${threat.id}`)}
                      className="group hover:bg-[#0D1011] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pr-4 font-mono text-[11px]">
                        <span
                          className={
                            isCrit
                              ? 'text-[#FF5C5C]'
                              : threat.riskScore >= 50
                              ? 'text-[#F5B84B]'
                              : 'text-[#18E6A3]'
                          }
                        >
                          {isCrit ? 'CRITICAL' : threat.riskScore >= 50 ? 'HIGH' : 'EVALUATED'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[13px] text-[#F2F4F3] max-w-xs truncate">
                        {threat.targetAsset}
                      </td>

                      <td className="py-3.5 px-4 text-[#8A9390] text-[12px] uppercase font-mono">
                        {threat.type.replace('_', ' ')}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[13px] text-[#F2F4F3]">
                        {threat.riskScore} <span className="text-[#59625F] text-[10px]">/ 100</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#59625F]">
                        {threat.discoveredAt ? new Date(threat.discoveredAt).toLocaleDateString() : 'Today'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={currentStatus}
                          onChange={(e) => handleUpdateStatus(threat.id, e.target.value as OperationalStatus)}
                          className="bg-[#080A0B] border border-[rgba(255,255,255,0.12)] text-[11px] font-mono text-[#F2F4F3] rounded-[2px] px-2 py-1 outline-none cursor-pointer"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#8A9390] whitespace-nowrap">
                        {threat.assignedAnalyst || 'SOC Analyst'}
                      </td>

                      <td className="py-3.5 pl-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/threat/${threat.id}`}
                          className="font-mono text-[11px] text-[#8A9390] group-hover:text-[#F2F4F3] transition-colors inline-flex items-center gap-1"
                        >
                          <span>Investigate</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
