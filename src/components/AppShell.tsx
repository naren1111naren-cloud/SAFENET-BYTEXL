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
    <div className="min-h-screen flex bg-[#080A0B] text-[#F2F4F3] font-sans antialiased selection:bg-[#18E6A3]/20 selection:text-white relative">
      {/* Ambient Network Telemetry Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-25 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: "url('/images/dark-bg.jpg')" }}
      />

      {/* ── LEFT QUIET EDITORIAL SIDEBAR (DESKTOP) ── */}
      <aside className="hidden lg:flex w-56 flex-col bg-[#080A0B]/90 backdrop-blur-md border-r border-[rgba(255,255,255,0.08)] shrink-0 sticky top-0 h-screen z-30 select-none">
        {/* Logo Header */}
        <div className="h-14 px-5 border-b border-[rgba(255,255,255,0.08)] flex items-center">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <SafenetLogo size={16} showWordmark={true} />
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {/* Intelligence Section */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-sans uppercase tracking-[0.08em] text-[#59625F] font-semibold">
              INTELLIGENCE
            </div>
            {intelligenceNav.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === '/investigate' && pathname.startsWith('/threat')) ||
                (item.href === '/overview' && pathname === '/dashboard');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-[13px] transition-colors relative ${
                    isActive
                      ? 'text-[#F2F4F3] bg-[rgba(255,255,255,0.04)] font-medium'
                      : 'text-[#8A9390] hover:text-[#F2F4F3] hover:bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-3.5 w-0.5 rounded-full bg-[#18E6A3]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Thin Hairline Divider */}
          <div className="border-t border-[rgba(255,255,255,0.06)] mx-2" />

          {/* Workspace Section */}
          <div className="space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-sans uppercase tracking-[0.08em] text-[#59625F] font-semibold">
              WORKSPACE
            </div>
            {workspaceNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-[13px] transition-colors ${
                    isActive
                      ? 'text-[#F2F4F3] bg-[rgba(255,255,255,0.04)] font-medium'
                      : 'text-[#8A9390] hover:text-[#F2F4F3] hover:bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="h-3.5 w-0.5 rounded-full bg-[#18E6A3]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quiet Bottom Environment Indicator */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[11px] text-[#8A9390]">
          <span>Protected</span>
          <span className="text-[#F2F4F3] font-medium flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#18E6A3]" />
            {brand?.name || 'Paytm'}
          </span>
        </div>
      </aside>

      {/* ── RIGHT MAIN COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ── TOP NAVIGATION (SUBTLE & UNCLUTTERED) ── */}
        <header className="h-14 bg-[#080A0B]/85 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40 shrink-0">
          {/* Left: Mobile Toggle & Minimal Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1 text-[#8A9390] hover:text-[#F2F4F3]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            <Link href="/" className="lg:hidden">
              <SafenetLogo size={16} showWordmark={false} />
            </Link>

            <span className="hidden sm:inline text-[13px] text-[#8A9390]">
              SAFENET <span className="text-[#59625F] mx-1">/</span> Digital Risk Decision System
            </span>
          </div>

          {/* Center: Subtle Global Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-[4px] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[12px] text-[#8A9390] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#59625F]" />
                <span>Search domains, URLs, IPs, incidents...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-[rgba(255,255,255,0.06)] text-[#8A9390] px-1.5 py-0.2 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick Check + Brand Profile + User */}
          <div className="flex items-center gap-3">
            <Link
              href="/check"
              className="text-[12px] text-[#8A9390] hover:text-[#18E6A3] transition-colors font-medium hidden sm:inline"
            >
              Quick Check
            </Link>

            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-[4px] border border-[rgba(255,255,255,0.08)] text-[12px] text-[#F2F4F3] hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#18E6A3]" />
                <span>{brand?.name || 'Paytm'}</span>
                <ChevronDown className="h-3 w-3 text-[#59625F]" />
              </button>

              {showBrandDropdown && (
                <div className="absolute right-0 mt-1.5 w-48 bg-[#0D1011] border border-[rgba(255,255,255,0.10)] rounded-[4px] shadow-xl z-50 p-1 text-[12px]">
                  <button
                    onClick={() => handleSelectPreset('Paytm')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[3px] flex items-center justify-between hover:bg-[rgba(255,255,255,0.04)] ${
                      brand?.name === 'Paytm' ? 'text-[#18E6A3]' : 'text-[#F2F4F3]'
                    }`}
                  >
                    <span>Paytm (Fintech)</span>
                    {brand?.name === 'Paytm' && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => handleSelectPreset('Nike')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[3px] flex items-center justify-between hover:bg-[rgba(255,255,255,0.04)] ${
                      brand?.name === 'Nike' ? 'text-[#18E6A3]' : 'text-[#F2F4F3]'
                    }`}
                  >
                    <span>Nike (Retail)</span>
                    {brand?.name === 'Nike' && <span>✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-1.5 text-[#8A9390] hover:text-[#F2F4F3] cursor-pointer"
              title="Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-[#FF5C5C]" />
              )}
            </button>

            {/* User Session Profile & Sign Out Action */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-2 border-l border-[rgba(255,255,255,0.08)]">
                <div
                  title={user.email || 'Authenticated User'}
                  className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#07090A] border border-[rgba(255,255,255,0.08)] text-[11px] font-mono text-[#8A9390] max-w-[140px] truncate"
                >
                  <User className="h-3 w-3 text-[#18E6A3] shrink-0" />
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
                  className="flex items-center gap-1 p-1.5 text-[#8A9390] hover:text-[#FF5C5C] hover:bg-[#FF5C5C]/10 rounded-[2px] transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-2.5 py-1 rounded-[2px] bg-[#18E6A3]/10 hover:bg-[#18E6A3]/20 border border-[#18E6A3]/30 text-[11px] text-[#18E6A3] font-mono uppercase font-semibold transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* ── MOBILE NAV DRAWER ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0D1011] border-b border-[rgba(255,255,255,0.08)] px-4 py-3 space-y-1 z-30">
            {intelligenceNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-[13px] text-[#8A9390] hover:text-[#F2F4F3]"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-[11px] text-[#59625F]">
              <Link href="/guide" className="hover:text-white">Safety Guide</Link>
              <Link href="/setup" className="hover:text-white">Settings</Link>
            </div>
          </div>
        )}

        {/* ── CONTINUOUS INTELLIGENCE CANVAS ── */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {(pageTitle || pageSubtitle) && (
            <div className="mb-8 pb-4 border-b border-[rgba(255,255,255,0.08)]">
              {pageTitle && (
                <h1 className="text-[24px] sm:text-[30px] font-semibold text-[#F2F4F3] tracking-[-0.02em]">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-[13px] text-[#8A9390] mt-1 font-normal">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>

        {/* ── SYSTEM FOOTER ── */}
        <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#080A0B] text-[#59625F] text-[11px] py-6 px-4 sm:px-8 mt-auto">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>SAFENET • Digital Risk Decision System • Check before you trust.</span>
            <div className="flex items-center gap-4 text-[#8A9390]">
              <Link href="/check" className="hover:text-white">Check</Link>
              <Link href="/overview" className="hover:text-white">Overview</Link>
              <Link href="/campaigns" className="hover:text-white">Campaigns</Link>
              <Link href="/reports" className="hover:text-white">Reports</Link>
              <Link href="/setup" className="hover:text-white">Settings</Link>
            </div>
          </div>
        </footer>

        {/* Global ⌘K Search Modal */}
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}
