'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Member, Payment } from '@/types/gym';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastContext';

interface MemberDetailsModalProps {
  isOpen: boolean;
  member: Member | null;
  onClose: () => void;
  onEdit: (member: Member) => void;
  onRenew: (member: Member) => void;
  onDeleted: () => void;
}

export function MemberDetailsModal({
  isOpen,
  member,
  onClose,
  onEdit,
  onRenew,
  onDeleted,
}: MemberDetailsModalProps) {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen || !member) return;
    let isCancelled = false;

    fetch(`/api/gym/payments?memberId=${member.id}`)
      .then((res) => res.json())
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          setPayments(res.data);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingPayments(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gym/members/${member.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete member');

      showToast(`Member "${member.name}" removed from database.`);
      setShowDeleteConfirm(false);
      onDeleted();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error deleting member', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = () => {
    if (member.status === 'active') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Membership</span>
        </div>
      );
    }
    if (member.status === 'expiring_soon') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Expiring Soon</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        <span>Membership Expired</span>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl border border-purple-100 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-5 border-b border-purple-50 bg-gradient-to-r from-purple-50/60 to-white flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 text-[#7C3AED] font-bold text-lg flex items-center justify-center shadow-xs">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{member.name}</h2>
                  {member.gender && (
                    <span className="text-xs text-slate-500">· {member.gender}</span>
                  )}
                </div>
                <div className="mt-0.5">{getStatusBadge()}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Quick Actions Row */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                    onRenew(member);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Renew / Collect Payment</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(member);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>

            {/* Member Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                <span className="text-[11px] text-slate-500 block mb-1">Contact Information</span>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                    <span>{member.phone}</span>
                  </div>
                  {member.email ? (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-purple-600" />
                      <span>{member.email}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No email registered</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
                <span className="text-[11px] text-slate-500 block mb-1">Membership Plan</span>
                <p className="text-xs font-semibold text-slate-900">{member.plan_name}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
                  <span>Start: {member.start_date}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-purple-800">Expires: {member.expiry_date}</span>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {member.notes && (
              <div className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-100/60 text-xs text-slate-700">
                <span className="text-[11px] font-semibold text-purple-900 block mb-1">Staff Notes</span>
                <p className="leading-relaxed">{member.notes}</p>
              </div>
            )}

            {/* Payment History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-purple-600" />
                  <span>Payment Records</span>
                </h3>
                <span className="text-[11px] text-slate-500">
                  Total Paid: ₹{member.amount_paid.toLocaleString()}
                </span>
              </div>

              {isLoadingPayments ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading payment history...</div>
              ) : payments.length === 0 ? (
                <div className="py-4 px-3 bg-slate-50 rounded-xl border border-slate-200/60 text-center text-xs text-slate-500">
                  No payment records found for this member.
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {payments.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between bg-white text-xs hover:bg-slate-50/60 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">₹{p.amount.toLocaleString()}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">{p.payment_method}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-[11px] font-mono text-purple-600">{p.invoice_number}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Paid on {p.payment_date} {p.notes ? `(${p.notes})` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          Settled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Member Profile"
        message={`Are you sure you want to permanently delete "${member.name}"? This will also remove associated payment records from Supabase.`}
        confirmLabel="Delete Member"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
