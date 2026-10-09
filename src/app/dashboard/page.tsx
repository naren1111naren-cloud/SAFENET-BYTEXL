'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/overview');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0D12] flex items-center justify-center text-[#94A3B8] font-mono text-[13px]">
      Loading SAFENET Risk Decision Console...
    </div>
  );
}
