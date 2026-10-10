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
  Smartphone,
  Share2,
  LogOut,
  Radio,
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
  const { user, signOut, demoAccounts, loginWithDemo } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowAlertsDropdown(false);
    setShowBrandDropdown(false);
    setShowUserDropdown(false);
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
    { label: 'Check & Verify', href: '/check', icon: Search },
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
    <div className="min-h-screen flex bg-[#080B11] text-[#FFFFFF] font-sans antialiased selection:bg-[#F6821F]/25 selection:text-[#FFFFFF] relative">
      {/* ── LEFT RADAR DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#080B11] border-r border-[#1E2638] shrink-0 sticky top-0 h-screen z-30 select-none">
        {/* Radar Logo Header */}
        <div className="h-16 px-5 border-b border-[#1E2638] flex items-center bg-[#080B11]">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <SafenetLogo size={18} showWordmark={true} />
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
          {/* Intelligence Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-[0.1em] text-[#9CA3AF] font-semibold flex items-center justify-between">
              <span>RADAR TELEMETRY</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] transition-all ${
                    isActive
                      ? 'text-[#F6821F] bg-[#111625] font-semibold border-l-2 border-[#F6821F]'
                      : 'text-[#E5E7EB] font-normal hover:text-[#FFFFFF] hover:bg-[#0E131F]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F6821F]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Hairline Divider */}
          <div className="border-t border-[#1E2638] mx-2" />

          {/* Workspace Section */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-[0.1em] text-[#9CA3AF] font-semibold">
              WORKSPACE
            </div>
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] transition-all ${
                    isActive
                      ? 'text-[#F6821F] bg-[#111625] font-semibold border-l-2 border-[#F6821F]'
                      : 'text-[#E5E7EB] font-normal hover:text-[#FFFFFF] hover:bg-[#0E131F]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F6821F]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Cloudflare Radar Monitored Entity Indicator */}
        <div className="p-3.5 border-t border-[#1E2638] bg-[#0E131F] flex items-center justify-between text-[13px]">
          <span className="text-[#9CA3AF] font-normal">Perimeter</span>
          <span className="text-[#FFFFFF] font-medium flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#F6821F]" />
            {brand?.name || 'Paytm'}
          </span>
        </div>
      </aside>

      {/* ── RIGHT MAIN COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ── CLOUDFLARE RADAR TOP NAVIGATION ── */}
        <header className="h-16 bg-[#080B11]/95 backdrop-blur-md border-b border-[#1E2638] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40 shrink-0">
          {/* Left: Mobile Toggle & Radar Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#111625] rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="lg:hidden">
              <SafenetLogo size={16} showWordmark={false} />
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-[14px] text-[#FFFFFF]">
              <span className="text-[#FFFFFF] font-semibold tracking-wide">SAFENET RADAR</span>
              <span className="text-[#1E2638]">/</span>
              <span className="inline-flex items-center gap-1.5 text-[12px] font-mono font-medium text-[#F6821F] bg-[#F6821F]/10 border border-[#F6821F]/25 px-2 py-0.5 rounded">
                <Radio className="h-3 w-3 text-[#F6821F] animate-pulse" />
                LIVE RADAR
              </span>
            </div>
          </div>

          {/* Center: Global Search Control */}
          <div className="flex-1 max-w-sm hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0E131F] hover:bg-[#111625] border border-[#1E2638] hover:border-[#28334E] text-[13px] text-[#FFFFFF] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-3.5 w-3.5 text-[#F6821F]" />
                <span className="text-[#9CA3AF] font-normal">Filter domains, ASN, threats...</span>
              </div>
              <kbd className="text-[11px] font-mono bg-[#111625] text-[#9CA3AF] border border-[#1E2638] px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick Check + Brand Profile + User */}
          <div className="flex items-center gap-3">
            <Link
              href="/check"
              className="text-[14px] text-[#E5E7EB] hover:text-[#F6821F] transition-colors font-medium hidden sm:inline"
            >
              Quick Check
            </Link>

            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1E2638] bg-[#0E131F] hover:bg-[#111625] text-[13px] text-[#FFFFFF] font-medium transition-colors cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-[#F6821F]" />
                <span>{brand?.name || 'Paytm'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
              </button>

              {showBrandDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-[#111625] border border-[#1E2638] rounded-lg shadow-xl z-50 p-1.5 text-[13px]">
                  <button
                    onClick={() => handleSelectPreset('Paytm')}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                      brand?.name === 'Paytm'
                        ? 'bg-[#161D2F] text-[#F6821F] font-semibold'
                        : 'text-[#E5E7EB] hover:text-[#F6821F] hover:bg-[#0E131F]'
                    }`}
                  >
                    <span>Paytm (Fintech)</span>
                    {brand?.name === 'Paytm' && <span className="text-[#F6821F]">✓</span>}
                  </button>
                  <button
                    onClick={() => handleSelectPreset('Nike')}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                      brand?.name === 'Nike'
                        ? 'bg-[#161D2F] text-[#F6821F] font-semibold'
                        : 'text-[#E5E7EB] hover:text-[#F6821F] hover:bg-[#0E131F]'
                    }`}
                  >
                    <span>Nike (Retail)</span>
                    {brand?.name === 'Nike' && <span className="text-[#F6821F]">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="relative p-2 text-[#E5E7EB] hover:text-[#F6821F] hover:bg-[#111625] rounded-lg transition-colors cursor-pointer"
              title="Alerts"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF4D4D]" />
              )}
            </button>

            {/* User Session Profile & Demo Account Switcher */}
            {user ? (
              <div className="relative pl-2.5 border-l border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0E131F] hover:bg-[#111625] border border-[#1E2638] text-[13px] text-[#FFFFFF] font-medium transition-colors cursor-pointer"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#F6821F]/20 text-[#F6821F] text-[11px] font-semibold">
                    ID
                  </span>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-[13px] font-mono text-[#FFFFFF] font-medium max-w-[130px] truncate">
                      {user.email}
                    </span>
                    <span className="text-[11px] text-[#F6821F] mt-0.5">
                      Demo User
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#9CA3AF]" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#111625] border border-[#1E2638] rounded-xl shadow-2xl z-50 p-2 text-[13px] animate-fade-in">
                    <div className="px-2.5 py-1.5 mb-1 border-b border-[#1E2638] flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF] font-semibold">
                        DEMO IDENTITY
                      </span>
                      <span className="text-[11px] bg-[#F6821F]/20 text-[#F6821F] font-medium px-1.5 py-0.5 rounded">
                        RADAR ACCESS
                      </span>
                    </div>

                    <div className="space-y-1 py-1">
                      {demoAccounts.map((acc) => {
                        const isCurrent = user.email?.toLowerCase() === acc.email.toLowerCase();
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={async () => {
                              await loginWithDemo(acc.id);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-[#161D2F] text-[#F6821F] font-semibold'
                                : 'text-[#E5E7EB] hover:text-[#F6821F] hover:bg-[#0E131F]'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="text-[13px] text-[#FFFFFF] font-medium">
                                {acc.name}
                              </span>
                              <span className="text-[11px] font-mono text-[#9CA3AF]">
                                {acc.email}
                              </span>
                            </div>
                            {isCurrent && (
                              <span className="text-[12px] font-medium text-[#F6821F]">Active ✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-[#1E2638] mt-1.5 pt-1.5 flex items-center justify-between px-1">
                      <Link
                        href="/login"
                        onClick={() => setShowUserDropdown(false)}
                        className="text-[12px] text-[#F6821F] hover:underline font-medium"
                      >
                        All Profiles
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          setLoggingOut(true);
                          setShowUserDropdown(false);
                          try {
                            await signOut();
                            router.push('/login');
                          } finally {
                            setLoggingOut(false);
                          }
                        }}
                        disabled={loggingOut}
                        className="flex items-center gap-1 px-2.5 py-1 text-[12px] text-[#FF4D4D] hover:bg-[#FF4D4D]/10 rounded font-medium transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-lg bg-[#F6821F] hover:bg-[#FA8B28] text-[13px] text-[#FFFFFF] font-medium transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* ── MOBILE NAV DRAWER ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#080B11] border-b border-[#1E2638] px-4 py-3 space-y-1.5 z-30 shadow-2xl">
            {intelligenceNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 text-[15px] font-medium text-[#E5E7EB] hover:text-[#F6821F] hover:bg-[#0E131F] rounded-lg"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-[#1E2638] flex items-center justify-between text-[13px] text-[#9CA3AF]">
              <Link href="/guide" className="hover:text-[#FFFFFF]">Safety Guide</Link>
              <Link href="/setup" className="hover:text-[#FFFFFF]">Settings</Link>
            </div>
          </div>
        )}

        {/* ── WORKSPACE CANVAS ── */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {(pageTitle || pageSubtitle) && (
            <div className="mb-8 pb-5 border-b border-[#1E2638]">
              {pageTitle && (
                <h1 className="text-[28px] sm:text-[34px] font-semibold text-[#FFFFFF] tracking-tight leading-tight">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-[15px] sm:text-[16px] text-[#9CA3AF] mt-1.5 font-normal leading-relaxed">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>

        {/* ── CLOUDFLARE RADAR STYLE FOOTER ── */}
        <footer className="border-t border-[#1E2638] bg-[#080B11] text-[#9CA3AF] text-[13px] py-5 px-4 sm:px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#FFFFFF]">SAFENET RADAR</span>
              <span className="text-[#1E2638]">•</span>
              <span className="text-[#9CA3AF] font-normal">Global Digital Threat &amp; Perimeter Telemetry</span>
            </div>
            <div className="flex items-center gap-5 text-[#E5E7EB] font-normal flex-wrap">
              <Link href="/check" className="hover:text-[#F6821F] transition-colors">Check</Link>
              <Link href="/overview" className="hover:text-[#F6821F] transition-colors">Overview</Link>
              <Link href="/apps" className="hover:text-[#F6821F] transition-colors">Apps</Link>
              <Link href="/social" className="hover:text-[#F6821F] transition-colors">Social</Link>
              <Link href="/campaigns" className="hover:text-[#F6821F] transition-colors">Campaigns</Link>
              <Link href="/reports" className="hover:text-[#F6821F] transition-colors">Reports</Link>
              <Link href="/setup" className="hover:text-[#F6821F] transition-colors">Settings</Link>
            </div>
          </div>
        </footer>

        {/* Global ⌘K Search Modal */}
        <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}
