'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Settings,
  LayoutDashboard,
  Search,
  Activity,
  Bell,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Zap,
  Smartphone,
  Share2,
} from 'lucide-react';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile, AlertItem } from '@/types/brand';
import SafenetLogo from '@/components/SafenetLogo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  useEffect(() => {
    const updateState = () => {
      setBrand(BrandStore.getBrand());
      setAlerts(BrandStore.getAlerts());
    };
    updateState();

    window.addEventListener('storage', updateState);
    return () => window.removeEventListener('storage', updateState);
  }, [pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'App Intelligence', href: '/apps', icon: Smartphone },
    { label: 'Social & Brand', href: '/social', icon: Share2 },
    { label: 'Threat Inspector', href: '/check', icon: Search },
    { label: 'Brand Config', href: '/setup', icon: Settings },
  ];

  const handleSelectPreset = (name: 'Nike' | 'Paytm') => {
    BrandStore.loadPreset(name);
    setBrand(BrandStore.getBrand());
    setShowBrandDropdown(false);
    window.location.reload();
  };

  const unreadAlerts = alerts.filter((a) => !a.read);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-8">
            <SafenetLogo size={24} showWordmark={true} />

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Alerts + Demo Brand Selector */}
        <div className="flex items-center gap-3">
          {/* Alerts Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Security Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showAlertsDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    Security Alerts ({unreadAlerts.length} new)
                  </span>
                  <button
                    onClick={() => {
                      alerts.forEach((a) => BrandStore.markAlertRead(a.id));
                      setAlerts(BrandStore.getAlerts());
                    }}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5">
                  {alerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No security alerts at this time.
                    </div>
                  ) : (
                    alerts.slice(0, 6).map((alert) => (
                      <Link
                        key={alert.id}
                        href={`/threat/${alert.threatId}`}
                        onClick={() => {
                          BrandStore.markAlertRead(alert.id);
                          setShowAlertsDropdown(false);
                        }}
                        className={`block p-3 rounded-xl border text-left transition-all ${
                          alert.riskLevel === 'CRITICAL'
                            ? 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60'
                            : 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span
                            className={
                              alert.riskLevel === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                            }
                          >
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {alert.riskScore}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                          {alert.message}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Active Protected Brand Badge / Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowBrandDropdown(!showBrandDropdown)}
              className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-full px-3.5 py-1.5 text-xs text-slate-300 shadow-inner transition-all"
            >
              <div className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] ring-1 ring-cyan-500/30">
                {brand?.name.charAt(0).toUpperCase() || 'N'}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-white leading-none">
                  {brand?.name || 'Nike'}
                </span>
                <span className="text-[10px] text-slate-400 leading-none mt-0.5 font-mono">
                  {brand?.domain || 'nike.com'}
                </span>
              </div>
              <span className="flex h-2 w-2 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
            </button>

            {showBrandDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  Active Organization
                </div>
                <button
                  onClick={() => handleSelectPreset('Nike')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Nike (Retail)</span>
                  </div>
                  {brand?.name === 'Nike' && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}
                </button>
                <button
                  onClick={() => handleSelectPreset('Paytm')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Paytm (Fintech / UPI)</span>
                  </div>
                  {brand?.name === 'Paytm' && <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />}
                </button>
                <div className="border-t border-slate-800 my-1"></div>
                <Link
                  href="/setup"
                  onClick={() => setShowBrandDropdown(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Custom Brand Setup</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
