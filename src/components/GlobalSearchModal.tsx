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
  Sparkles,
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-[#080C14] border border-cyan-500/30 rounded-[6px] shadow-[0_12px_48px_rgba(0,0,0,0.9),0_0_24px_rgba(0,210,255,0.12)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Form */}
        <form onSubmit={handleVerifyNew} className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3 bg-[#0B101A]">
          <Search className="h-4 w-4 text-[#00D2FF] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domains, URLs, IPs, incidents, campaigns... (⌘K)"
            className="w-full bg-transparent text-[13px] text-white placeholder-[#64748B] focus:outline-none font-mono"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748B] hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* Action Prompt if query entered */}
        {query.trim() && (
          <div
            onClick={handleVerifyNew}
            className="px-4 py-2.5 bg-cyan-500/10 border-b border-cyan-500/20 text-[12px] text-[#00D2FF] flex items-center justify-between cursor-pointer hover:bg-cyan-500/15 transition-colors font-mono"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Analyze &ldquo;<strong>{query.slice(0, 36)}</strong>{query.length > 36 ? '...' : ''}&rdquo; through Risk Engine</span>
            </span>
            <span className="flex items-center gap-1 font-semibold text-[11px] bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-500/30">
              Press Enter ↵
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-800/80 bg-[#080C14]">
          {filteredThreats.length === 0 ? (
            <div className="py-12 text-center text-[12px] text-[#64748B] font-mono space-y-1">
              <div>No recorded threats match &quot;{query}&quot;.</div>
              <div className="text-[11px] text-[#94A3B8]">Press Enter to launch a live risk inspection.</div>
            </div>
          ) : (
            filteredThreats.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(`/threat/${item.id}`)}
                className="px-4 py-3 hover:bg-[#0B101A] cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 p-1.5 rounded bg-slate-900 border border-slate-800 text-[#00D2FF] group-hover:border-cyan-500/40">
                    {item.type === 'domain' ? <Globe className="h-4 w-4" /> : item.type === 'social_profile' ? <AtSign className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-white group-hover:text-[#00D2FF] transition-colors truncate font-mono">
                        {item.targetAsset}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.riskScore >= 80 ? 'badge-critical' : 'badge-high'
                      }`}>
                        {item.riskScore >= 80 ? 'CRITICAL' : 'HIGH'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
                      {item.reasons?.[0] || 'Brand impersonation detected'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#64748B] group-hover:text-[#00D2FF] shrink-0 transition-transform group-hover:translate-x-1" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0B101A] border-t border-slate-800 flex items-center justify-between text-[11px] text-[#64748B] font-mono">
          <span>SAFENET Intelligence Search</span>
          <span>↵ Analyze · ESC Close</span>
        </div>
      </div>
    </div>
  );
}

