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
    danger: '#EB364B',
    warning: '#F38020',
    success: '#00B37E',
    info: '#2F80ED',
  };

  const numberColor = accentColors[variant];

  return (
    <div className="bg-[#0E0E0E] border border-[#222222] rounded-[6px] p-4 flex flex-col justify-between hover:border-[#383838] transition-colors">
      <div className="flex items-center justify-between text-[#A0A0A0]">
        <div className="text-[11px] font-mono uppercase tracking-wider font-semibold">
          {title}
        </div>
        {Icon ? (
          <Icon className="h-4 w-4 text-[#767676]" />
        ) : (
          <Info className="h-3.5 w-3.5 text-[#555555]" />
        )}
      </div>

      <div className="my-2.5">
        <div
          className="text-[28px] sm:text-[32px] font-semibold tabular-nums leading-none tracking-[-0.02em]"
          style={{ color: numberColor }}
        >
          {value}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#767676] pt-1 border-t border-[#1C1C1C]">
        <span className="truncate">{subtitle || 'Live telemetry'}</span>
        {changeRate && (
          <span
            className={`font-mono font-medium flex items-center gap-0.5 ${
              isPositiveChange ? 'text-[#00B37E]' : 'text-[#EB364B]'
            }`}
          >
            {isPositiveChange ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {changeRate}
          </span>
        )}
      </div>
    </div>
  );
}
