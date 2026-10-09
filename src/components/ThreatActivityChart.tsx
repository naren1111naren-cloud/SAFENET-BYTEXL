'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Download } from 'lucide-react';

type TimeRange = '24h' | '7d' | '30d' | '90d';
type ViewMode = 'total' | 'vectors';

interface DataPoint {
  time: string;
  detected: number;
  impersonation: number;
  scams: number;
  blocked: number;
}

const DATA_SETS: Record<TimeRange, DataPoint[]> = {
  '24h': [
    { time: '00:00', detected: 48, impersonation: 22, scams: 18, blocked: 44 },
    { time: '04:00', detected: 32, impersonation: 14, scams: 12, blocked: 30 },
    { time: '08:00', detected: 89, impersonation: 41, scams: 32, blocked: 82 },
    { time: '12:00', detected: 142, impersonation: 65, scams: 51, blocked: 131 },
    { time: '16:00', detected: 178, impersonation: 84, scams: 63, blocked: 165 },
    { time: '20:00', detected: 124, impersonation: 58, scams: 45, blocked: 114 },
    { time: 'Now', detected: 105, impersonation: 49, scams: 38, blocked: 98 },
  ],
  '7d': [
    { time: 'Mon', detected: 420, impersonation: 195, scams: 140, blocked: 380 },
    { time: 'Tue', detected: 510, impersonation: 240, scams: 170, blocked: 460 },
    { time: 'Wed', detected: 680, impersonation: 310, scams: 230, blocked: 610 },
    { time: 'Thu', detected: 890, impersonation: 420, scams: 310, blocked: 805 },
    { time: 'Fri', detected: 740, impersonation: 350, scams: 250, blocked: 670 },
    { time: 'Sat', detected: 390, impersonation: 180, scams: 130, blocked: 350 },
    { time: 'Sun', detected: 460, impersonation: 215, scams: 155, blocked: 410 },
  ],
  '30d': [
    { time: 'Week 1', detected: 2400, impersonation: 1100, scams: 800, blocked: 2150 },
    { time: 'Week 2', detected: 3100, impersonation: 1450, scams: 1020, blocked: 2800 },
    { time: 'Week 3', detected: 2850, impersonation: 1300, scams: 950, blocked: 2540 },
    { time: 'Week 4', detected: 3450, impersonation: 1620, scams: 1180, blocked: 3100 },
  ],
  '90d': [
    { time: 'Month 1', detected: 9800, impersonation: 4600, scams: 3300, blocked: 8850 },
    { time: 'Month 2', detected: 11200, impersonation: 5200, scams: 3800, blocked: 10100 },
    { time: 'Month 3', detected: 12842, impersonation: 5980, scams: 4320, blocked: 11520 },
  ],
};

export default function ThreatActivityChart() {
  const [range, setRange] = useState<TimeRange>('7d');
  const [viewMode, setViewMode] = useState<ViewMode>('total');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const points = DATA_SETS[range];
  const maxVal = Math.max(...points.map((p) => p.detected)) * 1.15;
  const height = 240;
  const width = 640;

  const getCoordinates = (val: number, idx: number) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - (val / maxVal) * (height - 30) - 15;
    return { x, y };
  };

  const generateLinePath = (key: keyof DataPoint) => {
    return points
      .map((p, i) => {
        const { x, y } = getCoordinates(p[key] as number, i);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const generateAreaPath = (key: keyof DataPoint) => {
    const linePath = generateLinePath(key);
    const lastX = width;
    const firstX = 0;
    const bottomY = height;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className="bg-[#0D1118] border border-[#303946] rounded-xl overflow-hidden flex flex-col justify-between">
      {/* ── HEADER & CONTROLS ── */}
      <div className="px-6 py-5 border-b border-[#303946] flex flex-wrap items-center justify-between gap-4 bg-[#0D1118]">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-[22px] font-bold text-[#FFFFFF] tracking-tight">
              Threat Activity Timeline
            </h3>
            <span className="flex items-center gap-1.5 text-[15px] font-bold text-[#35D0BA] bg-[#35D0BA]/15 px-2.5 py-0.5 rounded-full border border-[#35D0BA]/30">
              <span className="h-2 w-2 rounded-full bg-[#35D0BA] animate-pulse" />
              Live Ingestion
            </span>
          </div>
          <p className="text-[17px] text-[#D0D7E0] font-bold mt-1">
            Real-time multi-vector detection and automatic mitigation rate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#121821] p-1 rounded-lg border border-[#303946] text-[16px] font-bold">
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'total' ? 'bg-[#35D0BA] text-[#080B10]' : 'text-[#FFFFFF] hover:text-[#35D0BA]'
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setViewMode('vectors')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'vectors' ? 'bg-[#35D0BA] text-[#080B10]' : 'text-[#FFFFFF] hover:text-[#35D0BA]'
              }`}
            >
              Vectors
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-[#121821] p-1 rounded-lg border border-[#303946] text-[16px] font-bold">
            {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setRange(t);
                  setHoveredIdx(null);
                }}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  range === t ? 'bg-[#35D0BA] text-[#080B10]' : 'text-[#FFFFFF] hover:text-[#35D0BA]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            title="Download CSV"
            className="p-2.5 rounded-lg text-[#FFFFFF] hover:text-[#35D0BA] hover:bg-[#121821] transition-colors cursor-pointer border border-[#303946]"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── STAT SUMMARY STRIP ── */}
      <div className="px-6 py-4 border-b border-[#303946] bg-[#121821] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-mono uppercase text-[#D0D7E0] font-bold">Active Interval:</span>
          <span className="text-[17px] font-bold text-[#FFFFFF] font-mono">{activePoint.time}</span>
        </div>

        <div className="flex items-center gap-6 text-[16px] font-mono font-bold">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#35D0BA]" />
            <span className="text-[#D0D7E0]">Detected:</span>
            <span className="text-[#FFFFFF] tabular-nums">{activePoint.detected.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5C6C]" />
            <span className="text-[#D0D7E0]">Impersonations:</span>
            <span className="text-[#FF5C6C] tabular-nums">{activePoint.impersonation.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#64A9FF]" />
            <span className="text-[#D0D7E0]">Remediated:</span>
            <span className="text-[#64A9FF] tabular-nums">{activePoint.blocked.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── CHART SVG CANVAS ── */}
      <div className="p-6 bg-[#0D1118]">
        <div className="w-full relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56 sm:h-64 overflow-visible"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="cyberTealGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#35D0BA" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#35D0BA" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="cyberRedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C6C" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FF5C6C" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = height - ratio * (height - 30) - 15;
              const val = Math.round(ratio * maxVal);
              return (
                <g key={ratio}>
                  <line
                    x1="0"
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke="#1E2633"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="4"
                    y={y - 6}
                    fill="#D0D7E0"
                    fontSize="13"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area Fills */}
            <path d={generateAreaPath('detected')} fill="url(#cyberTealGrad)" />
            {viewMode === 'vectors' && (
              <path d={generateAreaPath('impersonation')} fill="url(#cyberRedGrad)" />
            )}

            {/* Trend Lines */}
            <path
              d={generateLinePath('detected')}
              fill="none"
              stroke="#35D0BA"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {viewMode === 'vectors' && (
              <path
                d={generateLinePath('impersonation')}
                fill="none"
                stroke="#FF5C6C"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}

            {/* Hover Interaction Vertical Line */}
            {hoveredIdx !== null && (
              <line
                x1={getCoordinates(points[hoveredIdx].detected, hoveredIdx).x}
                y1={0}
                x2={getCoordinates(points[hoveredIdx].detected, hoveredIdx).x}
                y2={height}
                stroke="#35D0BA"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Data Point Dots & Hitboxes */}
            {points.map((p, i) => {
              const detectedCoord = getCoordinates(p.detected, i);
              const isHovered = hoveredIdx === i;

              return (
                <g key={i}>
                  {/* Invisible wide hitbox */}
                  <rect
                    x={detectedCoord.x - width / points.length / 2}
                    y={0}
                    width={width / points.length}
                    height={height}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                  />

                  {/* Detected Node */}
                  <circle
                    cx={detectedCoord.x}
                    cy={detectedCoord.y}
                    r={isHovered ? 6 : 4}
                    fill="#080B10"
                    stroke="#35D0BA"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-150 pointer-events-none"
                  />
                </g>
              );
            })}
          </svg>

          {/* Time Labels */}
          <div className="flex justify-between text-[15px] font-mono text-[#D0D7E0] font-bold mt-3 px-1">
            {points.map((p, i) => (
              <span key={i} className="text-center">{p.time}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
