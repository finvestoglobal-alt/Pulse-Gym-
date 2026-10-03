'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Phone, Mail, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { MembershipPlan, PaymentMethod, Gender } from '@/types/gym';
import { useToast } from '@/components/ui/ToastContext';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberModal({ isOpen, onClose, onSuccess }: AddMemberModalProps) {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const todayStr = new Date().toISOString().split('T')[0];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(todayStr);
  const [expiryDate, setExpiryDate] = useState('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const [notes, setNotes] = useState('');
  const [isExpiryManuallyEdited, setIsExpiryManuallyEdited] = useState(false);

  // Helper functions
  const calculateExpiry = (start: string, durationDays: number): string => {
    try {
      const [y, m, d] = start.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      date.setDate(date.getDate() + durationDays);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const applyPlanCalculation = (plan: MembershipPlan, start: string) => {
    setAmountPaid(plan.price);
    const computed = calculateExpiry(start, plan.duration_days);
    setExpiryDate(computed);
    setIsExpiryManuallyEdited(false);
  };

  // Load plans on open
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    fetch('/api/gym/plans')
      .then((res) => res.json())
      .then((res) => {
        if (!isCancelled && res.success && res.data) {
          setPlans(res.data);
          if (res.data.length > 0 && !selectedPlanId) {
            const defaultPlan = res.data.find((p: MembershipPlan) => p.is_popular) || res.data[0];
            setSelectedPlanId(defaultPlan.id);
            setAmountPaid(defaultPlan.price);
            setExpiryDate(calculateExpiry(startDate, defaultPlan.duration_days));
            setIsExpiryManuallyEdited(false);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching plans:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingPlans(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedPlanId, startDate]);

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      applyPlanCalculation(plan, startDate);
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    setPaymentDate(newStart);
    if (!isExpiryManuallyEdited) {
      const plan = plans.find((p) => p.id === selectedPlanId);
      if (plan) {
        setExpiryDate(calculateExpiry(newStart, plan.duration_days));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide the member full name');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide phone number');
      return;
    }
    if (!selectedPlanId) {
      setError('Please select a membership plan');
      return;
    }
    if (!expiryDate) {
      setError('Expiry date is required');
      return;
    }

    const plan = plans.find((p) => p.id === selectedPlanId);
    const planName = plan ? plan.name : 'Gym Plan';

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/gym/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          gender,
          plan_id: selectedPlanId,
          plan_name: planName,
          start_date: startDate,
          expiry_date: expiryDate,
          amount_paid: Number(amountPaid) || 0,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to enroll member');
      }

      showToast(`Member "${name}" enrolled successfully! Initial payment recorded.`);
      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setIsExpiryManuallyEdited(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while saving member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-purple-100 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-50 flex items-center justify-between bg-purple-50/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enroll New Member</h2>
            <p className="text-xs text-slate-500">Record member registration, plan duration, and initial fee</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Personal Info */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Member Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* Membership Plan Selection */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Membership Package
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Plan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  disabled={isLoadingPlans}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price.toLocaleString()} ({p.duration_days} days)
                      {p.is_popular ? ' ★ Popular' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-700">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  {isExpiryManuallyEdited && (
                    <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                      Manual Override
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => {
                      setExpiryDate(e.target.value);
                      setIsExpiryManuallyEdited(true);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Auto-calculated from plan duration; staff may adjust if needed.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Amount Paid (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="text-slate-500 font-medium absolute left-3 top-2 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Settlement Details */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Payment & Settlement
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes / Fitness Goals <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Morning batch, needs locker #14, trainer referral"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl shadow-sm shadow-purple-200 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Registering...' : 'Enroll Member & Generate Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
