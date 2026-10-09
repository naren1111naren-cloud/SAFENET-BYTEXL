'use client';

import React from 'react';
import { Download } from 'lucide-react';

export default function ThreatDistributionChart() {
  const threatTypes = [
    { name: 'Fake Profiles', count: 4820, percent: 38, color: '#FF5C6C' },
    { name: 'Brand Impersonation', count: 3240, percent: 25, color: '#FF8E4D' },
    { name: 'Scam Accounts', count: 2160, percent: 17, color: '#FFCD4D' },
    { name: 'Rogue Mobile Apps', count: 1420, percent: 11, color: '#64A9FF' },
    { name: 'Phishing Domains', count: 1202, percent: 9, color: '#35D0BA' },
  ];

  const severityBreakdown = [
    { label: 'Critical', count: 1842, percent: 14, color: '#FF5C6C' },
    { label: 'High', count: 4920, percent: 38, color: '#FF8E4D' },
    { label: 'Medium', count: 3850, percent: 30, color: '#FFCD4D' },
    { label: 'Low', count: 2230, percent: 18, color: '#64A9FF' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* ── CARD 1: BREAKDOWN BY THREAT VECTOR ── */}
      <div className="bg-[#0D1118] border border-[#303946] rounded-xl overflow-hidden flex flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-[#303946] flex items-center justify-between bg-[#0D1118]">
            <div>
              <h3 className="text-[22px] font-bold text-[#FFFFFF] tracking-tight">
                Threat Distribution by Vector
              </h3>
              <p className="text-[17px] text-[#D0D7E0] font-bold mt-1">
                Proportion of detected risks across brand attack surfaces.
              </p>
            </div>
            <button
              title="Export Data"
              className="p-2.5 rounded-lg text-[#FFFFFF] hover:text-[#35D0BA] hover:bg-[#121821] transition-colors cursor-pointer border border-[#303946]"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {threatTypes.map((t) => (
              <div key={t.name} className="space-y-2">
                <div className="flex items-center justify-between text-[17px] font-bold">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-[#FFFFFF]">{t.name}</span>
                  </div>
                  <div className="font-mono text-[17px] tabular-nums font-bold">
                    <span className="text-[#FFFFFF]">{t.count.toLocaleString()}</span>
                    <span className="text-[#D0D7E0] ml-2 font-bold">({t.percent}%)</span>
                  </div>
                </div>
                {/* Segmented Progress Bar */}
                <div className="h-2.5 w-full bg-[#121821] rounded-full overflow-hidden border border-[#303946]/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${t.percent}%`, backgroundColor: t.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#303946] bg-[#121821] flex items-center justify-between text-[16px] text-[#D0D7E0] font-bold">
          <span>Total Catalogued Vectors</span>
          <span className="font-mono text-[#FFFFFF] text-[18px]">12,842 Indicators</span>
        </div>
      </div>

      {/* ── CARD 2: SEVERITY CLASSIFICATION ── */}
      <div className="bg-[#0D1118] border border-[#303946] rounded-xl overflow-hidden flex flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-[#303946] flex items-center justify-between bg-[#0D1118]">
            <div>
              <h3 className="text-[22px] font-bold text-[#FFFFFF] tracking-tight">
                Severity Breakdown &amp; Prioritization
              </h3>
              <p className="text-[17px] text-[#D0D7E0] font-bold mt-1">
                Automated risk-scoring tiered by active brand damage potential.
              </p>
            </div>
            <button
              title="Export Breakdown"
              className="p-2.5 rounded-lg text-[#FFFFFF] hover:text-[#35D0BA] hover:bg-[#121821] transition-colors cursor-pointer border border-[#303946]"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Visual Severity Segment Bar */}
            <div className="space-y-2.5">
              <div className="flex h-4 w-full rounded-lg overflow-hidden gap-1">
                {severityBreakdown.map((s) => (
                  <div
                    key={s.label}
                    style={{ width: `${s.percent}%`, backgroundColor: s.color }}
                    className="h-full transition-all duration-300"
                    title={`${s.label}: ${s.percent}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[14px] font-mono text-[#D0D7E0] font-bold">
                <span>Critical Priority (14%)</span>
                <span>Routine Observation (18%)</span>
              </div>
            </div>

            {/* Severity Detailed List */}
            <div className="space-y-4 pt-2">
              {severityBreakdown.map((s) => (
                <div
                  key={s.label}
                  className="p-3.5 rounded-lg bg-[#121821] border border-[#303946] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <div>
                      <span className="text-[18px] font-bold text-[#FFFFFF]">{s.label}</span>
                      <span className="text-[15px] text-[#D0D7E0] font-bold ml-2">
                        {s.label === 'Critical' ? 'Immediate Take-down' : s.label === 'High' ? 'Fast Quarantine' : 'Active Observation'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold">
                    <div className="text-[18px] text-[#FFFFFF] tabular-nums">{s.count.toLocaleString()}</div>
                    <div className="text-[14px] text-[#D0D7E0]">{s.percent}% of active queue</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#303946] bg-[#121821] flex items-center justify-between text-[16px] text-[#D0D7E0] font-bold">
          <span>Active Queue Capacity</span>
          <span className="font-mono text-[#35D0BA] text-[18px]">Operational • Nominal</span>
        </div>
      </div>
    </div>
  );
}
