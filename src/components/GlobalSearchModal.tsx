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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-[#080B11]/80 backdrop-blur-md transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[680px] bg-[#0E131F] border border-[#1E2638] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Form */}
        <form onSubmit={handleVerifyNew} className="flex items-center px-5 py-4 border-b border-[#1E2638] gap-3 bg-[#111625]">
          <Search className="h-5 w-5 text-[#F6821F] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domains, URLs, apps, incidents, campaigns... (⌘K)"
            className="w-full bg-transparent text-[20px] text-[#FFFFFF] placeholder-[#9CA3AF] focus:outline-none font-sans font-bold"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#FFFFFF] p-2 rounded-lg hover:bg-[#161D2F] cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </form>

        {/* Action Prompt if query entered */}
        {query.trim() && (
          <div
            onClick={handleVerifyNew}
            className="px-5 py-3.5 bg-[#F6821F]/15 border-b border-[#F6821F]/30 text-[18px] text-[#F6821F] flex items-center justify-between cursor-pointer hover:bg-[#F6821F]/25 transition-colors font-bold"
          >
            <span>Analyze &ldquo;<strong>{query.slice(0, 40)}</strong>{query.length > 40 ? '...' : ''}&rdquo; with SAFENET Risk Engine</span>
            <span className="flex items-center gap-1 font-bold text-[14px] font-mono bg-[#080B11] text-[#F6821F] border border-[#F6821F]/40 px-2.5 py-1 rounded">
              Press Enter ↵
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#1E2638] bg-[#0E131F]">
          {filteredThreats.length === 0 ? (
            <div className="py-14 text-center text-[18px] text-[#9CA3AF] font-bold">
              No previous threats match &quot;{query}&quot;. Press Enter to analyze it now.
            </div>
          ) : (
            filteredThreats.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(`/threat/${item.id}`)}
                className="px-5 py-3.5 hover:bg-[#111625] cursor-pointer transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="shrink-0 text-[#F6821F] p-2.5 bg-[#111625] border border-[#1E2638] rounded-lg group-hover:border-[#F6821F] transition-colors">
                    {item.type === 'domain' ? <Globe className="h-5 w-5" /> : item.type === 'social_profile' ? <AtSign className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] font-bold text-[#FFFFFF] group-hover:text-[#F6821F] transition-colors truncate font-mono">
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
                    <p className="text-[15px] text-[#9CA3AF] truncate mt-1 font-bold">
                      {item.reasons?.[0] || 'Brand impersonation detected'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#F6821F] shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#111625] border-t border-[#1E2638] flex items-center justify-between text-[15px] text-[#9CA3AF] font-mono font-bold">
          <span className="text-[#FFFFFF]">SAFENET Intelligence Search</span>
          <span>↵ Analyze • ESC Close</span>
        </div>
      </div>
    </div>
  );
}
