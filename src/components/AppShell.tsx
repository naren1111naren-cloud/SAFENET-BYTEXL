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
  LogOut,
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowAlertsDropdown(false);
    setShowBrandDropdown(false);
    setShowUserDropdown(false);
  }, [pathname]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user?.email) {
            setUserEmail(data.user.email);
          } else {
            setUserEmail(null);
          }
        }
      } catch {
        // Continue
      }
    };
    checkAuth();
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue
    }
    setUserEmail(null);
    router.push('/login');
    router.refresh();
  };

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
    <div className="min-h-screen flex bg-[#090414] text-[#F8FAFC] font-sans antialiased selection:bg-[#D946EF]/30 selection:text-white relative cyber-grid">
      {/* Eventor Ambient Radial Telemetry Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-[#8B5CF6]/[0.15] blur-[140px] rounded-full" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[450px] bg-[#EC4899]/[0.12] blur-[150px] rounded-full" />
        <div className="absolute bottom-10 left-1/3 w-[600px] h-[350px] bg-[#6366F1]/[0.1] blur-[140px] rounded-full" />
      </div>

      {/* ── EVENTOR VIOLET DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#0D0722]/90 backdrop-blur-xl border-r border-purple-900/40 shrink-0 sticky top-0 h-screen z-30 select-none shadow-[4px_0_30px_rgba(0,0,0,0.6)]">
        {/* Brand / Logo Header */}
        <div className="h-16 px-5 border-b border-purple-900/40 flex items-center justify-between bg-[#130D2E]/40">
          <Link href="/" className="hover:opacity-95 transition-opacity">
            <SafenetLogo size={16} showWordmark={true} />
          </Link>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EC4899] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EC4899]" />
          </span>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
          {/* Intelligence Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.12em] text-purple-400 font-semibold">
              <span>INTELLIGENCE</span>
              <span className="text-[9px] text-pink-300 bg-pink-500/15 px-1.5 py-0.5 rounded-full font-mono border border-pink-500/30">SOC</span>
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all group relative ${
                    isActive
                      ? 'text-[#FFFFFF] bg-gradient-to-r from-purple-600/30 via-pink-600/20 to-transparent border border-pink-500/35 shadow-[0_0_16px_rgba(217,70,239,0.15)] font-bold'
                      : 'text-slate-400 hover:text-[#FFFFFF] hover:bg-purple-900/20 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#EC4899]' : 'text-purple-400 group-hover:text-pink-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {isActive && (
                    <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#8B5CF6] to-[#EC4899] shadow-[0_0_8px_#EC4899]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Hairline Divider */}
          <div className="border-t border-purple-900/40 mx-2" />

          {/* Workspace Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-purple-400 font-semibold">
              WORKSPACE
            </div>
            {workspaceNav.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all group relative ${
                    isActive
                      ? 'text-[#FFFFFF] bg-gradient-to-r from-purple-600/30 via-pink-600/20 to-transparent border border-pink-500/35 shadow-[0_0_16px_rgba(217,70,239,0.15)] font-bold'
                      : 'text-slate-400 hover:text-[#FFFFFF] hover:bg-purple-900/20 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#EC4899]' : 'text-purple-400 group-hover:text-pink-300'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {isActive && (
                    <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#8B5CF6] to-[#EC4899] shadow-[0_0_8px_#EC4899]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Active Perimeter Status Card */}
        <div className="p-3.5 m-3 border border-purple-500/20 rounded-2xl bg-[#130D2E]/80 backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#00F5A0]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00F5A0] shadow-[0_0_6px_#00F5A0]" />
              PERIMETER GUARD
            </span>
            <span className="text-[#EC4899] font-bold">ACTIVE</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-purple-900/40 text-[12px]">
            <span className="text-slate-400">Target:</span>
            <span className="font-mono text-[#F8FAFC] font-semibold flex items-center gap-1.5">
              {brand?.name || 'Paytm'}
            </span>
          </div>
        </div>
      </aside>

      {/* ── RIGHT MAIN COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ── TOP NAVIGATION (EVENTOR COMMAND BAR) ── */}
        <header className="h-16 bg-[#0D0722]/85 backdrop-blur-xl border-b border-purple-900/40 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40 shrink-0 shadow-lg shadow-black/40">
          {/* Left: Mobile Toggle & Minimal Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <Link href="/" className="lg:hidden">
              <SafenetLogo size={16} showWordmark={false} />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-[12px] font-mono text-purple-400">
              <span className="text-[#EC4899] font-bold">SAFENET</span>
              <span className="text-purple-600">/</span>
              <span className="text-slate-300">DIGITAL RISK DECISION SYSTEM</span>
            </div>
          </div>

          {/* Center: Command Palette Global Search (⌘K) */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-full bg-[#130D2E]/90 hover:bg-[#1C1344] border border-purple-900/50 hover:border-pink-500/40 text-[12px] text-slate-400 transition-all cursor-pointer shadow-inner group"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-3.5 w-3.5 text-purple-400 group-hover:text-[#EC4899] transition-colors" />
                <span className="group-hover:text-[#F8FAFC] transition-colors">Search domains, URLs, IPs, incidents...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-purple-950/80 border border-purple-700/60 text-purple-300 px-2 py-0.5 rounded-full shadow-sm">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Telemetry / Quick Check / Brand / Alerts */}
          <div className="flex items-center gap-3">
            <Link
              href="/check"
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-pink-500/40 text-[12px] text-pink-200 hover:text-white hover:shadow-[0_0_16px_rgba(236,72,153,0.35)] transition-all font-mono font-medium hidden sm:flex items-center gap-1.5"
            >
              <Search className="h-3 w-3 text-pink-400" />
              <span>Quick Check</span>
            </Link>

            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-900/50 bg-[#130D2E]/90 text-[12px] font-mono text-[#F8FAFC] hover:border-pink-500/40 hover:bg-[#1C1344] transition-all cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-[#00F5A0] shadow-[0_0_6px_#00F5A0]" />
                <span className="font-semibold">{brand?.name || 'Paytm'}</span>
                <ChevronDown className="h-3 w-3 text-purple-400" />
              </button>

              {showBrandDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[#130D2E] border border-purple-500/30 rounded-2xl shadow-2xl z-50 p-2 text-[12px] font-mono">
                  <div className="px-2.5 py-1 text-[10px] uppercase text-purple-400 font-semibold border-b border-purple-900/40 mb-1">
                    TARGET ENVIRONMENT
                  </div>
                  <button
                    onClick={() => handleSelectPreset('Paytm')}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-purple-900/40 transition-colors ${
                      brand?.name === 'Paytm' ? 'text-[#00F5A0] bg-emerald-500/10' : 'text-[#F8FAFC]'
                    }`}
                  >
                    <span>Paytm (Fintech)</span>
                    {brand?.name === 'Paytm' && <span className="text-[#00F5A0]">✓</span>}
                  </button>
                  <button
                    onClick={() => handleSelectPreset('Nike')}
                    className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between hover:bg-purple-900/40 transition-colors ${
                      brand?.name === 'Nike' ? 'text-[#00F5A0] bg-emerald-500/10' : 'text-[#F8FAFC]'
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
                className="relative p-2 rounded-full border border-purple-900/50 bg-[#130D2E]/90 text-purple-300 hover:text-white hover:border-pink-500/40 transition-colors cursor-pointer"
                title="Alerts"
              >
                <Bell className="h-4 w-4" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#EC4899] shadow-[0_0_6px_#EC4899]" />
                )}
              </button>

              {showAlertsDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#130D2E] border border-purple-500/30 rounded-2xl shadow-2xl z-50 p-3 font-mono text-[12px]">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase text-purple-300 font-semibold border-b border-purple-900/40 flex items-center justify-between">
                    <span>SECURITY ALERTS</span>
                    <span className="text-[#EC4899] font-bold">{unreadAlerts.length} UNREAD</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-purple-900/30">
                    {alerts.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-[11px]">
                        No active security alerts.
                      </div>
                    ) : (
                      alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="p-2 hover:bg-purple-900/30 transition-colors space-y-0.5 rounded-lg">
                          <div className="text-[11px] text-[#F8FAFC] font-medium truncate">
                            {alert.title}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {alert.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Account Menu */}
            {userEmail ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-full border border-purple-900/50 bg-[#130D2E]/90 hover:border-pink-500/40 transition-colors cursor-pointer"
                  title="User Profile"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-mono text-[11px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(217,70,239,0.4)]">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className="h-3 w-3 text-purple-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#130D2E] border border-purple-500/30 rounded-2xl shadow-2xl z-50 p-3 font-mono text-[12px]">
                    <div className="px-2.5 py-1.5 border-b border-purple-900/40 mb-1">
                      <div className="text-[10px] text-purple-400 uppercase font-semibold">AUTHENTICATED USER</div>
                      <div className="text-[11px] text-[#F8FAFC] font-medium truncate mt-0.5">{userEmail}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/15 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-pink-500/40 text-[12px] font-mono text-pink-200 hover:text-white hover:shadow-[0_0_16px_rgba(236,72,153,0.35)] transition-all cursor-pointer font-bold"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* ── MOBILE NAV DRAWER ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0D0722] border-b border-purple-900/40 px-4 py-3 space-y-1.5 z-30 shadow-2xl font-mono">
            {intelligenceNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] ${
                    isActive ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/20 text-[#EC4899] font-bold border border-pink-500/30' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-purple-900/40 flex items-center justify-between text-[11px] text-purple-400">
              <Link href="/guide" className="hover:text-white">Safety Guide</Link>
              <Link href="/setup" className="hover:text-white">Settings</Link>
            </div>
          </div>
        )}

        {/* ── CONTINUOUS INTELLIGENCE CANVAS ── */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {(pageTitle || pageSubtitle) && (
            <div className="mb-10 pb-5 border-b border-purple-900/40 space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#EC4899] shadow-[0_0_8px_#EC4899] animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-purple-300 font-bold">
                  SAFENET SENTINEL TELEMETRY
                </span>
              </div>
              {pageTitle && (
                <h1 className="text-[26px] sm:text-[36px] font-extrabold text-[#F8FAFC] tracking-tight">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-[13px] sm:text-[15px] text-slate-300 font-normal leading-relaxed max-w-3xl">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>

        {/* ── SYSTEM FOOTER ── */}
        <footer className="border-t border-purple-900/40 bg-[#0D0722]/90 text-purple-400/80 text-[11px] font-mono py-6 px-4 sm:px-8 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#EC4899] shadow-[0_0_6px_#EC4899]" />
              <span>SAFENET • Digital Risk Decision System • Eventor Cosmic Theme</span>
            </div>
            <div className="flex items-center gap-4 text-purple-300">
              <Link href="/check" className="hover:text-pink-300 transition-colors">Check</Link>
              <Link href="/overview" className="hover:text-pink-300 transition-colors">Overview</Link>
              <Link href="/apps" className="hover:text-pink-300 transition-colors">Apps</Link>
              <Link href="/social" className="hover:text-pink-300 transition-colors">Social</Link>
              <Link href="/campaigns" className="hover:text-pink-300 transition-colors">Campaigns</Link>
              <Link href="/reports" className="hover:text-pink-300 transition-colors">Reports</Link>
              <Link href="/setup" className="hover:text-pink-300 transition-colors">Settings</Link>
            </div>
          </div>
        </footer>

        {/* Global ⌘K Search Modal */}
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}

