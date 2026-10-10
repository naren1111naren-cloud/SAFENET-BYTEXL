'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';

interface RegionData {
  id: string;
  name: string;
  countryCode: string;
  threatCount: number;
  changeRate: string;
  riskScore: number;
  topCategory: string;
  topTargetSector: string;
  incidents: number;
  x: number; // Percentage on map
  y: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

const REGIONS: RegionData[] = [
  {
    id: 'in',
    name: 'India',
    countryCode: 'IN',
    threatCount: 4281,
    changeRate: '+8.2%',
    riskScore: 94,
    topCategory: 'UPI VPA & Instant Refund Extortion',
    topTargetSector: 'Financial Services & UPI',
    incidents: 14,
    x: 68,
    y: 48,
    severity: 'CRITICAL',
  },
  {
    id: 'us',
    name: 'United States',
    countryCode: 'US',
    threatCount: 3120,
    changeRate: '+14.1%',
    riskScore: 78,
    topCategory: 'Typosquatting & Phishing Portals',
    topTargetSector: 'E-Commerce & Retail Brands',
    incidents: 12,
    x: 24,
    y: 34,
    severity: 'HIGH',
  },
  {
    id: 'eu',
    name: 'Germany / Netherlands',
    countryCode: 'DE/NL',
    threatCount: 2450,
    changeRate: '-3.4%',
    riskScore: 72,
    topCategory: 'Bulletproof ASN Proxy Hubs',
    topTargetSector: 'Hosting Infrastructure',
    incidents: 9,
    x: 52,
    y: 30,
    severity: 'HIGH',
  },
  {
    id: 'sg',
    name: 'Singapore / SE Asia',
    countryCode: 'SG',
    threatCount: 1840,
    changeRate: '+5.6%',
    riskScore: 68,
    topCategory: 'Rogue APK & Clone App Hosting',
    topTargetSector: 'Mobile Banking & Fintech',
    incidents: 5,
    x: 78,
    y: 56,
    severity: 'MEDIUM',
  },
  {
    id: 'ru',
    name: 'Eastern Europe / CIS',
    countryCode: 'RU',
    threatCount: 1151,
    changeRate: '+22.4%',
    riskScore: 91,
    topCategory: 'Cyrillic IDN Homoglyphs & Phish Kits',
    topTargetSector: 'Global Enterprise Portals',
    incidents: 7,
    x: 62,
    y: 26,
    severity: 'CRITICAL',
  },
];

export default function GlobalThreatMap() {
  const [selectedRegion, setSelectedRegion] = useState<RegionData>(REGIONS[0]);
  const [activeLayer, setActiveLayer] = useState<'threats' | 'phishing' | 'bots'>('threats');

  return (
    <div className="bg-[#0E131F] border border-[#1E2638] rounded-2xl overflow-hidden shadow-xl">
      {/* ── CARD HEADER ── */}
      <div className="px-6 py-5 border-b border-[#1E2638] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0E131F]">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-[20px] font-extrabold text-[#FFFFFF] tracking-[-0.01em]">
              Origin Telemetry & Infrastructure Map
            </h3>
            <span className="text-[14px] font-mono text-[#F6821F] bg-[#111625] px-2.5 py-1 rounded-md border border-[#1E2638] font-bold">
              Global ASNs
            </span>
          </div>
          <p className="text-[17px] text-[#9CA3AF] mt-1 font-bold">
            Geographic hosting density of detected counterfeit entities, lookalike servers, and rogue APK endpoints.
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center p-1 rounded-xl bg-[#080B11] border border-[#1E2638] text-[15px]">
            <button
              onClick={() => setActiveLayer('threats')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                activeLayer === 'threats' ? 'bg-[#111625] text-[#FFFFFF]' : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
              }`}
            >
              All Threats
            </button>
            <button
              onClick={() => setActiveLayer('phishing')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                activeLayer === 'phishing' ? 'bg-[#111625] text-[#FFFFFF]' : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
              }`}
            >
              Phishing
            </button>
            <button
              onClick={() => setActiveLayer('bots')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold ${
                activeLayer === 'bots' ? 'bg-[#111625] text-[#FFFFFF]' : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
              }`}
            >
              Rogue APKs
            </button>
          </div>

          <button
            title="Download CSV"
            className="p-2.5 rounded-xl text-[#9CA3AF] hover:text-[#FFFFFF] bg-[#111625] border border-[#1E2638] hover:bg-[#161D2F] transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── MAP & TELEMETRY SPLIT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Map Visual (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-[#080B11] relative border-b lg:border-b-0 lg:border-r border-[#1E2638] min-h-[320px] flex items-center justify-center">
          {/* Vector Grid Backdrop */}
          <div className="w-full h-full absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-full object-cover">
              {[100, 200, 300, 400].map((y) => (
                <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#1E2638" strokeDasharray="4 4" strokeWidth="0.8" />
              ))}
              {[200, 400, 600, 800].map((x) => (
                <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#1E2638" strokeDasharray="4 4" strokeWidth="0.8" />
              ))}
            </svg>
          </div>

          {/* Region Beacon Markers */}
          <div className="w-full h-64 sm:h-76 relative">
            {REGIONS.map((region) => {
              const isSelected = selectedRegion.id === region.id;
              const beaconColor =
                region.severity === 'CRITICAL' ? '#FF5C6C' : region.severity === 'HIGH' ? '#FFAB40' : '#64A9FF';

              return (
                <div
                  key={region.id}
                  onClick={() => setSelectedRegion(region)}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${region.x}%`, top: `${region.y}%` }}
                >
                  <span
                    className="absolute -inset-2 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: beaconColor }}
                  />

                  <div
                    className={`relative h-5 w-5 rounded-full border-2 border-[#080B11] shadow-md flex items-center justify-center transition-transform ${
                      isSelected ? 'scale-125 ring-2 ring-[#F6821F]' : 'group-hover:scale-110'
                    }`}
                    style={{ backgroundColor: beaconColor }}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#FFFFFF]" />
                  </div>

                  <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-lg bg-[#111625] border border-[#1E2638] text-[13px] font-mono text-[#FFFFFF] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-xl">
                    {region.name} ({region.threatCount})
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-4 left-4 text-[13px] font-mono text-[#9CA3AF] font-bold flex items-center gap-3">
            <span className="text-[#FF5C6C]">● CRITICAL (&gt;90)</span>
            <span className="text-[#FFAB40]">● HIGH (70-90)</span>
            <span className="text-[#64A9FF]">● MEDIUM (&lt;70)</span>
          </div>
        </div>

        {/* Selected Region Telemetry Drawer (1 col) */}
        <div className="p-6 bg-[#111625] flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#1E2638]">
              <div>
                <span className="text-[13px] font-mono uppercase tracking-wider text-[#F6821F] font-extrabold">
                  Selected Origin
                </span>
                <h4 className="text-[20px] font-extrabold text-[#FFFFFF] mt-0.5">
                  {selectedRegion.name} ({selectedRegion.countryCode})
                </h4>
              </div>
              <span
                className={`text-[13px] font-mono font-extrabold px-2.5 py-1 rounded-md border ${
                  selectedRegion.severity === 'CRITICAL'
                    ? 'bg-[#2D1216] text-[#FF5C6C] border-[#FF5C6C]/40'
                    : selectedRegion.severity === 'HIGH'
                    ? 'bg-[#2C1C0D] text-[#FFAB40] border-[#FFAB40]/40'
                    : 'bg-[#0F2620] text-[#F6821F] border-[#F6821F]/40'
                }`}
              >
                {selectedRegion.severity}
              </span>
            </div>

            <div className="space-y-3 font-mono text-[16px]">
              <div className="flex items-center justify-between py-2 border-b border-[#1E2638]">
                <span className="text-[#9CA3AF] font-bold">Observed Threats:</span>
                <span className="text-[#FFFFFF] font-extrabold tabular-nums">
                  {selectedRegion.threatCount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1E2638]">
                <span className="text-[#9CA3AF] font-bold">Velocity Delta:</span>
                <span className="text-[#F6821F] font-extrabold flex items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" />
                  {selectedRegion.changeRate}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1E2638]">
                <span className="text-[#9CA3AF] font-bold">Risk Severity Score:</span>
                <span className="text-[#FF5C6C] font-extrabold">{selectedRegion.riskScore} / 100</span>
              </div>
              <div className="py-2 border-b border-[#1E2638]">
                <span className="text-[#9CA3AF] block text-[14px] uppercase font-bold">Primary Attack Vector:</span>
                <span className="text-[#FFFFFF] text-[16px] font-sans font-bold mt-1 block">
                  {selectedRegion.topCategory}
                </span>
              </div>
              <div className="py-2">
                <span className="text-[#9CA3AF] block text-[14px] uppercase font-bold">Target Sector:</span>
                <span className="text-[#FFFFFF] text-[16px] font-sans font-bold mt-1 block">
                  {selectedRegion.topTargetSector}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E2638]">
            <button
              onClick={() => (window.location.href = `/monitoring?tab=threats`)}
              className="w-full py-3 px-4 rounded-xl bg-[#080B11] hover:bg-[#161D2F] border border-[#1E2638] text-[#FFFFFF] text-[16px] font-extrabold transition-colors cursor-pointer text-center"
            >
              Filter Telemetry by {selectedRegion.countryCode} →
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD FOOTER ── */}
      <div className="px-6 py-3 border-t border-[#1E2638] bg-[#080B11] flex items-center justify-between text-[15px] text-[#9CA3AF] font-bold">
        <span>GeoIP &amp; ASN Telemetry Engine v2.4</span>
        <span className="font-mono text-[#F6821F]">5 Active Surveillance Nodes</span>
      </div>
    </div>
  );
}
