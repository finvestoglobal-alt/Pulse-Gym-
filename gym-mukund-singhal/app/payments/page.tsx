'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  Download,
  CreditCard,
  Calendar,
  Trash2,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import { Payment } from '@/types/gym';
import { NewPaymentModal } from '@/components/payments/NewPaymentModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastContext';

export default function PaymentsPage() {
  const { showToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [newPaymentOpen, setNewPaymentOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    fetch(`/api/gym/payments?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success) {
          setPayments(data.data);
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
  }, [search, startDate, endDate, refreshTrigger]);

  const refreshPayments = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/gym/payments/${paymentToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete payment');

      showToast(`Payment invoice "${paymentToDelete.invoice_number}" deleted.`);
      setPaymentToDelete(null);
      refreshPayments();
    } catch (err: any) {
      showToast(err.message || 'Error deleting payment', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalFilteredAmount = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Payment Ledger</h2>
          <p className="text-xs text-slate-500">
            Track subscription fees, counter receipts, and digital invoice numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshPayments()}
            disabled={isLoading}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer"
            title="Refresh payment records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={() => setNewPaymentOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold shadow-sm shadow-purple-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
      <div className="bg-white rounded-2xl border border-purple-100/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-500 font-medium">Filtered Period Collections</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-900">
              ₹{totalFilteredAmount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">across {payments.length} transaction(s)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-purple-50/60 border border-purple-100 px-3.5 py-2 rounded-xl">
          <FileCheck className="w-4 h-4 text-purple-600" />
          <span>All transactions recorded with immutable invoice keys</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-purple-100/80 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search member, invoice #, method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
            {(startDate || endDate || search) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Database Error: {error}</span>
          </div>
          <button onClick={() => refreshPayments()} className="underline font-semibold hover:text-rose-950 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-purple-100/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading payments from Supabase...</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Receipt className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">No payment records found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || startDate || endDate
                ? 'Try broadening your search criteria or date filter.'
                : 'No payments have been logged yet. When members are enrolled or renewed, payment receipts appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-50/40 border-b border-purple-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Plan / Purpose</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                    {/* Invoice */}
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-medium text-purple-700 bg-purple-50/80 px-2 py-0.5 rounded text-[11px]">
                        {p.invoice_number}
                      </span>
                    </td>

                    {/* Member */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {p.member_name}
                    </td>

                    {/* Plan */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800">{p.plan_name}</span>
                      {p.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{p.notes}</p>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{p.amount.toLocaleString()}
                    </td>

                    {/* Method */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium">{p.payment_method}</span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {p.payment_date}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setPaymentToDelete(p)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Receipt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <NewPaymentModal
        isOpen={newPaymentOpen}
        onClose={() => setNewPaymentOpen(false)}
        onSuccess={() => refreshPayments()}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(paymentToDelete)}
        title="Delete Payment Record"
        message={`Are you sure you want to delete invoice ${paymentToDelete?.invoice_number} for ₹${paymentToDelete?.amount.toLocaleString()}? This will deduct the amount from lifetime collections.`}
        confirmLabel="Delete Invoice"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleDeletePayment}
        onCancel={() => setPaymentToDelete(null)}
      />
    </div>
  );
}
