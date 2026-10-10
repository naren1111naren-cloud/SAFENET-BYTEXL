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
      <aside className="hidden lg:flex w-72 flex-col bg-[#080B11] border-r border-[#1E2638] shrink-0 sticky top-0 h-screen z-30 select-none">
        {/* Radar Logo Header */}
        <div className="h-20 px-6 border-b border-[#1E2638] flex items-center bg-[#080B11]">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <SafenetLogo size={22} showWordmark={true} />
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <div className="flex-1 py-6 px-3 space-y-7 overflow-y-auto">
          {/* Intelligence Section */}
          <div className="space-y-1.5">
            <div className="px-3 py-1.5 text-[14px] font-mono uppercase tracking-[0.1em] text-[#9CA3AF] font-extrabold flex items-center justify-between">
              <span>RADAR TELEMETRY</span>
              <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
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
                  className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-[20px] transition-all font-bold ${
                    isActive
                      ? 'text-[#F6821F] bg-[#111625] border-l-4 border-[#F6821F]'
                      : 'text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#0E131F]'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-[#F6821F]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Hairline Divider */}
          <div className="border-t border-[#1E2638] mx-2" />

          {/* Workspace Section */}
          <div className="space-y-1.5">
            <div className="px-3 py-1.5 text-[14px] font-mono uppercase tracking-[0.1em] text-[#9CA3AF] font-extrabold">
              WORKSPACE &amp; AUDIT
            </div>
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-lg text-[20px] transition-all font-bold ${
                    isActive
                      ? 'text-[#F6821F] bg-[#111625] border-l-4 border-[#F6821F]'
                      : 'text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#0E131F]'
                  }`}
                >
                  <span className="flex items-center gap-3.5">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-[#F6821F]' : 'text-[#9CA3AF]'}`} />
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="h-2 w-2 rounded-full bg-[#F6821F]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Cloudflare Radar Monitored Entity Indicator */}
        <div className="p-4 border-t border-[#1E2638] bg-[#0E131F] flex items-center justify-between text-[16px]">
          <span className="font-bold text-[#9CA3AF]">Monitored Perimeter</span>
          <span className="text-[#FFFFFF] font-bold flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#F6821F]" />
            {brand?.name || 'Paytm'}
          </span>
        </div>
      </aside>

      {/* ── RIGHT MAIN COLUMN ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* ── CLOUDFLARE RADAR TOP NAVIGATION ── */}
        <header className="h-20 bg-[#080B11]/95 backdrop-blur-md border-b border-[#1E2638] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-40 shrink-0">
          {/* Left: Mobile Toggle & Radar Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#111625] rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link href="/" className="lg:hidden">
              <SafenetLogo size={18} showWordmark={false} />
            </Link>

            <div className="hidden sm:flex items-center gap-2.5 text-[17px] text-[#FFFFFF] font-bold">
              <span className="text-[#FFFFFF] font-extrabold tracking-wide">SAFENET RADAR</span>
              <span className="text-[#1E2638]">/</span>
              <span className="inline-flex items-center gap-1.5 text-[14px] font-mono font-bold text-[#F6821F] bg-[#F6821F]/10 border border-[#F6821F]/25 px-2.5 py-0.5 rounded-md">
                <Radio className="h-3.5 w-3.5 text-[#F6821F] animate-pulse" />
                GLOBAL RADAR ACTIVE
              </span>
            </div>
          </div>

          {/* Center: Global Search Control */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#0E131F] hover:bg-[#111625] border border-[#1E2638] hover:border-[#28334E] text-[17px] text-[#FFFFFF] font-bold transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-[#F6821F]" />
                <span className="text-[#9CA3AF] font-bold">Search domains, ASN, apps, threats...</span>
              </div>
              <kbd className="text-[13px] font-mono bg-[#111625] text-[#FFFFFF] border border-[#1E2638] px-2 py-0.5 rounded font-bold">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Quick Check + Brand Profile + User */}
          <div className="flex items-center gap-4">
            <Link
              href="/check"
              className="text-[17px] text-[#FFFFFF] hover:text-[#F6821F] transition-colors font-bold hidden sm:inline"
            >
              Check
            </Link>

            {/* Brand Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBrandDropdown(!showBrandDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#1E2638] bg-[#0E131F] hover:bg-[#111625] text-[16px] text-[#FFFFFF] font-bold transition-colors cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-[#F6821F]" />
                <span>{brand?.name || 'Paytm'}</span>
                <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
              </button>

              {showBrandDropdown && (
                <div className="absolute right-0 mt-2 w-60 bg-[#111625] border border-[#1E2638] rounded-xl shadow-2xl z-50 p-2 text-[16px]">
                  <button
                    onClick={() => handleSelectPreset('Paytm')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer font-bold ${
                      brand?.name === 'Paytm'
                        ? 'bg-[#161D2F] text-[#F6821F]'
                        : 'text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#0E131F]'
                    }`}
                  >
                    <span>Paytm (Fintech)</span>
                    {brand?.name === 'Paytm' && <span className="text-[#F6821F]">✓</span>}
                  </button>
                  <button
                    onClick={() => handleSelectPreset('Nike')}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer font-bold ${
                      brand?.name === 'Nike'
                        ? 'bg-[#161D2F] text-[#F6821F]'
                        : 'text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#0E131F]'
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
              className="relative p-2.5 text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#111625] rounded-lg transition-colors cursor-pointer"
              title="Alerts"
            >
              <Bell className="h-5 w-5" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[#FF4D4D]" />
              )}
            </button>

            {/* User Session Profile & Demo Account Switcher */}
            {user ? (
              <div className="relative pl-3 border-l border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0E131F] hover:bg-[#111625] border border-[#1E2638] text-[16px] text-[#FFFFFF] font-bold transition-colors cursor-pointer"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#F6821F]/20 text-[#F6821F] text-[12px] font-bold">
                    ID
                  </span>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-[15px] font-mono text-[#FFFFFF] font-bold max-w-[150px] truncate">
                      {user.email}
                    </span>
                    <span className="text-[12px] text-[#F6821F] font-bold mt-1">
                      Demo Account • Switch
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#111625] border border-[#1E2638] rounded-xl shadow-2xl z-50 p-2.5 text-[16px] animate-fade-in">
                    <div className="px-3 py-2 mb-1.5 border-b border-[#1E2638] flex items-center justify-between">
                      <span className="text-[13px] font-mono uppercase tracking-wider text-[#9CA3AF] font-extrabold">
                        SELECT DEMO IDENTITY
                      </span>
                      <span className="text-[12px] bg-[#F6821F]/20 text-[#F6821F] font-bold px-2 py-0.5 rounded">
                        RADAR ACCESS
                      </span>
                    </div>

                    <div className="space-y-1.5 py-1">
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
                            className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer font-bold ${
                              isCurrent
                                ? 'bg-[#161D2F] text-[#F6821F]'
                                : 'text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#0E131F]'
                            }`}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-[16px] text-[#FFFFFF]">
                                {acc.name}
                              </span>
                              <span className="text-[13px] font-mono text-[#9CA3AF] font-bold">
                                {acc.email}
                              </span>
                              <span className="text-[12px] text-[#F6821F] font-bold">
                                {acc.badge}
                              </span>
                            </div>
                            {isCurrent && (
                              <span className="text-sm font-bold text-[#F6821F]">Active ✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t border-[#1E2638] mt-2 pt-2 flex items-center justify-between px-1.5">
                      <Link
                        href="/login"
                        onClick={() => setShowUserDropdown(false)}
                        className="text-[14px] text-[#F6821F] hover:underline font-bold"
                      >
                        More Demo IDs
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
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[14px] text-[#FF4D4D] hover:bg-[#FF4D4D]/10 rounded-md font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-[#F6821F] hover:bg-[#FA8B28] text-[16px] text-[#FFFFFF] font-bold transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* ── MOBILE NAV DRAWER ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#080B11] border-b border-[#1E2638] px-4 py-4 space-y-2 z-30 shadow-2xl">
            {intelligenceNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3.5 py-2.5 text-[19px] font-bold text-[#FFFFFF] hover:text-[#F6821F] hover:bg-[#0E131F] rounded-lg"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#1E2638] flex items-center justify-between text-[16px] text-[#9CA3AF] font-bold">
              <Link href="/guide" className="hover:text-[#FFFFFF]">Safety Guide</Link>
              <Link href="/setup" className="hover:text-[#FFFFFF]">Settings</Link>
            </div>
          </div>
        )}

        {/* ── WORKSPACE CANVAS ── */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
          {(pageTitle || pageSubtitle) && (
            <div className="mb-10 pb-6 border-b border-[#1E2638]">
              {pageTitle && (
                <h1 className="text-[40px] sm:text-[52px] font-extrabold text-[#FFFFFF] tracking-tight leading-tight">
                  {pageTitle}
                </h1>
              )}
              {pageSubtitle && (
                <p className="text-[20px] sm:text-[22px] text-[#9CA3AF] mt-2.5 font-bold leading-relaxed">
                  {pageSubtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </main>

        {/* ── CLOUDFLARE RADAR STYLE FOOTER ── */}
        <footer className="border-t border-[#1E2638] bg-[#080B11] text-[#9CA3AF] text-[17px] py-8 px-4 sm:px-8 mt-auto font-bold">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#FFFFFF]">SAFENET RADAR</span>
              <span className="text-[#1E2638]">•</span>
              <span className="text-[#9CA3AF]">Global Digital Threat &amp; Brand Perimeter Telemetry</span>
            </div>
            <div className="flex items-center gap-6 text-[#FFFFFF] font-bold flex-wrap">
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
