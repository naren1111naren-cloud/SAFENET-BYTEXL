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
      {/* Official SAFENET Search-Lens Browser Brand Mark */}
      <div
        className="flex items-center justify-center shrink-0 overflow-hidden rounded-[4px]"
        style={{ width, height }}
      >
        <Image
          src="/images/safenet-logo.png"
          alt="SAFENET Logo"
          width={346}
          height={222}
          priority
          className="h-full w-full object-contain"
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col select-none">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-sans font-bold text-[14px] tracking-[0.05em] text-slate-900">
              SAFENET
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans tracking-tight mt-0.5 leading-none">
            Risk Decision System
          </span>
        </div>
      )}
    </div>
  );
}
