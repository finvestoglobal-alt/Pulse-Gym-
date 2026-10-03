'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Phone,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreVertical,
} from 'lucide-react';
import { Member, MembershipPlan, MemberStatus } from '@/types/gym';
import { AddMemberModal } from '@/components/members/AddMemberModal';
import { EditMemberModal } from '@/components/members/EditMemberModal';
import { MemberDetailsModal } from '@/components/members/MemberDetailsModal';
import { NewPaymentModal } from '@/components/payments/NewPaymentModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastContext';

export default function MembersPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Modals & Dialogs
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (planFilter !== 'all') params.set('planId', planFilter);

    fetch(`/api/gym/members?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success) {
          setMembers(data.data);
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
  }, [search, statusFilter, planFilter, refreshTrigger]);

  useEffect(() => {
    fetch('/api/gym/plans')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setPlans(res.data);
        }
      });
  }, []);

  const refreshMembers = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gym/members/${memberToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete member');

      showToast(`Member "${memberToDelete.name}" removed successfully.`);
      setMemberToDelete(null);
      refreshMembers();
    } catch (err: any) {
      showToast(err.message || 'Error deleting member', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusDisplay = (status: MemberStatus) => {
    if (status === 'active') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    }
    if (status === 'expiring_soon') {
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Expiring Soon
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-rose-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        Expired
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Enrolment CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Member Directory</h2>
          <p className="text-xs text-slate-500">
            Search, filter, inspect profiles, and renew active gym subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshMembers()}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => setAddMemberOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-sm shadow-purple-200 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-purple-100/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by member name, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          {/* Interactive segmented controls for Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            {(
              [
                { label: 'All Members', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Expiring Soon', value: 'expiring_soon' },
                { label: 'Expired', value: 'expired' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.value
                    ? 'bg-white text-purple-950 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Plan Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white text-slate-700"
            >
              <option value="all">All Plans</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Database Error: {error}</span>
          </div>
          <button onClick={() => refreshMembers()} className="underline font-semibold hover:text-rose-950 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Members Table */}
      <div className="bg-white rounded-2xl border border-purple-100/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading members from Supabase...</div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Users className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">No members found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter !== 'all' || planFilter !== 'all'
                ? 'Try adjusting your search query or filters.'
                : 'Your member registry is currently empty. Click "Enroll New Member" to add your first gym client.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/40 border-b border-purple-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-4">Plan & Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Fee Paid</th>
                  <th className="py-3 px-4">Enrolled On</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-purple-50/20 transition-colors group"
                  >
                    {/* Member Name & Phone */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 text-[#7C3AED] font-bold text-xs flex items-center justify-center shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 hover:text-purple-600 cursor-pointer" onClick={() => { setSelectedMember(member); setDetailsOpen(true); }}>
                              {member.name}
                            </span>
                            {member.gender && (
                              <span className="text-[10px] text-slate-400">· {member.gender}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{member.phone}</span>
                            {member.email && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="truncate max-w-[140px]">{member.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Plan & Expiry */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{member.plan_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Expires: <span className="font-medium text-slate-700">{member.expiry_date}</span>
                      </div>
                    </td>

                    {/* Status Dot */}
                    <td className="py-3.5 px-4">
                      {getStatusDisplay(member.status)}
                    </td>

                    {/* Amount Paid */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        ₹{member.amount_paid.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{member.payment_method}</div>
                    </td>

                    {/* Start Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {member.start_date}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setDetailsOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setRenewOpen(true);
                          }}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                          title="Renew Membership"
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setEditOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setMemberToDelete(member)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddMemberModal
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        onSuccess={() => refreshMembers()}
      />

      <EditMemberModal
        isOpen={editOpen}
        member={selectedMember}
        onClose={() => {
          setEditOpen(false);
          setSelectedMember(null);
        }}
        onSuccess={() => refreshMembers()}
      />

      <MemberDetailsModal
        isOpen={detailsOpen}
        member={selectedMember}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedMember(null);
        }}
        onEdit={(m) => {
          setSelectedMember(m);
          setEditOpen(true);
        }}
        onRenew={(m) => {
          setSelectedMember(m);
          setRenewOpen(true);
        }}
        onDeleted={() => refreshMembers()}
      />

      <NewPaymentModal
        isOpen={renewOpen}
        preselectedMember={selectedMember}
        onClose={() => {
          setRenewOpen(false);
          setSelectedMember(null);
        }}
        onSuccess={() => refreshMembers()}
      />

      <ConfirmDialog
        isOpen={Boolean(memberToDelete)}
        title="Delete Member"
        message={`Are you sure you want to permanently delete "${memberToDelete?.name}"? All associated payment history for this member will also be removed.`}
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeleteMember}
        onCancel={() => setMemberToDelete(null)}
      />
    </div>
  );
}
