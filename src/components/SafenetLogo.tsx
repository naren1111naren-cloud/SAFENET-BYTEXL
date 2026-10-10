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
      {/* Official SAFENET Brand Mark */}
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
        <div className="flex items-center select-none">
          <span className="font-display font-bold text-[18px] tracking-[0.06em] text-[#FFFFFF]">
            SAFENET
          </span>
        </div>
      )}
    </div>
  );
}
