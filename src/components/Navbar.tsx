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
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile, AlertItem } from '@/types/brand';
import SafenetLogo from '@/components/SafenetLogo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
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
    <header className="sticky top-0 z-50 border-b border-[#303946] bg-[#0D1118]/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-8">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <SafenetLogo size={20} showWordmark={true} />
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#121821] text-[#35D0BA] font-bold border border-[#35D0BA]/40 font-semibold shadow-xs'
                      : 'text-[#D0D7E0] font-bold hover:text-[#FFFFFF] font-bold hover:bg-[#19222D] border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#35D0BA] font-bold' : 'text-[#8F9CAE] font-bold'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Alerts + Demo Brand Selector + User */}
        <div className="flex items-center gap-3">
          {/* Alerts Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 rounded-xl bg-[#0D1118] border border-[#303946] text-[#D0D7E0] font-bold hover:text-[#FFFFFF] font-bold hover:bg-[#19222D] transition-colors shadow-xs"
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
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0D1118] border border-[#303946] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF] font-bold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    Security Alerts ({unreadAlerts.length} new)
                  </span>
                  <button
                    onClick={() => {
                      alerts.forEach((a) => BrandStore.markAlertRead(a.id));
                      setAlerts(BrandStore.getAlerts());
                    }}
                    className="text-[11px] text-[#35D0BA] font-bold hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5">
                  {alerts.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#D0D7E0] font-bold">
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
                            ? 'bg-rose-50 border-rose-200 hover:border-rose-300'
                            : 'bg-amber-50 border-amber-200 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span
                            className={
                              alert.riskLevel === 'CRITICAL' ? 'text-rose-700' : 'text-amber-700'
                            }
                          >
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-[#D0D7E0] font-bold font-mono">
                            {alert.riskScore}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-[#D0D7E0] font-bold mt-1 line-clamp-2">
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
              className="flex items-center gap-2.5 bg-[#0D1118] border border-[#303946] hover:border-slate-300 rounded-full px-3.5 py-1.5 text-xs text-[#D0D7E0] font-bold shadow-xs transition-all"
            >
              <div className="h-5 w-5 rounded-full bg-blue-100 text-[#35D0BA] font-bold flex items-center justify-center font-bold text-[10px] ring-1 ring-blue-200">
                {brand?.name.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-[#FFFFFF] font-bold leading-none">
                  {brand?.name || 'Paytm'}
                </span>
                <span className="text-[10px] text-[#D0D7E0] font-bold leading-none mt-0.5 font-mono">
                  {brand?.domain || 'paytm.com'}
                </span>
              </div>
              <span className="flex h-2 w-2 relative ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[#8F9CAE] font-bold ml-0.5" />
            </button>

            {showBrandDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0D1118] border border-[#303946] shadow-2xl p-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-[#8F9CAE] font-bold tracking-wider font-semibold">
                  Active Organization
                </div>
                <button
                  onClick={() => handleSelectPreset('Nike')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#D0D7E0] font-bold hover:bg-[#19222D] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-[#35D0BA] font-bold" />
                    <span>Nike (Retail)</span>
                  </div>
                  {brand?.name === 'Nike' && <CheckCircle2 className="h-3.5 w-3.5 text-[#35D0BA] font-bold" />}
                </button>
                <button
                  onClick={() => handleSelectPreset('Paytm')}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-[#D0D7E0] font-bold hover:bg-[#19222D] transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#35D0BA] font-bold" />
                    <span>Paytm (Fintech / UPI)</span>
                  </div>
                  {brand?.name === 'Paytm' && <CheckCircle2 className="h-3.5 w-3.5 text-[#35D0BA] font-bold" />}
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <Link
                  href="/setup"
                  onClick={() => setShowBrandDropdown(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#35D0BA] font-bold hover:bg-[#121821] transition-colors font-medium"
                >
                  <Settings className="h-3.5 w-3.5" />
                  <span>Custom Brand Setup</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Session Profile & Logout Action */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#303946]">
              <div
                title={user.email || 'Authenticated User'}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-[#303946] text-[11px] font-mono text-[#D0D7E0] font-bold max-w-[160px] truncate"
              >
                <User className="h-3 w-3 text-[#35D0BA] font-bold shrink-0" />
                <span className="truncate">{user.email?.split('@')[0]}</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setLoggingOut(true);
                  try {
                    await signOut();
                    router.push('/login');
                    router.refresh();
                  } finally {
                    setLoggingOut(false);
                  }
                }}
                disabled={loggingOut}
                title="Sign out of SAFENET"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D1118] hover:bg-rose-50 border border-[#303946] hover:border-rose-200 text-xs text-[#D0D7E0] font-bold hover:text-rose-600 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-xs text-white font-semibold shadow-xs transition-all"
            >
              <User className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
