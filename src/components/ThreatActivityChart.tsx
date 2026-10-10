'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';

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
    <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl overflow-hidden flex flex-col justify-between shadow-sm">
      {/* ── HEADER & CONTROLS ── */}
      <div className="px-6 py-5 border-b border-[#1E2638] flex flex-wrap items-center justify-between gap-4 bg-[#0E131F]">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-[22px] font-bold text-[#FFFFFF] tracking-tight">
              Threat Activity Timeline
            </h3>
            <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#F6821F] bg-[#F6821F]/15 px-2.5 py-0.5 rounded-full border border-[#F6821F]/30 font-mono">
              <span className="h-2 w-2 rounded-full bg-[#F6821F] animate-pulse" />
              Live Ingestion
            </span>
          </div>
          <p className="text-[16px] text-[#9CA3AF] font-bold mt-1">
            Real-time multi-vector detection and mitigation timeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#111625] p-1 rounded-lg border border-[#1E2638] text-[15px] font-bold">
            <button
              onClick={() => setViewMode('total')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'total' ? 'bg-[#F6821F] text-[#FFFFFF]' : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setViewMode('vectors')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'vectors' ? 'bg-[#F6821F] text-[#FFFFFF]' : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
              }`}
            >
              Vectors
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-[#111625] p-1 rounded-lg border border-[#1E2638] text-[15px] font-bold">
            {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setRange(t);
                  setHoveredIdx(null);
                }}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  range === t ? 'bg-[#F6821F] text-[#FFFFFF]' : 'text-[#9CA3AF] hover:text-[#FFFFFF]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            title="Download CSV"
            className="p-2.5 rounded-lg text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#111625] transition-colors cursor-pointer border border-[#1E2638]"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── STAT SUMMARY STRIP ── */}
      <div className="px-6 py-4 border-b border-[#1E2638] bg-[#111625] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[14px] font-mono uppercase text-[#9CA3AF] font-bold">Interval:</span>
          <span className="text-[16px] font-bold text-[#FFFFFF] font-mono">{activePoint.time}</span>
        </div>

        <div className="flex items-center gap-6 text-[15px] font-mono font-bold">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F6821F]" />
            <span className="text-[#9CA3AF]">Detected:</span>
            <span className="text-[#FFFFFF] tabular-nums">{activePoint.detected.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF4D4D]" />
            <span className="text-[#9CA3AF]">Impersonations:</span>
            <span className="text-[#FF4D4D] tabular-nums">{activePoint.impersonation.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2C7BE5]" />
            <span className="text-[#9CA3AF]">Remediated:</span>
            <span className="text-[#2C7BE5] tabular-nums">{activePoint.blocked.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── CHART SVG CANVAS ── */}
      <div className="p-6 bg-[#0E131F]">
        <div className="w-full relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-56 sm:h-64 overflow-visible"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="radarOrangeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F6821F" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#F6821F" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="radarRedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4D4D" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#FF4D4D" stopOpacity="0.0" />
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
                    stroke="#1E2638"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="4"
                    y={y - 6}
                    fill="#9CA3AF"
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
            <path d={generateAreaPath('detected')} fill="url(#radarOrangeGrad)" />
            {viewMode === 'vectors' && (
              <path d={generateAreaPath('impersonation')} fill="url(#radarRedGrad)" />
            )}

            {/* Trend Lines */}
            <path
              d={generateLinePath('detected')}
              fill="none"
              stroke="#F6821F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {viewMode === 'vectors' && (
              <path
                d={generateLinePath('impersonation')}
                fill="none"
                stroke="#FF4D4D"
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
                stroke="#F6821F"
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
                  <rect
                    x={detectedCoord.x - width / points.length / 2}
                    y={0}
                    width={width / points.length}
                    height={height}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                  />

                  <circle
                    cx={detectedCoord.x}
                    cy={detectedCoord.y}
                    r={isHovered ? 6 : 4}
                    fill="#080B11"
                    stroke="#F6821F"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-150 pointer-events-none"
                  />
                </g>
              );
            })}
          </svg>

          {/* Time Labels */}
          <div className="flex justify-between text-[14px] font-mono text-[#9CA3AF] font-bold mt-3 px-1">
            {points.map((p, i) => (
              <span key={i} className="text-center">{p.time}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
