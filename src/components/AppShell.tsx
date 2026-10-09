'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  ShieldAlert,
  GitBranch,
  AlertOctagon,
  BarChart3,
  Settings,
  Bell,
  Menu,
  X,
  BookOpen,
  ChevronDown,
  User,
  Smartphone,
  Share2,
  Radio,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import GlobalSearchModal from '@/components/GlobalSearchModal';
import SafenetLogo from '@/components/SafenetLogo';
import { BrandStore, PRESET_BRANDS } from '@/lib/brand-store';
import { BrandProfile, AlertItem } from '@/types/brand';

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export default function AppShell({ children, pageTitle, pageSubtitle }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowAlertsDropdown(false);
    setShowBrandDropdown(false);
  }, [pathname]);

  useEffect(() => {
    const updateState = () => {
      setBrand(BrandStore.getBrand());
      setAlerts(BrandStore.getAlerts());
    };
    updateState();

    window.addEventListener('storage', updateState);
    return () => window.removeEventListener('storage', updateState);
  }, []);

  const handleSelectPreset = (name: 'Paytm' | 'Nike') => {
    BrandStore.loadPreset(name);
    setBrand(BrandStore.getBrand());
    setShowBrandDropdown(false);
    window.location.reload();
  };

  const intelligenceNav = [
    { label: 'Overview', href: '/overview', icon: LayoutDashboard },
    { label: 'App Intelligence', href: '/apps', icon: Smartphone },
    { label: 'Social & Brand', href: '/social', icon: Share2 },
    { label: 'Check', href: '/check', icon: Search },
    { label: 'Investigations', href: '/investigate', icon: ShieldAlert },
    { label: 'Campaigns', href: '/campaigns', icon: GitBranch },
    { label: 'Incidents', href: '/incidents', icon: AlertOctagon },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const workspaceNav = [
    { label: 'Safety Guide', href: '/guide', icon: BookOpen },
    { label: 'Settings', href: '/setup', icon: Settings },
  ];

  const unreadAlerts = alerts.filter((a) => !a.read);

  return (
    <div className="min-h-screen flex bg-[#06080C] text-[#F3F6FB] font-sans antialiased selection:bg-[#00D2FF]/25 selection:text-white relative cyber-grid">
      {/* Sentinel Ambient Radial Telemetry Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] bg-[#00D2FF]/[0.035] blur-[120px] rounded-full" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[400px] bg-[#00F5A0]/[0.025] blur-[140px] rounded-full" />
      </div>

      {/* ── SENTINEL DARK DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#080C14]/90 backdrop-blur-xl border-r border-slate-800/80 shrink-0 sticky top-0 h-screen z-30 select-none shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        {/* Brand / Logo Header */}
        <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between bg-[#0B101A]/40">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <SafenetLogo size={16} showWordmark={true} />
          </Link>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D2FF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D2FF]" />
          </span>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
          {/* Intelligence Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.12em] text-[#64748B] font-semibold">
              <span>INTELLIGENCE</span>
              <span className="text-[9px] text-[#00D2FF]/80 bg-[#00D2FF]/10 px-1 rounded font-mono">SOC</span>
            </div>
            {intelligenceNav.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === '/investigate' && pathname.startsWith('/threat')) ||
                (item.href === '/overview' && pathname === '/dashboard');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-[4px] text-[13px] font-medium transition-all group relative ${
                    isActive
                      ? 'text-[#FFFFFF] bg-gradient-to-r from-cyan-500/15 to-transparent border border-cyan-500/30 shadow-[0_0_12px_rgba(0,210,255,0.08)]'
                      : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#00D2FF]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {isActive && (
                    <span className="h-4 w-1 rounded-full bg-[#00D2FF] shadow-[0_0_8px_#00D2FF]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Cyber Hairline Divider */}
          <div className="border-t border-slate-800/80 mx-2" />

          {/* Workspace Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-[#64748B] font-semibold">
              WORKSPACE
            </div>
            {workspaceNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-[4px] text-[13px] font-medium transition-all group relative ${
                    isActive
                      ? 'text-[#FFFFFF] bg-gradient-to-r from-cyan-500/15 to-transparent border border-cyan-500/30'
                      : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#00D2FF]' : 'text-[#64748B] group-hover:text-[#94A3B8]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {isActive && (
                    <span className="h-4 w-1 rounded-full bg-[#00D2FF] shadow-[0_0_8px_#00D2FF]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Active Perimeter Status Card */}
        <div className="p-3.5 m-3 border border-slate-800/90 rounded-[4px] bg-[#0B101A]/80 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#00F5A0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0] shadow-[0_0_6px_#00F5A0]" />
              PERIMETER GUARD
            </span>
            <span className="text-[#00D2FF] font-semibold">ACTIVE</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[12px]">
            <span className="text-[#94A3B8]">Target:</span>
            <span className="font-mono text-[#F3F6FB] font-semibold flex items-center gap-1.5">
              {brand?.name || 'Paytm'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── RIGHT MAIN COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ── TOP NAVIGATION (SENTINEL COMMAND BAR) ── */}
        <header className="h-16 bg-[#080C14]/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40 shrink-0 shadow-lg shadow-black/20">
          {/* Left: Mobile Toggle & Minimal Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-slate-800/50"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <Link href="/" className="lg:hidden">
              <SafenetLogo size={16} showWordmark={false} />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-[12px] font-mono text-[#64748B]">
              <span className="text-[#00D2FF] font-semibold">SAFENET</span>
              <span>/</span>
              <span className="text-[#94A3B8]">DIGITAL RISK DECISION SYSTEM</span>
            </div>
          </div>

          {/* Center: Command Palette Global Search (⌘K) */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-[4px] bg-[#0B101A]/90 hover:bg-[#101726] border border-slate-800 hover:border-cyan-500/40 text-[12px] text-[#94A3B8] transition-all cursor-pointer shadow-inner group"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-3.5 w-3.5 text-[#64748B] group-hover:text-[#00D2FF] transition-colors" />
                <span className="group-hover:text-[#F3F6FB] transition-colors">Search domains, URLs, IPs, incidents...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-slate-800/80 border border-slate-700/80 text-[#94A3B8] px-1.5 py-0.5 rounded shadow-sm">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Telemetry / Quick Check / Brand / Alerts */}
          <div className="flex items-center gap-3">
            <Link
              href="/check"
              className="px-3 py-1.5 rounded-[4px] bg-cyan-500/10 border border-cyan-500/30 text-[12px] text-[#00D2FF] hover:bg-cyan-500/20 transition-all font-mono font-medium hidden sm:flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,210,255,0.1)]"
            >
              <Search className="h-3 w-3" />
              <span>Quick Check</span>
            </Link>

            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] border border-slate-800 bg-[#0B101A]/90 text-[12px] font-mono text-[#F3F6FB] hover:border-slate-700 hover:bg-[#101726] transition-all cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-[#00F5A0] shadow-[0_0_6px_#00F5A0]" />
                <span className="font-semibold">{brand?.name || 'Paytm'}</span>
                <ChevronDown className="h-3 w-3 text-[#64748B]" />
              </button>

              {showBrandDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[#0B101A] border border-slate-800 rounded-[4px] shadow-2xl z-50 p-1.5 text-[12px] font-mono">
                  <div className="px-2.5 py-1 text-[10px] uppercase text-[#64748B] font-semibold border-b border-slate-800/80 mb-1">
                    TARGET ENVIRONMENT
                  </div>
                  <button
                    onClick={() => handleSelectPreset('Paytm')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[3px] flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
                      brand?.name === 'Paytm' ? 'text-[#00F5A0] bg-emerald-500/10' : 'text-[#F3F6FB]'
                    }`}
                  >
                    <span>Paytm (Fintech)</span>
                    {brand?.name === 'Paytm' && <span className="text-[#00F5A0]">✓</span>}
                  </button>
                  <button
                    onClick={() => handleSelectPreset('Nike')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[3px] flex items-center justify-between hover:bg-slate-800/60 transition-colors ${
                      brand?.name === 'Nike' ? 'text-[#00F5A0] bg-emerald-500/10' : 'text-[#F3F6FB]'
                    }`}
                  >
                    <span>Nike (Retail)</span>
                    {brand?.name === 'Nike' && <span className="text-[#00F5A0]">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell with Alerts Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                className="relative p-2 rounded-[4px] border border-slate-800 bg-[#0B101A]/90 text-[#94A3B8] hover:text-[#FFFFFF] hover:border-slate-700 transition-colors cursor-pointer"
                title="Alerts"
              >
                <Bell className="h-4 w-4" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF3366] shadow-[0_0_6px_#FF3366]" />
                )}
              </button>

              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0B101A] border border-slate-800 rounded-[4px] shadow-2xl z-50 p-2 font-mono text-[12px]">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase text-[#64748B] font-semibold border-b border-slate-800/80 flex items-center justify-between">
                    <span>SECURITY ALERTS</span>
                    <span className="text-[#FF3366]">{unreadAlerts.length} UNREAD</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/60">
                    {alerts.length === 0 ? (
                      <div className="p-3 text-center text-[#64748B] text-[11px]">
                        No active security alerts.
                      </div>
                    ) : (
                      alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="p-2 hover:bg-slate-800/40 transition-colors space-y-0.5">
                          <div className="text-[11px] text-[#F3F6FB] font-medium truncate">
                            {alert.title}
                          </div>
                          <div className="text-[10px] text-[#94A3B8] line-clamp-1">
                            {alert.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── MOBILE NAV DRAWER ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#080C14] border-b border-slate-800 px-4 py-3 space-y-1.5 z-30 shadow-2xl font-mono">
            {intelligenceNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[4px] text-[13px] ${
                    isActive ? 'bg-cyan-500/15 text-[#00D2FF] font-semibold' : 'text-[#94A3B8] hover:text-[#FFFFFF]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-[#64748B]">
              <Link href="/guide" className="hover:text-white">Safety Guide</Link>
              <Link href="/setup" className="hover:text-white">Settings</Link>
            </div>
          </div>
        )}

        {/* ── CONTINUOUS INTELLIGENCE CANVAS ── */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {(pageTitle || pageSubtitle) && (
            <div className="mb-10 pb-5 border-b border-slate-800/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00D2FF] shadow-[0_0_6px_#00D2FF]" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#00D2FF]">
                  SAFENET SENTINEL TELEMETRY
                </span>
              </div>
              {pageTitle && (
                <h1 className="text-[26px] sm:text-[34px] font-bold text-[#F3F6FB] tracking-[-0.025em]">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-[13px] sm:text-[14px] text-[#94A3B8] font-normal leading-relaxed max-w-3xl">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>

        {/* ── SYSTEM FOOTER ── */}
        <footer className="border-t border-slate-800/80 bg-[#080C14]/90 text-[#64748B] text-[11px] font-mono py-6 px-4 sm:px-8 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0]" />
              <span>SAFENET • Digital Risk Decision System • Sentinel Dark</span>
            </div>
            <div className="flex items-center gap-4 text-[#94A3B8]">
              <Link href="/check" className="hover:text-[#00D2FF] transition-colors">Check</Link>
              <Link href="/overview" className="hover:text-[#00D2FF] transition-colors">Overview</Link>
              <Link href="/apps" className="hover:text-[#00D2FF] transition-colors">Apps</Link>
              <Link href="/social" className="hover:text-[#00D2FF] transition-colors">Social</Link>
              <Link href="/campaigns" className="hover:text-[#00D2FF] transition-colors">Campaigns</Link>
              <Link href="/reports" className="hover:text-[#00D2FF] transition-colors">Reports</Link>
              <Link href="/setup" className="hover:text-[#00D2FF] transition-colors">Settings</Link>
            </div>
          </div>
        </footer>

        {/* Global ⌘K Search Modal */}
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}

