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
    <div className="min-h-screen flex bg-[#F7F8F6] text-[#0A0D0C] font-sans antialiased selection:bg-[#477A60]/15 selection:text-[#0A0D0C] relative">
      {/* ── LEFT DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#FFFFFF] border-r border-[#DDE2DC] shrink-0 sticky top-0 h-screen z-30 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
        {/* Logo Header */}
        <div className="h-16 px-6 border-b border-[#DDE2DC] flex items-center bg-[#FFFFFF]">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <SafenetLogo size={18} showWordmark={true} />
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
          {/* Intelligence Section */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-sans uppercase tracking-[0.08em] text-[#3A453F] font-extrabold">
              THREAT INTELLIGENCE
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[14px] transition-all ${
                    isActive
                      ? 'text-[#194D34] bg-[#E3EFE7] border border-[#BFD9C7] shadow-xs font-bold'
                      : 'text-[#202723] hover:text-[#000000] hover:bg-[#ECEFEC] font-semibold border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#194D34]' : 'text-[#4A554F]'}`} />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-4 w-1 rounded-full bg-[#194D34]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Thin Hairline Divider */}
          <div className="border-t border-[#DDE2DC] mx-2" />

          {/* Workspace Section */}
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-sans uppercase tracking-[0.08em] text-[#3A453F] font-extrabold">
              WORKSPACE
            </div>
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[14px] transition-all ${
                    isActive
                      ? 'text-[#194D34] bg-[#E3EFE7] border border-[#BFD9C7] shadow-xs font-bold'
                      : 'text-[#202723] hover:text-[#000000] hover:bg-[#ECEFEC] font-semibold border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#194D34]' : 'text-[#4A554F]'}`} />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-4 w-1 rounded-full bg-[#194D34]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quiet Bottom Environment Indicator */}
        <div className="p-3.5 border-t border-[#DDE2DC] bg-[#F7F8F6] flex items-center justify-between text-[13px] text-[#202723]">
          <span className="font-semibold text-[#3A453F]">Monitored Perimeter</span>
          <span className="text-[#0A0D0C] font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2E6B47]" />
            {brand?.name || 'Paytm'}
          </span>
        </div>
      </aside>

      {/* ── RIGHT MAIN COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ── TOP NAVIGATION ── */}
        <header className="h-16 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#DDE2DC] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-40 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-[#202723] hover:text-[#000000] hover:bg-[#ECEFEC] rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="lg:hidden">
              <SafenetLogo size={16} showWordmark={false} />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-[14px] text-[#313B36] font-semibold">
              <span className="text-[#0A0D0C] font-extrabold">SAFENET</span>
              <span className="text-[#858D86]">/</span>
              <span>Digital Risk Decision System</span>
            </div>
          </div>

          {/* Center: Global Search Control */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#F7F8F6] hover:bg-[#ECEFEC] border border-[#DDE2DC] text-[13px] text-[#202723] hover:text-[#000000] transition-all cursor-pointer shadow-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-[#4A554F]" />
                <span className="text-[#3A453F]">Search domains, URLs, apps, incidents...</span>
              </div>
              <kbd className="text-[11px] font-mono bg-[#FFFFFF] text-[#0A0D0C] border border-[#DDE2DC] px-2 py-0.5 rounded shadow-xs font-bold">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick Check + Brand Profile + User */}
          <div className="flex items-center gap-3">
            <Link
              href="/check"
              className="text-[14px] text-[#202723] hover:text-[#000000] transition-colors font-bold hidden sm:inline"
            >
              Quick Check
            </Link>

            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#DDE2DC] bg-[#FFFFFF] hover:bg-[#F7F8F6] text-[13px] text-[#0A0D0C] font-bold transition-colors cursor-pointer shadow-xs"
              >
                <span className="h-2 w-2 rounded-full bg-[#2E6B47]" />
                <span>{brand?.name || 'Paytm'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#4A554F]" />
              </button>

              {showBrandDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[#FFFFFF] border border-[#DDE2DC] rounded-xl shadow-xl z-50 p-1.5 text-[13px]">
                  <button
                    onClick={() => handleSelectPreset('Paytm')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      brand?.name === 'Paytm'
                        ? 'bg-[#E3EFE7] text-[#194D34] font-bold'
                        : 'text-[#202723] hover:text-[#000000] hover:bg-[#ECEFEC] font-semibold'
                    }`}
                  >
                    <span>Paytm (Fintech)</span>
                    {brand?.name === 'Paytm' && <span className="text-[#194D34] font-bold">✓</span>}
                  </button>
                  <button
                    onClick={() => handleSelectPreset('Nike')}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                      brand?.name === 'Nike'
                        ? 'bg-[#E3EFE7] text-[#194D34] font-bold'
                        : 'text-[#202723] hover:text-[#000000] hover:bg-[#ECEFEC] font-semibold'
                    }`}
                  >
                    <span>Nike (Retail)</span>
                    {brand?.name === 'Nike' && <span className="text-[#194D34] font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 text-[#202723] hover:text-[#000000] hover:bg-[#ECEFEC] rounded-lg transition-colors cursor-pointer"
              title="Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C93643]" />
              )}
            </button>

            {/* User Session Profile & Sign Out Action */}
            {user ? (
              <div className="flex items-center gap-2 pl-3 border-l border-[#DDE2DC]">
                <div
                  title={user.email || 'Authenticated User'}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F8F6] border border-[#DDE2DC] text-[13px] font-mono text-[#0A0D0C] font-semibold max-w-[160px] truncate"
                >
                  <User className="h-3.5 w-3.5 text-[#2E6B47] shrink-0" />
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
                  className="flex items-center gap-1 p-2 text-[#202723] hover:text-[#C93643] hover:bg-[#FDF2F3] rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg bg-[#2E6B47] hover:bg-[#235337] text-[13px] text-white font-bold transition-all shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* ── MOBILE NAV DRAWER ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFFFFF] border-b border-[#DDE2DC] px-4 py-3 space-y-1 z-30 shadow-md">
            {intelligenceNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-[14px] font-semibold text-[#202723] hover:text-[#000000] hover:bg-[#F7F8F6] rounded-lg"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#DDE2DC] flex items-center justify-between text-[13px] text-[#313B36] font-semibold">
              <Link href="/guide" className="hover:text-[#000000]">Safety Guide</Link>
              <Link href="/setup" className="hover:text-[#000000]">Settings</Link>
            </div>
          </div>
        )}

        {/* ── WORKSPACE CANVAS ── */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
          {(pageTitle || pageSubtitle) && (
            <div className="mb-8 pb-5 border-b border-[#DDE2DC]">
              {pageTitle && (
                <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#0A0D0C] tracking-tight leading-tight">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-[15px] sm:text-[16px] text-[#313B36] mt-2 font-normal leading-relaxed">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>

        {/* ── SYSTEM FOOTER ── */}
        <footer className="border-t border-[#DDE2DC] bg-[#FFFFFF] text-[#3A453F] text-[13px] py-6 px-4 sm:px-8 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-medium text-[#3A453F]">SAFENET • Organic Monochrome • Enterprise Digital Risk Protection</span>
            <div className="flex items-center gap-5 text-[#202723] font-semibold">
              <Link href="/check" className="hover:text-[#194D34] transition-colors">Check</Link>
              <Link href="/overview" className="hover:text-[#194D34] transition-colors">Overview</Link>
              <Link href="/apps" className="hover:text-[#194D34] transition-colors">Apps</Link>
              <Link href="/social" className="hover:text-[#194D34] transition-colors">Social</Link>
              <Link href="/campaigns" className="hover:text-[#194D34] transition-colors">Campaigns</Link>
              <Link href="/reports" className="hover:text-[#194D34] transition-colors">Reports</Link>
              <Link href="/setup" className="hover:text-[#194D34] transition-colors">Settings</Link>
            </div>
          </div>
        </footer>

        {/* Global ⌘K Search Modal */}
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}
