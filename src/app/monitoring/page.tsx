'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MonitoringPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/social');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080B10] flex items-center justify-center text-[#FFFFFF] font-mono text-[18px] font-extrabold">
      Redirecting to Social Media &amp; Brand Impersonation Monitoring...
    </div>
  );
}
