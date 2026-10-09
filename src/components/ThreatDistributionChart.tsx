'use client';

import React from 'react';
import { Download } from 'lucide-react';

export default function ThreatDistributionChart() {
  const threatTypes = [
    { name: 'Fake Profiles', count: 4820, percent: 38, color: '#EB364B' },
    { name: 'Brand Impersonation', count: 3240, percent: 25, color: '#F38020' },
    { name: 'Scam Accounts', count: 2160, percent: 17, color: '#FDBA3B' },
    { name: 'Rogue Mobile Apps', count: 1420, percent: 11, color: '#2F80ED' },
    { name: 'Phishing Domains', count: 1202, percent: 9, color: '#00B37E' },
  ];

  const severityBreakdown = [
    { label: 'Critical', count: 1842, percent: 14, color: '#EB364B' },
    { label: 'High', count: 4920, percent: 38, color: '#F38020' },
    { label: 'Medium', count: 3850, percent: 30, color: '#FDBA3B' },
    { label: 'Low', count: 2230, percent: 18, color: '#00B37E' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── CARD 1: BREAKDOWN BY THREAT VECTOR ── */}
      <div className="bg-[#0E0E0E] border border-[#222222] rounded-[6px] overflow-hidden flex flex-col justify-between">
        <div>
          <div className="px-5 py-3.5 border-b border-[#222222] flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-white tracking-[-0.01em]">
                Threat Distribution by Vector
              </h3>
              <p className="text-[12px] text-[#A0A0A0] mt-0.5">
                Proportion of detected risks across brand attack surfaces.
              </p>
            </div>
            <button
              title="Export Data"
              className="p-1.5 rounded text-[#767676] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {threatTypes.map((t) => (
              <div key={t.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-white font-medium">{t.name}</span>
                  </div>
                  <div className="font-mono text-[12px] tabular-nums">
                    <span className="text-white font-semibold">{t.count.toLocaleString()}</span>
                    <span className="text-[#767676] ml-2">({t.percent}%)</span>
                  </div>
                </div>
                {/* Segmented Progress Bar */}
                <div className="h-2 w-full bg-black rounded-[2px] overflow-hidden border border-[#1A1A1A]">
                  <div
                    className="h-full rounded-[2px] transition-all"
                    style={{ width: `${t.percent}%`, backgroundColor: t.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-2.5 border-t border-[#222222] bg-[#080808] flex items-center justify-between text-[11px] text-[#767676]">
          <span>Total Monitored Incidents: 12,842</span>
          <span className="font-mono">Global Surface</span>
        </div>
      </div>

      {/* ── CARD 2: BREAKDOWN BY SEVERITY TIER ── */}
      <div className="bg-[#0E0E0E] border border-[#222222] rounded-[6px] overflow-hidden flex flex-col justify-between">
        <div>
          <div className="px-5 py-3.5 border-b border-[#222222] flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-white tracking-[-0.01em]">
                Risk Classification by Severity
              </h3>
              <p className="text-[12px] text-[#A0A0A0] mt-0.5">
                Calculated CVSS & brand impact weighted tiers.
              </p>
            </div>
            <button
              title="Export Data"
              className="p-1.5 rounded text-[#767676] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-5 space-y-3">
            {severityBreakdown.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between py-2.5 px-3 rounded bg-[#080808] border border-[#1A1A1A]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[13px] font-semibold text-white">{s.label} Severity</span>
                </div>

                <div className="flex items-center gap-4 font-mono text-[13px] tabular-nums">
                  <span className="text-white font-semibold">{s.count.toLocaleString()}</span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded border"
                    style={{
                      color: s.color,
                      backgroundColor: `${s.color}18`,
                      borderColor: `${s.color}35`,
                    }}
                  >
                    {s.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-2.5 border-t border-[#222222] bg-[#080808] flex items-center justify-between text-[11px] text-[#767676]">
          <span>Automated Heuristic Classifier</span>
          <span className="font-mono">100% Scored</span>
        </div>
      </div>
    </div>
  );
}
