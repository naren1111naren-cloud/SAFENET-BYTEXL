'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  X,
  Globe,
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
  const [_checks, setChecks] = useState<VerificationRecord[]>([]);

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
    router.push(`/check?q=${encodeURIComponent(query.trim())}`);
  };

  const filteredThreats = threats.filter((t) => {
    const q = query.toLowerCase();
    return (
      t.targetAsset.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q) ||
      t.reasons?.some((r) => r.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-[#080B10]/80 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] bg-[#0D1118] border border-[#303946] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Form */}
        <form onSubmit={handleVerifyNew} className="flex items-center px-5 py-4 border-b border-[#303946] gap-3 bg-[#121821]">
          <Search className="h-5 w-5 text-[#35D0BA] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domains, URLs, apps, incidents, campaigns... (⌘K)"
            className="w-full bg-transparent text-[20px] text-[#FFFFFF] placeholder-[#D0D7E0] focus:outline-none font-sans font-bold"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[#D0D7E0] hover:text-[#FFFFFF] p-2 rounded-lg hover:bg-[#19222D] cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </form>

        {/* Action Prompt if query entered */}
        {query.trim() && (
          <div
            onClick={handleVerifyNew}
            className="px-5 py-3.5 bg-[#35D0BA]/15 border-b border-[#35D0BA]/30 text-[18px] text-[#35D0BA] flex items-center justify-between cursor-pointer hover:bg-[#35D0BA]/25 transition-colors font-bold"
          >
            <span>Analyze &ldquo;<strong>{query.slice(0, 40)}</strong>{query.length > 40 ? '...' : ''}&rdquo; with SAFENET Risk Engine</span>
            <span className="flex items-center gap-1 font-bold text-[14px] font-mono bg-[#080B10] text-[#35D0BA] border border-[#35D0BA]/40 px-2.5 py-1 rounded">
              Press Enter ↵
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#303946] bg-[#0D1118]">
          {filteredThreats.length === 0 ? (
            <div className="py-14 text-center text-[18px] text-[#D0D7E0] font-bold">
              No previous threats match &quot;{query}&quot;. Press Enter to analyze it now.
            </div>
          ) : (
            filteredThreats.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(`/threat/${item.id}`)}
                className="px-5 py-3.5 hover:bg-[#121821] cursor-pointer transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 text-[#35D0BA] p-2.5 bg-[#121821] border border-[#303946] rounded-lg group-hover:border-[#35D0BA] transition-colors">
                    {item.type === 'domain' ? <Globe className="h-5 w-5" /> : item.type === 'social_profile' ? <AtSign className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] font-bold text-[#FFFFFF] group-hover:text-[#35D0BA] transition-colors truncate font-mono">
                        {item.targetAsset}
                      </span>
                      <span className={`text-[13px] font-mono font-bold px-2.5 py-0.5 rounded uppercase border ${
                        item.riskScore >= 80 
                          ? 'bg-[#FF5C6C]/15 text-[#FF5C6C] border-[#FF5C6C]/30' 
                          : 'bg-[#FF8E4D]/15 text-[#FF8E4D] border-[#FF8E4D]/30'
                      }`}>
                        {item.riskScore >= 80 ? 'CRITICAL' : 'HIGH'}
                      </span>
                    </div>
                    <p className="text-[15px] text-[#D0D7E0] truncate mt-1 font-bold">
                      {item.reasons?.[0] || 'Brand impersonation detected'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#D0D7E0] group-hover:text-[#35D0BA] shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#121821] border-t border-[#303946] flex items-center justify-between text-[15px] text-[#D0D7E0] font-mono font-bold">
          <span className="text-[#FFFFFF]">SAFENET Intelligence Search</span>
          <span>↵ Analyze • ESC Close</span>
        </div>
      </div>
    </div>
  );
}
