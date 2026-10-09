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
  const height = 220;
  const width = 640;

  const getCoordinates = (val: number, idx: number) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - (val / maxVal) * (height - 30) - 15;
    return { x, y };
  };

  const generateLinePath = (key: keyof DataPoint) => {
    return points
      .map((p, idx) => {
        const val = typeof p[key] === 'number' ? (p[key] as number) : 0;
        const { x, y } = getCoordinates(val, idx);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const generateAreaPath = (key: keyof DataPoint) => {
    const line = generateLinePath(key);
    return `${line} L ${width} ${height} L 0 ${height} Z`;
  };

  const activeIdx = hoveredIdx !== null ? hoveredIdx : points.length - 1;
  const activePoint = points[activeIdx];

  return (
    <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* ── CARD HEADER ── */}
      <div className="px-5 py-4 border-b border-[#DDE2DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-[#202723] tracking-tight">
              Threat Activity & Attack Volume
            </h3>
            <span className="text-[12px] font-mono font-medium text-[#347653] flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              +14.2%
            </span>
          </div>
          <p className="text-[13px] text-[#626B65] mt-0.5">
            Temporal telemetry of fraudulent profiles, impersonation, and payment scams.
          </p>
        </div>

        {/* Card Controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Mode toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#ECEFEC] border border-[#DDE2DC] text-[12px]">
            <button
              onClick={() => setViewMode('total')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'total' ? 'bg-[#FFFFFF] text-[#202723] font-semibold shadow-xs' : 'text-[#626B65] hover:text-[#202723]'
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setViewMode('vectors')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'vectors' ? 'bg-[#FFFFFF] text-[#202723] font-semibold shadow-xs' : 'text-[#626B65] hover:text-[#202723]'
              }`}
            >
              Vectors
            </button>
          </div>

          {/* Range toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#ECEFEC] border border-[#DDE2DC] text-[12px] font-mono">
            {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setRange(t);
                  setHoveredIdx(null);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  range === t ? 'bg-[#477A60] text-[#FFFFFF] font-semibold shadow-xs' : 'text-[#626B65] hover:text-[#202723]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            title="Download CSV"
            className="p-2 rounded-lg text-[#626B65] hover:text-[#202723] hover:bg-[#ECEFEC] transition-colors cursor-pointer border border-[#DDE2DC]"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── STAT SUMMARY STRIP ── */}
      <div className="px-5 py-3 border-b border-[#DDE2DC] bg-[#F7F8F6] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-mono uppercase text-[#858D86] font-semibold">Active Interval:</span>
          <span className="text-[13px] font-semibold text-[#202723] font-mono">{activePoint.time}</span>
        </div>

        <div className="flex items-center gap-6 text-[13px] font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#477A60]" />
            <span className="text-[#626B65]">Detected:</span>
            <span className="text-[#202723] font-semibold tabular-nums">{activePoint.detected.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C93643]" />
            <span className="text-[#626B65]">Impersonations:</span>
            <span className="text-[#C93643] font-semibold tabular-nums">{activePoint.impersonation.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#347653]" />
            <span className="text-[#626B65]">Remediated:</span>
            <span className="text-[#347653] font-semibold tabular-nums">{activePoint.blocked.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── CHART SVG CANVAS ── */}
      <div className="p-5 bg-[#FFFFFF]">
        <div className="w-full relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-48 sm:h-56 overflow-visible"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id="omSageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#477A60" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#477A60" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="omRedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C93643" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#C93643" stopOpacity="0.0" />
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
                    stroke="#DDE2DC"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <text
                    x="4"
                    y={y - 4}
                    fill="#858D86"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area Fills */}
            <path d={generateAreaPath('detected')} fill="url(#omSageGrad)" />
            {viewMode === 'vectors' && (
              <path d={generateAreaPath('impersonation')} fill="url(#omRedGrad)" />
            )}

            {/* Primary Detected Line */}
            <path
              d={generateLinePath('detected')}
              fill="none"
              stroke="#477A60"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Vector Lines */}
            {viewMode === 'vectors' && (
              <>
                <path
                  d={generateLinePath('impersonation')}
                  fill="none"
                  stroke="#C93643"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={generateLinePath('scams')}
                  fill="none"
                  stroke="#D95F36"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeDasharray="4 2"
                />
              </>
            )}

            {/* Interactive Points */}
            {points.map((p, idx) => {
              const { x, y } = getCoordinates(p.detected, idx);
              const isHovered = activeIdx === idx;
              return (
                <g
                  key={p.time}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  className="cursor-pointer"
                >
                  <rect
                    x={x - 20}
                    y={0}
                    width={40}
                    height={height}
                    fill="transparent"
                  />

                  {isHovered && (
                    <line
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={height}
                      stroke="#477A60"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 5 : 3.5}
                    fill={isHovered ? '#FFFFFF' : '#477A60'}
                    stroke="#202723"
                    strokeWidth="2"
                  />
                </g>
              );
            })}

            {/* X-Axis */}
            {points.map((p, idx) => {
              const { x } = getCoordinates(0, idx);
              return (
                <text
                  key={p.time}
                  x={x}
                  y={height - 2}
                  textAnchor={idx === 0 ? 'start' : idx === points.length - 1 ? 'end' : 'middle'}
                  fill="#858D86"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {p.time}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── CARD FOOTER ── */}
      <div className="px-5 py-3 border-t border-[#DDE2DC] bg-[#F7F8F6] flex items-center justify-between text-[12px] text-[#858D86]">
        <span>Source: Safenet Telemetry Sensors • Monitored attack surfaces</span>
        <span className="font-mono text-[#626B65]">Telemetry active</span>
      </div>
    </div>
  );
}
