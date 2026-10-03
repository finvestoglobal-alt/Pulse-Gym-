'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  AlertTriangle,
  UserX,
  CreditCard,
  TrendingUp,
  UserPlus,
  Receipt,
  ArrowRight,
  RefreshCw,
  Phone,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { DashboardStats, Member, Payment } from '@/types/gym';
import { AddMemberModal } from '@/components/members/AddMemberModal';
import { NewPaymentModal } from '@/components/payments/NewPaymentModal';
import { MemberDetailsModal } from '@/components/members/MemberDetailsModal';
import { EditMemberModal } from '@/components/members/EditMemberModal';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [renewingMember, setRenewingMember] = useState<Member | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    fetch('/api/gym/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success) {
          setStats(data.data);
        }
      })
      .catch((err: any) => {
        if (!isCancelled) setError(err.message || 'Error connecting to database');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    const handleRefresh = () => {
      setIsLoading(true);
      setRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener('gym:data-refresh', handleRefresh);
    return () => {
      isCancelled = true;
      window.removeEventListener('gym:data-refresh', handleRefresh);
    };
  }, [refreshTrigger]);

  const refreshData = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleOpenMember = (m: Member) => {
    setSelectedMember(m);
    setDetailsModalOpen(true);
  };

  const handleStartRenew = (m: Member) => {
    setRenewingMember(m);
    setNewPaymentOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="bg-white rounded-2xl border border-purple-100/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
              Pulse Fitness Club Management
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Gym Operations Overview
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time membership metrics, active subscriptions, and cash flow tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors cursor-pointer"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              setRenewingMember(null);
              setNewPaymentOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-semibold border border-purple-100 transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Collect Fee</span>
          </button>

          <button
            onClick={() => setAddMemberOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-sm shadow-purple-200 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Member</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Database Error: {error}</span>
          </div>
          <button
            onClick={() => refreshData()}
            className="underline font-semibold hover:text-rose-950 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Primary Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Enrolled</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {isLoading ? '...' : stats?.totalMembers ?? 0}
            </span>
            <span className="text-xs text-slate-400">members</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Database Registered</span>
            <Link href="/members" className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-0.5">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Active Memberships */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-emerald-800">Active Memberships</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {isLoading ? '...' : stats?.activeMembers ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Valid plan</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Accessing gym floor</span>
            <Link href="/members?status=active" className="text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-0.5">
              <span>Filter active</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-amber-800">Expiring Soon (≤7d)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-950">
              {isLoading ? '...' : stats?.expiringSoonMembers ?? 0}
            </span>
            <span className="text-xs text-amber-700 font-medium">Needs renewal</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Due within 7 days</span>
            <Link href="/members?status=expiring_soon" className="text-amber-700 hover:text-amber-900 font-medium flex items-center gap-0.5">
              <span>Send reminder</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Expired Memberships */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-rose-800">Expired Memberships</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-950">
              {isLoading ? '...' : stats?.expiredMembers ?? 0}
            </span>
            <span className="text-xs text-rose-600 font-medium">Lapsed</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Past validity date</span>
            <Link href="/members?status=expired" className="text-rose-700 hover:text-rose-900 font-medium flex items-center gap-0.5">
              <span>View lapsed</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Revenue Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-purple-100/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Lifetime Collections</span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              ₹{isLoading ? '...' : (stats?.totalRevenue ?? 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Aggregated from all verified invoices</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-purple-100/80 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">This Month&apos;s Revenue</span>
            <p className="text-2xl font-extrabold text-purple-900 mt-1">
              ₹{isLoading ? '...' : (stats?.monthlyRevenue ?? 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
              Current calendar month receipts
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Three Column Action & Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Soon Action List */}
        <div className="bg-white rounded-2xl border border-purple-100/80 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Expiring Memberships</h3>
            </div>
            <Link
              href="/members?status=expiring_soon"
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              See all
            </Link>
          </div>

          <div className="p-4 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading expiring members...</div>
            ) : !stats?.expiringMembersList?.length ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No memberships expiring in the next 7 days.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.expiringMembersList.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-amber-50/40 rounded-xl border border-amber-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{m.name}</p>
                      <p className="text-[11px] text-amber-800 font-medium">
                        Expires: {m.expiry_date} ({m.plan_name})
                      </p>
                      <p className="text-[10px] text-slate-500">{m.phone}</p>
                    </div>

                    <button
                      onClick={() => handleStartRenew(m)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      Renew
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments Feed */}
        <div className="bg-white rounded-2xl border border-purple-100/80 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">Recent Invoices</h3>
            </div>
            <Link
              href="/payments"
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              All payments
            </Link>
          </div>

          <div className="p-4 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading recent invoices...</div>
            ) : !stats?.recentPaymentsList?.length ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No payment transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentPaymentsList.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{p.member_name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span>{p.payment_method}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-purple-600">{p.invoice_number}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{p.payment_date}</span>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-900">₹{p.amount.toLocaleString()}</p>
                      <span className="text-[10px] text-emerald-600 font-medium">Recorded</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recently Added Members */}
        <div className="bg-white rounded-2xl border border-purple-100/80 shadow-xs flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-purple-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">Recently Enrolled</h3>
            </div>
            <Link
              href="/members"
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              All members
            </Link>
          </div>

          <div className="p-4 flex-1">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading new members...</div>
            ) : !stats?.recentlyAddedMembersList?.length ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No members enrolled yet. Click &quot;Enroll Member&quot; to add your first client!
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentlyAddedMembersList.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleOpenMember(m)}
                    className="p-3 bg-purple-50/30 hover:bg-purple-50 rounded-xl border border-purple-100/60 flex items-center justify-between text-xs cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{m.name}</p>
                        <p className="text-[11px] text-slate-500">{m.plan_name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-purple-700 font-medium">Valid till</span>
                      <p className="text-[11px] text-slate-600">{m.expiry_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onSuccess={() => refreshData()}
      />

      <NewPaymentModal
        isOpen={newPaymentOpen}
        preselectedMember={renewingMember}
        onClose={() => {
          setNewPaymentOpen(false);
          setRenewingMember(null);
        }}
        onSuccess={() => refreshData()}
      />

      <MemberDetailsModal
        isOpen={detailsModalOpen}
        member={selectedMember}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedMember(null);
        }}
        onEdit={(m) => {
          setSelectedMember(m);
          setEditModalOpen(true);
        }}
        onRenew={(m) => {
          setRenewingMember(m);
          setNewPaymentOpen(true);
        }}
        onDeleted={() => refreshData()}
      />

      <EditMemberModal
        isOpen={editModalOpen}
        member={selectedMember}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => refreshData()}
      />
    </div>
  );
}
