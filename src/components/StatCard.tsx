import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  changeRate?: string;
  isPositiveChange?: boolean;
  icon?: LucideIcon;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'info';
}

export default function StatCard({
  title,
  value,
  subtitle,
  changeRate,
  isPositiveChange,
  icon: Icon,
  variant = 'default',
}: StatCardProps) {
  const accentColors = {
    default: '#FFFFFF',
    danger: '#FF4D4D',
    warning: '#FBBF24',
    success: '#10B981',
    info: '#2C7BE5',
  };

  const numberColor = accentColors[variant];

  return (
    <div className="bg-[#130D2E]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:border-pink-500/40 hover:bg-[#1C1344]/90 group shadow-lg">
      {/* Label and Icon Header */}
      <div className="flex items-center justify-between text-[#FFFFFF] gap-2 mb-2">
        <div className="text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider leading-snug truncate">
          {title}
        </div>
        {Icon ? (
          <div className="p-1.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 group-hover:border-pink-500/40 transition-colors flex-shrink-0">
            <Icon className="h-4 w-4" />
          </div>
        ) : (
          <Info className="h-3.5 w-3.5 text-purple-400/60 flex-shrink-0" />
        )}
      </div>

      {/* Clear Visible Statistic */}
      <div className="my-2">
        <div
          className="text-[28px] sm:text-[32px] font-bold font-mono tabular-nums leading-none tracking-tight"
          style={{ color: numberColor }}
        >
          {value}
        </div>
      </div>

      {/* Radar Metadata & Change Rate */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-normal pt-2.5 border-t border-purple-900/30">
        <span className="truncate text-slate-400">{subtitle || 'Live radar telemetry'}</span>
        {changeRate && (
          <span
            className={`flex items-center font-mono font-medium text-xs px-2 py-0.5 rounded-full ${
              isPositiveChange
                ? 'text-[#00F5A0] bg-[#00F5A0]/10 border border-[#00F5A0]/30'
                : 'text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/30'
            }`}
          >
            {isPositiveChange ? (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            )}
            {changeRate}
          </span>
        )}
      </div>
    </div>
  );
}
