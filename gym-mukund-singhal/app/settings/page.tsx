'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Database,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Copy,
  Check,
  UserPlus,
  Trash2,
  Users,
  Code,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { GymSettings, StaffUser } from '@/types/gym';
import { useToast } from '@/components/ui/ToastContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<GymSettings | null>(null);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [gymName, setGymName] = useState('');
  const [tagline, setTagline] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [thresholdDays, setThresholdDays] = useState(7);

  // Staff add modal state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Admin' | 'Manager' | 'Trainer'>('Manager');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffUser | null>(null);

  // SQL Copy state
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    Promise.all([
      fetch('/api/gym/settings').then((r) => r.json()),
      fetch('/api/gym/staff').then((r) => r.json()),
      fetch('/api/gym/status').then((r) => r.json()),
    ])
      .then(([settingsRes, staffRes, statusRes]) => {
        if (isCancelled) return;
        if (settingsRes.success && settingsRes.data) {
          setSettings(settingsRes.data);
          setGymName(settingsRes.data.gym_name);
          setTagline(settingsRes.data.tagline);
          setCurrency(settingsRes.data.currency || '₹');
          setPhone(settingsRes.data.phone);
          setEmail(settingsRes.data.email);
          setAddress(settingsRes.data.address);
          setThresholdDays(settingsRes.data.expiring_threshold_days || 7);
        }

        if (staffRes.success && staffRes.data) {
          setStaffUsers(staffRes.data);
        }

        if (statusRes.success && statusRes.data) {
          setDbStatus(statusRes.data);
        }
      })
      .catch((err: any) => {
        if (!isCancelled) setError(err.message || 'Error loading settings');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [refreshTrigger]);

  const refreshSettings = () => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/gym/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gym_name: gymName.trim(),
          tagline: tagline.trim(),
          currency: currency.trim() || '₹',
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          expiring_threshold_days: Number(thresholdDays),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update settings');

      showToast('Club settings saved and updated!');
      setSettings(data.data);
    } catch (err: any) {
      showToast(err.message || 'Error saving settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) return;

    setIsAddingStaff(true);
    try {
      const res = await fetch('/api/gym/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaffName.trim(),
          email: newStaffEmail.trim(),
          role: newStaffRole,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to add staff');

      showToast(`Staff member "${newStaffName}" added!`);
      setNewStaffName('');
      setNewStaffEmail('');
      refreshSettings();
    } catch (err: any) {
      showToast(err.message || 'Error adding staff', 'error');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const res = await fetch(`/api/gym/staff/${staffToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to remove staff');

      showToast(`Staff profile removed.`);
      setStaffToDelete(null);
      refreshSettings();
    } catch (err: any) {
      showToast(err.message || 'Error removing staff', 'error');
    }
  };

  const sqlMigrationCode = `-- PulseGym Supabase Schema
CREATE TABLE IF NOT EXISTS gym_settings (
  id TEXT PRIMARY KEY,
  gym_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT '₹',
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  expiring_threshold_days INTEGER NOT NULL DEFAULT 7,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS membership_plans (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL REFERENCES gym_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  duration_days INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10, 2) NOT NULL,
  description TEXT,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL REFERENCES gym_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  plan_id TEXT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  plan_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL REFERENCES gym_settings(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  plan_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL REFERENCES gym_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial Data for Demo Gym
INSERT INTO gym_settings (id, gym_name, tagline, currency, phone, email, address, expiring_threshold_days)
VALUES ('pulse-fitness-club', 'Pulse Fitness Club', 'Strength • Health • Community', '₹', '+91 98765 43210', 'hello@pulsefitnessclub.in', 'Plot 42, Sector 18, Noida, Uttar Pradesh', 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO membership_plans (id, gym_id, name, duration_months, duration_days, price, description, is_popular)
VALUES 
  ('plan-1m', 'pulse-fitness-club', '1 Month', 1, 30, 1500, 'Full gym floor access & standard locker room facility', FALSE),
  ('plan-3m', 'pulse-fitness-club', '3 Months', 3, 90, 3800, 'Gym floor, cardio zone, and 1 personal trainer orientation session', TRUE),
  ('plan-6m', 'pulse-fitness-club', '6 Months', 6, 180, 7000, 'Complete access, complimentary sauna, steam bath & towel service', FALSE),
  ('plan-12m', 'pulse-fitness-club', 'Yearly', 12, 365, 12500, 'All-inclusive VIP membership with guest privileges and diet counseling', FALSE)
ON CONFLICT (id) DO NOTHING;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlMigrationCode);
    setCopiedSql(true);
    showToast('SQL migration copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Club Settings</h2>
          <p className="text-xs text-slate-500">
            Configure gym brand details, expiry alert thresholds, staff roles, and database status.
          </p>
        </div>

        <button
          onClick={() => refreshSettings()}
          disabled={isLoading}
          className="p-2 self-start rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer"
          title="Refresh connection status"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </div>

      {/* Supabase Connection & Health Status Card */}
      <div className="bg-white rounded-2xl border border-purple-100/80 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">Supabase PostgreSQL Connection</h3>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    dbStatus?.connected
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}
                >
                  {dbStatus?.connected ? 'Live PostgreSQL Connected' : 'Persistent Storage Active'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Project URL: <span className="font-mono text-purple-700">{dbStatus?.url || 'Checking...'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSqlViewer(!showSqlViewer)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl border border-purple-100 transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>{showSqlViewer ? 'Hide SQL Script' : 'View SQL Migration'}</span>
            </button>
            <button
              onClick={copySql}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-3">{dbStatus?.message}</p>

        {/* Verified Tables Grid */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Supabase Schema Tables (pulse-fitness-club)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {['gym_settings', 'membership_plans', 'members', 'payments', 'staff_users'].map((tbl) => (
              <div
                key={tbl}
                className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="font-mono text-slate-700 truncate">{tbl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expandable SQL Viewer */}
        {showSqlViewer && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                SQL Migration Code (Run in Supabase SQL Editor if provisioning fresh)
              </span>
              <button
                onClick={copySql}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                Copy all SQL
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
              {sqlMigrationCode}
            </pre>
          </div>
        )}
      </div>

      {/* Gym Profile Form */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-purple-100/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-slate-900 text-sm">Gym Profile & Configuration</h3>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-semibold shadow-sm shadow-purple-200 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Gym Name</label>
            <input
              type="text"
              required
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Motto / Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">Physical Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              required
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Expiring Soon Threshold (Days)
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                min="1"
                max="30"
                required
                value={thresholdDays}
                onChange={(e) => setThresholdDays(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-semibold"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Members expiring within this many days are highlighted on the dashboard.
            </span>
          </div>
        </div>
      </form>

      {/* Staff Team Section */}
      <div className="bg-white rounded-2xl border border-purple-100/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Authorized Staff & Trainers</h3>
              <p className="text-[11px] text-slate-500">Personnel authorized to manage members and payments</p>
            </div>
          </div>
        </div>

        {/* Existing staff list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {staffUsers.map((staff) => (
            <div
              key={staff.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-[#7C3AED] font-bold text-xs flex items-center justify-center">
                  {staff.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{staff.name}</p>
                  <p className="text-[11px] text-slate-500">{staff.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  {staff.role}
                </span>
                {staffUsers.length > 1 && (
                  <button
                    onClick={() => setStaffToDelete(staff)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add new staff inline */}
        <form onSubmit={handleAddStaff} className="pt-3 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-700 block mb-2">Add Staff Member</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Full Name"
              value={newStaffName}
              onChange={(e) => setNewStaffName(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
            <input
              type="email"
              required
              placeholder="Email address"
              value={newStaffEmail}
              onChange={(e) => setNewStaffEmail(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
            <div className="flex items-center gap-2">
              <select
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
              >
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Trainer">Trainer</option>
              </select>
              <button
                type="submit"
                disabled={isAddingStaff}
                className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 font-semibold text-xs rounded-xl shrink-0 cursor-pointer"
              >
                {isAddingStaff ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Staff Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(staffToDelete)}
        title="Remove Staff User"
        message={`Are you sure you want to remove ${staffToDelete?.name} from staff directory?`}
        confirmLabel="Remove"
        isDestructive
        onConfirm={handleDeleteStaff}
        onCancel={() => setStaffToDelete(null)}
      />
    </div>
  );
}
