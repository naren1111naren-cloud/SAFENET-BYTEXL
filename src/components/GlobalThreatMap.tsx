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
    <div className="bg-[#0E0E0E] border border-[#222222] rounded-[6px] overflow-hidden">
      {/* ── CARD HEADER ── */}
      <div className="px-5 py-3.5 border-b border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E0E0E]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-white tracking-[-0.01em]">
              Origin Telemetry & Infrastructure Map
            </h3>
            <span className="text-[11px] font-mono text-[#F38020] bg-[#F38020]/15 px-2 py-0.5 rounded border border-[#F38020]/30 font-semibold">
              Global ASNs
            </span>
          </div>
          <p className="text-[12px] text-[#A0A0A0] mt-0.5">
            Geographic hosting density of detected counterfeit entities, lookalike servers, and rogue APK endpoints.
          </p>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="flex items-center p-0.5 rounded bg-black border border-[#222222] text-[11px]">
            <button
              onClick={() => setActiveLayer('threats')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeLayer === 'threats' ? 'bg-[#222222] text-white font-medium' : 'text-[#767676] hover:text-white'
              }`}
            >
              All Threats
            </button>
            <button
              onClick={() => setActiveLayer('phishing')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeLayer === 'phishing' ? 'bg-[#222222] text-white font-medium' : 'text-[#767676] hover:text-white'
              }`}
            >
              Phishing
            </button>
            <button
              onClick={() => setActiveLayer('bots')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeLayer === 'bots' ? 'bg-[#222222] text-white font-medium' : 'text-[#767676] hover:text-white'
              }`}
            >
              Rogue APKs
            </button>
          </div>

          <button
            title="Download CSV"
            className="p-1.5 rounded text-[#767676] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── MAP & TELEMETRY SPLIT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Map Visual (2 cols) */}
        <div className="lg:col-span-2 p-5 bg-black relative border-b lg:border-b-0 lg:border-r border-[#222222] min-h-[300px] flex items-center justify-center">
          {/* Vector Grid Backdrop */}
          <div className="w-full h-full absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 1000 500" className="w-full h-full object-cover">
              {[100, 200, 300, 400].map((y) => (
                <line key={`lat-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke="#444444" strokeDasharray="4 4" strokeWidth="0.5" />
              ))}
              {[200, 400, 600, 800].map((x) => (
                <line key={`lon-${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#444444" strokeDasharray="4 4" strokeWidth="0.5" />
              ))}
            </svg>
          </div>

          {/* Region Beacon Markers */}
          <div className="w-full h-64 sm:h-72 relative">
            {REGIONS.map((region) => {
              const isSelected = selectedRegion.id === region.id;
              const beaconColor =
                region.severity === 'CRITICAL' ? '#EB364B' : region.severity === 'HIGH' ? '#F38020' : '#FDBA3B';

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
                    className={`relative h-4 w-4 rounded-full border-2 border-black shadow-md flex items-center justify-center transition-transform ${
                      isSelected ? 'scale-125 ring-2 ring-white' : 'group-hover:scale-110'
                    }`}
                    style={{ backgroundColor: beaconColor }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>

                  <div className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-[#141414] border border-[#262626] text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none shadow-lg">
                    {region.name} ({region.threatCount})
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-[#555555] flex items-center gap-2">
            <span>● CRITICAL (&gt;90)</span>
            <span>● HIGH (70-90)</span>
            <span>● MEDIUM (&lt;70)</span>
          </div>
        </div>

        {/* Selected Region Telemetry Drawer (1 col) */}
        <div className="p-5 bg-[#0E0E0E] flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#767676] font-semibold">
                  Selected Origin
                </span>
                <h4 className="text-[16px] font-semibold text-white mt-0.5">
                  {selectedRegion.name} ({selectedRegion.countryCode})
                </h4>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  selectedRegion.severity === 'CRITICAL'
                    ? 'badge-critical'
                    : selectedRegion.severity === 'HIGH'
                    ? 'badge-high'
                    : 'badge-medium'
                }`}
              >
                {selectedRegion.severity}
              </span>
            </div>

            <div className="space-y-3 font-mono text-[12px]">
              <div className="flex items-center justify-between py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#A0A0A0]">Observed Threats:</span>
                <span className="text-white font-semibold tabular-nums">
                  {selectedRegion.threatCount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#A0A0A0]">Velocity Delta:</span>
                <span className="text-[#00B37E] font-semibold flex items-center gap-0.5">
                  <ArrowUpRight className="h-3 w-3" />
                  {selectedRegion.changeRate}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#A0A0A0]">Risk Severity Score:</span>
                <span className="text-[#EB364B] font-bold">{selectedRegion.riskScore} / 100</span>
              </div>
              <div className="py-1.5 border-b border-[#1C1C1C]">
                <span className="text-[#767676] block text-[11px] uppercase">Primary Attack Vector:</span>
                <span className="text-white text-[12px] font-sans font-medium mt-0.5 block">
                  {selectedRegion.topCategory}
                </span>
              </div>
              <div className="py-1">
                <span className="text-[#767676] block text-[11px] uppercase">Target Sector:</span>
                <span className="text-[#A0A0A0] text-[12px] font-sans mt-0.5 block">
                  {selectedRegion.topTargetSector}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#222222]">
            <button
              onClick={() => (window.location.href = `/monitoring?tab=threats`)}
              className="w-full py-2 px-3 rounded bg-[#1A1A1A] hover:bg-[#252525] text-white text-[12px] font-semibold transition-colors cursor-pointer text-center"
            >
              Filter Telemetry by {selectedRegion.countryCode} →
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD FOOTER ── */}
      <div className="px-5 py-2.5 border-t border-[#222222] bg-[#080808] flex items-center justify-between text-[11px] text-[#767676]">
        <span>GeoIP & ASN Telemetry Engine v2.4</span>
        <span className="font-mono">5 Active Surveillance Nodes</span>
      </div>
    </div>
  );
}
