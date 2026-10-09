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
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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
  const { user, loading, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/home') {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, pathname, router]);

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
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-blue-600/15 selection:text-blue-800 relative">
      {/* ── LEFT ENTERPRISE SIDEBAR (DESKTOP) ── */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200/90 shrink-0 sticky top-0 h-screen z-30 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
        {/* Logo Header */}
        <div className="h-16 px-6 border-b border-slate-200/80 flex items-center bg-white">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <SafenetLogo size={18} showWordmark={true} />
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-5 px-3.5 space-y-6 overflow-y-auto">
          {/* Intelligence Section */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-sans uppercase tracking-[0.08em] text-slate-400 font-bold">
              INTELLIGENCE
            </div>
            {intelligenceNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === '/investigate' && pathname.startsWith('/threat')) ||
                (item.href === '/overview' && pathname === '/dashboard');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/90 border border-blue-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-4 w-1 rounded-full bg-blue-600" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Thin Hairline Divider */}
          <div className="border-t border-slate-200/80 mx-2" />

          {/* Workspace Section */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-sans uppercase tracking-[0.08em] text-slate-400 font-bold">
              WORKSPACE
            </div>
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'text-blue-700 bg-blue-50/90 border border-blue-200/60 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-4 w-1 rounded-full bg-blue-600" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quiet Bottom Environment Indicator */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium">Active Perimeter</span>
          <span className="text-slate-900 font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {brand?.name || 'Paytm'}
          </span>
        </div>
      </aside>

      {/* ── RIGHT MAIN COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ── TOP NAVIGATION ── */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-40 shrink-0 shadow-xs">
          {/* Left: Mobile Toggle & Minimal Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="lg:hidden">
              <SafenetLogo size={16} showWordmark={false} />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-[13px] text-slate-500 font-medium">
              <span className="text-slate-900 font-semibold">SAFENET</span>
              <span className="text-slate-300">/</span>
              <span>Digital Risk Decision System</span>
            </div>
          </div>

          {/* Center: Subtle Global Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 text-[13px] text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-slate-400" />
                <span>Search domains, URLs, apps, incidents...</span>
              </div>
              <kbd className="text-[11px] font-mono bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded shadow-xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick Check + Brand Profile + User */}
          <div className="flex items-center gap-3">
            <Link
              href="/check"
              className="text-[13px] text-slate-600 hover:text-blue-600 transition-colors font-medium hidden sm:inline"
            >
              Quick Check
            </Link>

            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-800 hover:bg-slate-50 font-medium transition-colors cursor-pointer shadow-xs"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{brand?.name || 'Paytm'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showBrandDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 text-[13px]">
                  <button
                    onClick={() => handleSelectPreset('Paytm')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                      brand?.name === 'Paytm'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Paytm (Fintech)</span>
                    {brand?.name === 'Paytm' && <span className="text-blue-600">✓</span>}
                  </button>
                  <button
                    onClick={() => handleSelectPreset('Nike')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                      brand?.name === 'Nike'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Nike (Retail)</span>
                    {brand?.name === 'Nike' && <span className="text-blue-600">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </button>

            {/* User Session Profile & Sign Out Action */}
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div
                  title={user.email || 'Authenticated User'}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[12px] font-mono text-slate-700 max-w-[150px] truncate"
                >
                  <User className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{user.email?.split('@')[0]}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setLoggingOut(true);
                    try {
                      await signOut();
                      router.push('/login');
                    } finally {
                      setLoggingOut(false);
                    }
                  }}
                  disabled={loggingOut}
                  title="Sign out of SAFENET"
                  className="flex items-center gap-1 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-[12px] text-white font-semibold shadow-xs transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* ── MOBILE NAV DRAWER ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 z-30 shadow-md">
            {intelligenceNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[12px] text-slate-500">
              <Link href="/guide" className="hover:text-slate-900">Safety Guide</Link>
              <Link href="/setup" className="hover:text-slate-900">Settings</Link>
            </div>
          </div>
        )}

        {/* ── ENTERPRISE WORKSPACE CANVAS ── */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
          {(pageTitle || pageSubtitle) && (
            <div className="mb-8 pb-5 border-b border-slate-200">
              {pageTitle && (
                <h1 className="text-[26px] sm:text-[32px] font-bold text-slate-900 tracking-tight">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-[14px] text-slate-500 mt-1.5 font-normal">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>

        {/* ── SYSTEM FOOTER ── */}
        <footer className="border-t border-slate-200 bg-white text-slate-500 text-[12px] py-6 px-4 sm:px-8 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>SAFENET • Digital Risk Decision System • Enterprise Protection Engine</span>
            <div className="flex items-center gap-5 text-slate-600 font-medium">
              <Link href="/check" className="hover:text-slate-900">Check</Link>
              <Link href="/overview" className="hover:text-slate-900">Overview</Link>
              <Link href="/campaigns" className="hover:text-slate-900">Campaigns</Link>
              <Link href="/reports" className="hover:text-slate-900">Reports</Link>
              <Link href="/setup" className="hover:text-slate-900">Settings</Link>
            </div>
          </div>
        </footer>

        {/* Global ⌘K Search Modal */}
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}
