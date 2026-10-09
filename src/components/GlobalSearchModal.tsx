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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-slate-900/40 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Form */}
        <form onSubmit={handleVerifyNew} className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3 bg-slate-50/70">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domains, URLs, apps, incidents, campaigns... (⌘K)"
            className="w-full bg-transparent text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none font-sans"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* Action Prompt if query entered */}
        {query.trim() && (
          <div
            onClick={handleVerifyNew}
            className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-100 text-[12px] text-blue-700 flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition-colors font-medium"
          >
            <span>Analyze &ldquo;<strong>{query.slice(0, 40)}</strong>{query.length > 40 ? '...' : ''}&rdquo; with SAFENET Risk Engine</span>
            <span className="flex items-center gap-1 font-semibold text-[11px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
              Press Enter ↵
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 bg-white">
          {filteredThreats.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-slate-400">
              No previous threats match &quot;{query}&quot;. Press Enter to analyze it now.
            </div>
          ) : (
            filteredThreats.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(`/threat/${item.id}`)}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 text-blue-600 p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    {item.type === 'domain' ? <Globe className="h-4 w-4" /> : item.type === 'social_profile' ? <AtSign className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate font-mono">
                        {item.targetAsset}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                        item.riskScore >= 80 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {item.riskScore >= 80 ? 'CRITICAL' : 'HIGH'}
                      </span>
                    </div>
                    <p className="text-[12px] text-slate-500 truncate mt-0.5">
                      {item.reasons?.[0] || 'Brand impersonation detected'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>SAFENET Intelligence Search</span>
          <span>↵ Analyze · ESC Close</span>
        </div>
      </div>
    </div>
  );
}
