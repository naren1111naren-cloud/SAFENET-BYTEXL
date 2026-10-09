import React from 'react';
import Image from 'next/image';

interface SafenetLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

export default function SafenetLogo({ size = 16, className = '', showWordmark = true }: SafenetLogoProps) {
  // Height and width calculated to preserve authentic aspect ratio (346x222)
  const height = size + 6;
  const width = Math.round(height * (346 / 222));

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official SAFENET Search-Lens Brand Mark with Sentinel Telemetry Glow */}
      <div
        className="relative flex items-center justify-center shrink-0 overflow-hidden rounded-[4px] border border-cyan-500/30 bg-[#0B101A]/80 shadow-[0_0_12px_rgba(0,210,255,0.18)]"
        style={{ width, height }}
      >
        <Image
          src="/images/safenet-logo.png"
          alt="SAFENET Logo"
          width={346}
          height={222}
          priority
          className="h-full w-full object-contain p-0.5"
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-mono font-bold text-[13px] tracking-[0.08em] text-[#F3F6FB]">
              SAFENET
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#00D2FF] shadow-[0_0_6px_#00D2FF]" />
          </div>
          <span className="text-[10px] text-[#64748B] font-mono tracking-tight mt-0.5 leading-none">
            RISK DECISION SYSTEM
          </span>
        </div>
      )}
    </div>
  );
}

