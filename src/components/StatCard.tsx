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
    default: '#202723',
    danger: '#C93643',
    warning: '#B7791F',
    success: '#347653',
    info: '#3974C6',
  };

  const numberColor = accentColors[variant];

  return (
    <div className="bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl p-5 flex flex-col justify-between hover:border-[#858D86]/60 transition-colors shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between text-[#626B65]">
        <div className="text-[13px] font-semibold tracking-normal text-[#626B65]">
          {title}
        </div>
        {Icon ? (
          <div className="p-1.5 rounded-md bg-[#ECEFEC] text-[#626B65]">
            <Icon className="h-4 w-4" />
          </div>
        ) : (
          <Info className="h-3.5 w-3.5 text-[#858D86]" />
        )}
      </div>

      <div className="my-3">
        <div
          className="text-[30px] sm:text-[34px] font-bold tabular-nums leading-none tracking-[-0.02em]"
          style={{ color: numberColor }}
        >
          {value}
        </div>
      </div>

      <div className="flex items-center justify-between text-[12px] text-[#858D86] pt-2.5 border-t border-[#DDE2DC]">
        <span className="truncate">{subtitle || 'Live telemetry'}</span>
        {changeRate && (
          <span
            className={`font-mono font-medium flex items-center gap-0.5 ${
              isPositiveChange ? 'text-[#347653]' : 'text-[#C93643]'
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
