'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dumbbell,
  Plus,
  Edit2,
  Trash2,
  Check,
  Star,
  RefreshCw,
  AlertCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { MembershipPlan } from '@/types/gym';
import { PlanModal } from '@/components/plans/PlanModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastContext';

export default function PlansPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    fetch('/api/gym/plans')
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success) {
          setPlans(data.data);
        }
      })
      .catch((err: any) => {
        if (!isCancelled) setError(err.message || 'Error connecting to database');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  const refreshPlans = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gym/plans/${planToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete plan');

      showToast(`Membership plan "${planToDelete.name}" deleted.`);
      setPlanToDelete(null);
      refreshPlans();
    } catch (err: any) {
      showToast(err.message || 'Error deleting plan', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Membership Plans</h2>
          <p className="text-xs text-slate-500">
            Configure pricing tiers, durations, and member entitlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshPlans()}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer"
            title="Refresh plans"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingPlan(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-sm shadow-purple-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Database Error: {error}</span>
          </div>
          <button onClick={() => refreshPlans()} className="underline font-semibold hover:text-rose-950 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Plans Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading plans from Supabase...</div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100/80 p-12 text-center">
          <Dumbbell className="w-12 h-12 text-purple-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800">No Membership Plans Found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
            Add your pricing tiers so you can enroll new gym members.
          </p>
          <button
            onClick={() => {
              setEditingPlan(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-semibold"
          >
            Add Initial Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all duration-150 relative ${
                plan.is_popular
                  ? 'border-purple-300 ring-2 ring-purple-100 shadow-md'
                  : 'border-purple-100/80 shadow-xs hover:border-purple-200'
              }`}
            >
              <div>
                {/* Popular Marker */}
                <div className="flex items-center justify-between mb-3 min-h-[22px]">
                  {plan.is_popular ? (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                      <Star className="w-3 h-3 fill-purple-600 text-purple-600" />
                      <span>Most Popular</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">Standard Plan</span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPlanToDelete(plan)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight">{plan.name}</h3>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{plan.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-normal">
                    / {plan.duration_months > 0 ? `${plan.duration_months} mo` : `${plan.duration_days} d`}
                  </span>
                </div>

                <div className="mt-2 text-xs text-purple-700 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  <span>{plan.duration_days} Days Access</span>
                </div>

                <p className="mt-3 text-xs text-slate-600 leading-relaxed min-h-[44px]">
                  {plan.description || 'Full gym facility & equipment access'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setModalOpen(true);
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors cursor-pointer"
                >
                  Configure Tier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Create/Edit Modal */}
      <PlanModal
        isOpen={modalOpen}
        planToEdit={editingPlan}
        onClose={() => {
          setModalOpen(false);
          setEditingPlan(null);
        }}
        onSuccess={() => refreshPlans()}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(planToDelete)}
        title="Delete Membership Plan"
        message={`Are you sure you want to delete "${planToDelete?.name}"? Existing members enrolled under this plan will remain valid.`}
        confirmLabel="Delete Plan"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeletePlan}
        onCancel={() => setPlanToDelete(null)}
      />
    </div>
  );
}
