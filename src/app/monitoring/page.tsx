'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MonitoringPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/social');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A0D12] flex items-center justify-center text-[#94A3B8] font-mono text-[13px]">
      Redirecting to Social Media & Brand Impersonation Monitoring...
    </div>
  );
}
