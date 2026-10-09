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
    danger: '#FF5C6C',
    warning: '#FFCD4D',
    success: '#35D0BA',
    info: '#64A9FF',
  };

  const numberColor = accentColors[variant];

  return (
    <div className="py-2 px-1 flex flex-col justify-between transition-colors group">
      {/* Label and Icon Header */}
      <div className="flex items-center justify-between text-[#FFFFFF] gap-2">
        <div className="text-[19px] font-bold text-[#FFFFFF] tracking-tight">
          {title}
        </div>
        {Icon ? (
          <div className="p-2 rounded-lg bg-[#121821] text-[#35D0BA] border border-[#303946]/60">
            <Icon className="h-5 w-5" />
          </div>
        ) : (
          <Info className="h-4 w-4 text-[#D0D7E0]" />
        )}
      </div>

      {/* Large Bold Statistic */}
      <div className="my-2.5">
        <div
          className="text-[42px] sm:text-[52px] font-extrabold tabular-nums leading-none tracking-[-0.03em]"
          style={{ color: numberColor }}
        >
          {value}
        </div>
      </div>

      {/* Floating Metadata & Change Rate */}
      <div className="flex items-center justify-between text-[16px] text-[#D0D7E0] font-bold pt-2 border-t border-[#303946]/80">
        <span className="truncate text-[#D0D7E0]">{subtitle || 'Live telemetry'}</span>
        {changeRate && (
          <span
            className={`flex items-center font-bold text-[16px] ${
              isPositiveChange ? 'text-[#35D0BA]' : 'text-[#FF5C6C]'
            }`}
          >
            {isPositiveChange ? (
              <ArrowUpRight className="h-4 w-4 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-0.5" />
            )}
            {changeRate}
          </span>
        )}
      </div>
    </div>
  );
}
