'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, CreditCard, User, AlertCircle, RefreshCw } from 'lucide-react';
import { Member, MembershipPlan, PaymentMethod } from '@/types/gym';
import { useToast } from '@/components/ui/ToastContext';

interface NewPaymentModalProps {
  isOpen: boolean;
  preselectedMember?: Member | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewPaymentModal({
  isOpen,
  preselectedMember,
  onClose,
  onSuccess,
}: NewPaymentModalProps) {
  const { showToast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [extendMembership, setExtendMembership] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    // Fetch members and plans
    Promise.all([
      fetch('/api/gym/members').then((r) => r.json()),
      fetch('/api/gym/plans').then((r) => r.json()),
    ]).then(([membersRes, plansRes]) => {
      if (isCancelled) return;
      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data);
      }
      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      }

      if (preselectedMember) {
        setSelectedMemberId(preselectedMember.id);
        setSelectedPlanId(preselectedMember.plan_id);
        const currentPlan = plansRes.data?.find((p: MembershipPlan) => p.id === preselectedMember.plan_id);
        if (currentPlan) {
          setAmount(currentPlan.price);
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, preselectedMember]);

  const handleMemberChange = (memberId: string) => {
    setSelectedMemberId(memberId);
    const m = members.find((x) => x.id === memberId);
    if (m) {
      setSelectedPlanId(m.plan_id);
      const plan = plans.find((p) => p.id === m.plan_id);
      if (plan) {
        setAmount(plan.price);
      }
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setAmount(plan.price);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedMemberId) {
      setError('Please select a member');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const member = members.find((m) => m.id === selectedMemberId);
    const plan = plans.find((p) => p.id === selectedPlanId);

    if (!member) {
      setError('Member not found');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gym/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: member.id,
          member_name: member.name,
          plan_id: selectedPlanId || member.plan_id,
          plan_name: plan ? plan.name : member.plan_name,
          amount: Number(amount),
          payment_date: paymentDate,
          payment_method: paymentMethod,
          notes: notes.trim() || (extendMembership ? `Membership renewal (${plan?.name || 'Plan'})` : undefined),
          extendMembershipDays: extendMembership && plan ? plan.duration_days : 0,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }

      showToast(`Payment of ₹${Number(amount).toLocaleString()} recorded. Invoice: ${data.data.invoice_number}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while recording payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-purple-100 shadow-2xl max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-purple-50 flex items-center justify-between bg-purple-50/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Record Payment / Renewal</h2>
            <p className="text-xs text-slate-500">Generate an invoice and update membership validity</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Member <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                required
                value={selectedMemberId}
                onChange={(e) => handleMemberChange(e.target.value)}
                disabled={Boolean(preselectedMember)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              >
                <option value="">-- Choose Member --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.phone}) · Exp: {m.expiry_date}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Membership Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            >
              <option value="">-- Select Plan --</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.price.toLocaleString()} for {p.duration_days} days)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Amount Paid (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="text-slate-500 font-medium absolute left-3 top-2 text-sm">₹</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              >
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                <option value="Cash">Cash at Counter</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="extendMembership"
              checked={extendMembership}
              onChange={(e) => setExtendMembership(e.target.checked)}
              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="extendMembership" className="text-xs text-purple-950 font-medium cursor-pointer">
              Extend member expiry date by plan duration
              <span className="block text-[11px] text-slate-500 font-normal">
                Automatically adjusts the member&apos;s expiry date and marks status as active.
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Annual renewal discount applied, Cheque #094"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl shadow-sm shadow-purple-200 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment & Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
