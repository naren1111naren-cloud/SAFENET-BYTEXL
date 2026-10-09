'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import InvestigatePage from '@/app/investigate/page';

interface ThreatDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ThreatDetailPage({ params }: ThreatDetailPageProps) {
  const resolvedParams = use(params);
  // Reuses the progressive forensic investigation dossier
  return <InvestigatePage />;
}
