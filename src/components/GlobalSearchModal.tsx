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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-[#202723]/35 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[620px] bg-[#FFFFFF] border border-[#DDE2DC] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Form */}
        <form onSubmit={handleVerifyNew} className="flex items-center px-4 py-3.5 border-b border-[#DDE2DC] gap-3 bg-[#F7F8F6]">
          <Search className="h-4 w-4 text-[#858D86] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search domains, URLs, apps, incidents, campaigns... (⌘K)"
            className="w-full bg-transparent text-[14px] text-[#202723] placeholder-[#858D86] focus:outline-none font-sans"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[#858D86] hover:text-[#202723] p-1.5 rounded-lg hover:bg-[#ECEFEC] cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* Action Prompt if query entered */}
        {query.trim() && (
          <div
            onClick={handleVerifyNew}
            className="px-4 py-2.5 bg-[#E7F0E9] border-b border-[#D1E3D5] text-[13px] text-[#477A60] flex items-center justify-between cursor-pointer hover:bg-[#DCEAE0] transition-colors font-medium"
          >
            <span>Analyze &ldquo;<strong>{query.slice(0, 40)}</strong>{query.length > 40 ? '...' : ''}&rdquo; with SAFENET Risk Engine</span>
            <span className="flex items-center gap-1 font-semibold text-[11px] font-mono bg-[#FFFFFF] text-[#477A60] border border-[#D1E3D5] px-2 py-0.5 rounded">
              Press Enter ↵
            </span>
          </div>
        )}

        {/* Results List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-[#DDE2DC] bg-[#FFFFFF]">
          {filteredThreats.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#858D86]">
              No previous threats match &quot;{query}&quot;. Press Enter to analyze it now.
            </div>
          ) : (
            filteredThreats.slice(0, 6).map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(`/threat/${item.id}`)}
                className="px-4 py-3 hover:bg-[#F7F8F6] cursor-pointer transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0 text-[#477A60] p-2 bg-[#E7F0E9] rounded-lg group-hover:bg-[#DCEAE0] transition-colors">
                    {item.type === 'domain' ? <Globe className="h-4 w-4" /> : item.type === 'social_profile' ? <AtSign className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#202723] group-hover:text-[#477A60] transition-colors truncate font-mono">
                        {item.targetAsset}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                        item.riskScore >= 80 
                          ? 'bg-[#FDF2F3] text-[#C93643] border-[#F8D3D6]' 
                          : 'bg-[#FDF5F2] text-[#D95F36] border-[#F8DDD4]'
                      }`}>
                        {item.riskScore >= 80 ? 'CRITICAL' : 'HIGH'}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#626B65] truncate mt-0.5">
                      {item.reasons?.[0] || 'Brand impersonation detected'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#858D86] group-hover:text-[#477A60] shrink-0 transition-transform group-hover:translate-x-0.5" />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#F7F8F6] border-t border-[#DDE2DC] flex items-center justify-between text-[11px] text-[#858D86] font-mono">
          <span>SAFENET Intelligence Search</span>
          <span>↵ Analyze • ESC Close</span>
        </div>
      </div>
    </div>
  );
}
