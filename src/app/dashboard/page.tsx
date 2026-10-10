'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/overview');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080B11] flex items-center justify-center text-[#FFFFFF] font-mono text-[18px] font-extrabold">
      Loading SAFENET Risk Decision Console...
    </div>
  );
}
