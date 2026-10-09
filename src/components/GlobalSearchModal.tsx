'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  X,
  FileText,
  Globe,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AtSign,
  Smartphone,
} from 'lucide-react';
import { BrandStore } from '@/lib/brand-store';
import { VerificationStore, VerificationRecord } from '@/lib/verification-store';
import { ThreatItem } from '@/types/brand';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [checks, setChecks] = useState<VerificationRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      setThreats(BrandStore.getThreats());
      setChecks(VerificationStore.getChecks());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleVerifyNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(`/check?input=${encodeURIComponent(query.trim())}`);
  };

  const q = query.toLowerCase().trim();

  const filteredThreats = threats.filter((t) => {
    if (!q) return true;
    return (
      t.targetAsset.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      (t.reasons || []).some((r) => r.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-black/80 backdrop-blur-[4px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] bg-[#101214] border border-[#262B30] rounded-[8px] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Form */}
        <form onSubmit={handleVerifyNew} className="flex items-center px-4 py-3 border-b border-[#1D2226] gap-3 bg-[#0D0F12]">
          <Search className="h-4 w-4 text-[#64707D] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domains, URLs, IPs, incidents, campaigns... (⌘K)"
            className="w-full bg-transparent text-[13px] text-white placeholder-[#64707D] focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[#64707D] hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* Action Prompt if query entered */}
        {query.trim() && (
          <div
            onClick={handleVerifyNew}
            className="px-4 py-2 bg-[#14171A] border-b border-[#1D2226] text-[12px] text-[#2EE59D] flex items-center justify-between cursor-pointer hover:bg-[#181C20] transition-colors"
          >
            <span>Analyze &ldquo;<strong>{query.slice(0, 40)}</strong>{query.length > 40 ? '...' : ''}&rdquo; through SAFENET Risk Engine</span>
            <span className="flex items-center gap-1 font-semibold text-[11px] font-mono">
              Press Enter ↵
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-[#1D2226] bg-[#101214]">
          {filteredThreats.length === 0 ? (
            <div className="py-10 text-center text-[12px] text-[#64707D] font-mono">
              No previous threats match &quot;{query}&quot;. Press Enter to analyze it now.
            </div>
          ) : (
            filteredThreats.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(`/threat/${item.id}`)}
                className="px-4 py-2.5 hover:bg-[#14171A] cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 text-[#2EE59D]">
                    {item.type === 'domain' ? <Globe className="h-4 w-4" /> : item.type === 'social_profile' ? <AtSign className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-white group-hover:text-[#2EE59D] transition-colors truncate font-mono">
                        {item.targetAsset}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        item.riskScore >= 80 ? 'badge-critical' : 'badge-high'
                      }`}>
                        {item.riskScore >= 80 ? 'CRITICAL' : 'HIGH'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9BA3AF] truncate mt-0.5">
                      {item.reasons?.[0] || 'Brand impersonation detected'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#64707D] group-hover:text-[#2EE59D] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0D0F12] border-t border-[#1D2226] flex items-center justify-between text-[11px] text-[#64707D] font-mono">
          <span>SAFENET Intelligence Search</span>
          <span>↵ Analyze · ESC Close</span>
        </div>
      </div>
    </div>
  );
}
