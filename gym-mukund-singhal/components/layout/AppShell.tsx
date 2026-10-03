'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Receipt,
  Settings,
  Menu,
  X,
  UserPlus,
  Database,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { AddMemberModal } from '@/components/members/AddMemberModal';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);

  // All React Hooks MUST be called at the top level unconditionally before any return
  useEffect(() => {
    // If viewing the Admin Builder factory, do not poll staff gym status
    if (pathname?.startsWith('/admin')) {
      return;
    }

    let isCancelled = false;
    fetch('/api/gym/status')
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success) {
          setSupabaseConnected(data.data.connected);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSupabaseConnected(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pathname]);

  // If in the Admin Builder routes, do not wrap with the Staff Gym App shell
  // We return here strictly AFTER all hooks have executed
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Members', href: '/members', icon: Users },
    { label: 'Membership Plans', href: '/plans', icon: Dumbbell },
    { label: 'Payments', href: '/payments', icon: Receipt },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const getPageTitle = () => {
    if (pathname === '/') return 'Gym Dashboard';
    if (pathname?.startsWith('/members')) return 'Member Directory';
    if (pathname?.startsWith('/plans')) return 'Membership Plans';
    if (pathname?.startsWith('/payments')) return 'Payment History';
    if (pathname?.startsWith('/settings')) return 'Club Settings & Supabase';
    return 'Dashboard';
  };

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#F8F7FC] text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <header className="md:hidden bg-white border-b border-purple-100/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white shadow-xs">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight">Mukund Singhal Gym</span>
            <span className="text-[10px] text-purple-600 block -mt-1 font-medium">Mukund Singhal Gym</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-1"
            title="Factory Admin Builder"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
          <button
            onClick={() => setAddMemberModalOpen(true)}
            className="p-1.5 rounded-lg bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors"
            title="Enroll Member"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex">
          <div className="w-64 bg-white h-full p-4 flex flex-col shadow-2xl border-r border-purple-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center text-white">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900">Mukund Singhal Gym</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-2.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl text-xs font-medium shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Admin Builder Factory</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-300" />
              </Link>
              <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 text-xs">
                <div className="flex items-center gap-2 text-purple-900 font-medium mb-1">
                  <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Mukund Singhal Gym</span>
                </div>
                <p className="text-slate-500 text-[11px]">Noida Sector 18 · ₹ INR</p>
              </div>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white border-r border-purple-100/80 min-h-screen sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="p-5 border-b border-purple-50">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white shadow-sm shadow-purple-200">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">Mukund Singhal Gym</span>
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">STAFF</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Mukund Singhal Gym</p>
            </div>
          </Link>
        </div>

        {/* Quick Action */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => setAddMemberModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-medium shadow-sm shadow-purple-200 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Member</span>
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purple-50 text-[#7C3AED] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#7C3AED]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-100">
            <div className="px-3.5 mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              App Factory
            </div>
            <Link
              href="/admin"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-slate-900 to-indigo-900 text-white hover:from-slate-800 hover:to-indigo-800 transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Builder</span>
              </div>
              <ArrowRight className="w-3 h-3 text-indigo-300" />
            </Link>
          </div>
        </nav>

        {/* Bottom Sidebar Info */}
        <div className="p-4 border-t border-purple-50 space-y-3">
          {/* Supabase status indicator */}
          <Link
            href="/settings"
            className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 hover:bg-purple-50 border border-purple-100/60 text-xs text-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span className="font-medium">Supabase DB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-purple-500'
                }`}
              />
              <span className="text-[11px] text-slate-500">
                {supabaseConnected ? 'PostgreSQL' : 'Active'}
              </span>
            </div>
          </Link>

          {/* Current Staff */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 text-[#7C3AED] font-bold text-xs flex items-center justify-center">
              VR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">Vikram Rathore</p>
              <p className="text-[11px] text-slate-500 truncate">Admin · Noida Branch</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-purple-100/80 px-8 py-4 sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{getPageTitle()}</h1>
            <p className="text-xs text-slate-500">
              Mukund Singhal Gym · Strength • Health • Community
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>{todayFormatted}</span>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Builder</span>
            </Link>
            <button
              onClick={() => setAddMemberModalOpen(true)}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-medium shadow-xs shadow-purple-200 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Member</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Add Member Modal */}
      <AddMemberModal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new CustomEvent('gym:data-refresh'));
        }}
      />
    </div>
  );
}
