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
    <div className="bg-[#0E131F] border border-[#1E2638] rounded-xl p-5 flex flex-col justify-between transition-all hover:border-[#28334E] hover:bg-[#111625] group shadow-sm">
      {/* Label and Icon Header */}
      <div className="flex items-center justify-between text-[#FFFFFF] gap-2 mb-2">
        <div className="text-[16px] font-bold text-[#9CA3AF] uppercase tracking-wider">
          {title}
        </div>
        {Icon ? (
          <div className="p-2 rounded-lg bg-[#111625] text-[#F6821F] border border-[#1E2638] group-hover:border-[#F6821F]/40 transition-colors">
            <Icon className="h-5 w-5" />
          </div>
        ) : (
          <Info className="h-4 w-4 text-[#9CA3AF]" />
        )}
      </div>

      {/* Large Bold Statistic */}
      <div className="my-2">
        <div
          className="text-[42px] sm:text-[50px] font-extrabold tabular-nums leading-none tracking-[-0.03em]"
          style={{ color: numberColor }}
        >
          {value}
        </div>
      </div>

      {/* Radar Metadata & Change Rate */}
      <div className="flex items-center justify-between text-[15px] text-[#9CA3AF] font-bold pt-3 border-t border-[#1E2638]">
        <span className="truncate text-[#9CA3AF]">{subtitle || 'Live radar telemetry'}</span>
        {changeRate && (
          <span
            className={`flex items-center font-bold text-[15px] px-2 py-0.5 rounded ${
              isPositiveChange
                ? 'text-[#10B981] bg-[#10B981]/10'
                : 'text-[#FF4D4D] bg-[#FF4D4D]/10'
            }`}
          >
            {isPositiveChange ? (
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
            )}
            {changeRate}
          </span>
        )}
      </div>
    </div>
  );
}
