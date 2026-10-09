'use client';

import React from 'react';
import { Download } from 'lucide-react';

export default function ThreatDistributionChart() {
  const threatTypes = [
    { name: 'Fake Profiles', count: 4820, percent: 38, color: '#C93643' },
    { name: 'Brand Impersonation', count: 3240, percent: 25, color: '#D95F36' },
    { name: 'Scam Accounts', count: 2160, percent: 17, color: '#B7791F' },
    { name: 'Rogue Mobile Apps', count: 1420, percent: 11, color: '#3974C6' },
    { name: 'Phishing Domains', count: 1202, percent: 9, color: '#477A60' },
  ];

  const severityBreakdown = [
    { label: 'Critical', count: 1842, percent: 14, color: '#C93643' },
    { label: 'High', count: 4920, percent: 38, color: '#D95F36' },
    { label: 'Medium', count: 3850, percent: 30, color: '#B7791F' },
    { label: 'Low', count: 2230, percent: 18, color: '#3974C6' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── CARD 1: BREAKDOWN BY THREAT VECTOR ── */}
      <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="px-5 py-4 border-b border-[#DDE2DC] flex items-center justify-between bg-[#FFFFFF]">
            <div>
              <h3 className="text-[16px] font-bold text-[#202723] tracking-tight">
                Threat Distribution by Vector
              </h3>
              <p className="text-[13px] text-[#626B65] mt-0.5">
                Proportion of detected risks across brand attack surfaces.
              </p>
            </div>
            <button
              title="Export Data"
              className="p-2 rounded-lg text-[#626B65] hover:text-[#202723] hover:bg-[#ECEFEC] transition-colors cursor-pointer border border-[#DDE2DC]"
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
                    <span className="text-[#202723] font-medium">{t.name}</span>
                  </div>
                  <div className="font-mono text-[13px] tabular-nums">
                    <span className="text-[#202723] font-semibold">{t.count.toLocaleString()}</span>
                    <span className="text-[#858D86] ml-2">({t.percent}%)</span>
                  </div>
                </div>
                {/* Segmented Progress Bar */}
                <div className="h-2 w-full bg-[#ECEFEC] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${t.percent}%`, backgroundColor: t.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#DDE2DC] bg-[#F7F8F6] text-[12px] text-[#858D86] flex justify-between">
          <span>Active Attack Surface Vectors: 5</span>
          <span className="font-mono text-[#626B65]">Telemetry live</span>
        </div>
      </div>

      {/* ── CARD 2: RISK SEVERITY BREAKDOWN ── */}
      <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl overflow-hidden flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="px-5 py-4 border-b border-[#DDE2DC] flex items-center justify-between bg-[#FFFFFF]">
            <div>
              <h3 className="text-[16px] font-bold text-[#202723] tracking-tight">
                Severity Stratification
              </h3>
              <p className="text-[13px] text-[#626B65] mt-0.5">
                Categorization of active threats by impact severity level.
              </p>
            </div>
            <button
              title="Export Data"
              className="p-2 rounded-lg text-[#626B65] hover:text-[#202723] hover:bg-[#ECEFEC] transition-colors cursor-pointer border border-[#DDE2DC]"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Cumulative Severity Bar */}
            <div className="space-y-2">
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-[#ECEFEC]">
                {severityBreakdown.map((s) => (
                  <div
                    key={s.label}
                    style={{ width: `${s.percent}%`, backgroundColor: s.color }}
                    title={`${s.label}: ${s.percent}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-[#858D86] font-mono">
                <span>0%</span>
                <span>Cumulative Risk Profile</span>
                <span>100%</span>
              </div>
            </div>

            {/* List of severities */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {severityBreakdown.map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-lg bg-[#F7F8F6] border border-[#DDE2DC] flex flex-col justify-between"
                >
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: s.color }}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between font-mono">
                    <span className="text-[18px] font-bold text-[#202723] tabular-nums">
                      {s.count.toLocaleString()}
                    </span>
                    <span className="text-[12px] text-[#858D86]">{s.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#DDE2DC] bg-[#F7F8F6] text-[12px] text-[#858D86] flex justify-between">
          <span>Total Classified: 12,842 assets</span>
          <span className="font-mono text-[#347653]">100% correlated</span>
        </div>
      </div>
    </div>
  );
}
