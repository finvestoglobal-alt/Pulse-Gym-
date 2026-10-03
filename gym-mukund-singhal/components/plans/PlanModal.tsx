'use client';

import React, { useState } from 'react';
import { X, Dumbbell, AlertCircle } from 'lucide-react';
import { MembershipPlan } from '@/types/gym';
import { useToast } from '@/components/ui/ToastContext';

interface PlanModalProps {
  isOpen: boolean;
  planToEdit?: MembershipPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

function PlanForm({
  planToEdit,
  onClose,
  onSuccess,
}: {
  planToEdit?: MembershipPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(planToEdit?.name || '');
  const [durationMonths, setDurationMonths] = useState<number>(planToEdit?.duration_months ?? 1);
  const [durationDays, setDurationDays] = useState<number>(planToEdit?.duration_days ?? 30);
  const [price, setPrice] = useState<number | ''>(planToEdit?.price ?? '');
  const [description, setDescription] = useState(planToEdit?.description || '');
  const [isPopular, setIsPopular] = useState(planToEdit?.is_popular ?? false);

  const handleMonthsChange = (m: number) => {
    setDurationMonths(m);
    setDurationDays(m * 30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Plan name is required');
      return;
    }
    if (!price || Number(price) <= 0) {
      setError('Valid price is required');
      return;
    }
    if (!durationDays || durationDays <= 0) {
      setError('Duration in days is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = planToEdit ? `/api/gym/plans/${planToEdit.id}` : '/api/gym/plans';
      const method = planToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          duration_months: Number(durationMonths),
          duration_days: Number(durationDays),
          price: Number(price),
          description: description.trim(),
          is_popular: Boolean(isPopular),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save membership plan');
      }

      showToast(planToEdit ? 'Membership plan updated!' : 'New membership plan created!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong while saving plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-purple-100 shadow-2xl max-w-lg w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-purple-50 flex items-center justify-between bg-purple-50/40">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {planToEdit ? 'Edit Membership Plan' : 'Create New Plan'}
            </h2>
            <p className="text-xs text-slate-500">Configure duration, pricing, and perks</p>
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
              Plan Title <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Dumbbell className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. 3 Months Regular"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Duration (Months)
              </label>
              <input
                type="number"
                min="0"
                value={durationMonths}
                onChange={(e) => handleMonthsChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Total Days <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Fee / Price (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="text-slate-500 font-medium absolute left-3 top-2 text-sm">₹</span>
              <input
                type="number"
                min="1"
                required
                placeholder="3800"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Description & Inclusions</label>
            <textarea
              rows={2}
              placeholder="e.g. Gym floor, cardio zone, free trainer consultation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center gap-2.5">
            <input
              type="checkbox"
              id="isPopular"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="isPopular" className="text-xs text-purple-950 font-medium cursor-pointer">
              Mark as Popular / Most Chosen Plan
            </label>
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
              {isSubmitting ? 'Saving...' : planToEdit ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PlanModal({ isOpen, planToEdit, onClose, onSuccess }: PlanModalProps) {
  if (!isOpen) return null;

  return (
    <PlanForm
      key={planToEdit?.id || 'new'}
      planToEdit={planToEdit}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
