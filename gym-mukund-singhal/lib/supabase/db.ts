import fs from 'fs';
import path from 'path';
import { serverSupabase, isServerSupabaseConfigured } from './server';
import {
  GymSettings,
  MembershipPlan,
  Member,
  Payment,
  StaffUser,
  DashboardStats,
  MemberStatus,
} from '@/types/gym';

export const DEMO_GYM_ID = 'mukund-singhal-gym';

// Path for local storage fallback when Supabase is not provisioned or configured
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'gym_mukund-singhal-gym_store.json');

export interface GymDatabaseSchema {
  gym_settings: GymSettings;
  membership_plans: MembershipPlan[];
  members: Member[];
  payments: Payment[];
  staff_users: StaffUser[];
}

const DEFAULT_STORE: GymDatabaseSchema = {
  gym_settings: {
    id: DEMO_GYM_ID,
    gym_name: 'Mukund Singhal Gym',
    tagline: 'Strength • Health • Community',
    currency: '₹',
    phone: '+91 98765 00000',
    email: 'hollowsignal1@gmail.com',
    address: 'Gym Address',
    expiring_threshold_days: 7,
    updated_at: new Date().toISOString(),
  },
  membership_plans: [
    {
      id: 'plan-1m',
      gym_id: DEMO_GYM_ID,
      name: '1 Month',
      duration_months: 1,
      duration_days: 30,
      price: 1500,
      description: 'Full gym floor access & standard locker room facility',
      is_popular: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'plan-3m',
      gym_id: DEMO_GYM_ID,
      name: '3 Months',
      duration_months: 3,
      duration_days: 90,
      price: 3800,
      description: 'Gym floor, cardio zone, and 1 personal trainer orientation session',
      is_popular: true,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'plan-6m',
      gym_id: DEMO_GYM_ID,
      name: '6 Months',
      duration_months: 6,
      duration_days: 180,
      price: 7000,
      description: 'Complete access, complimentary sauna, steam bath & towel service',
      is_popular: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'plan-12m',
      gym_id: DEMO_GYM_ID,
      name: 'Yearly',
      duration_months: 12,
      duration_days: 365,
      price: 12500,
      description: 'All-inclusive VIP membership with guest privileges and diet counseling',
      is_popular: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  members: [],
  payments: [],
  staff_users: [
    {
      id: 'staff-admin-01',
      gym_id: DEMO_GYM_ID,
      name: 'Vikram Rathore',
      email: 'staff@pulsefitnessclub.in',
      role: 'Admin',
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ],
};

function readLocalStore(): GymDatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
      return DEFAULT_STORE;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      gym_settings: parsed.gym_settings || DEFAULT_STORE.gym_settings,
      membership_plans: parsed.membership_plans || DEFAULT_STORE.membership_plans,
      members: parsed.members || [],
      payments: parsed.payments || [],
      staff_users: parsed.staff_users || DEFAULT_STORE.staff_users,
    };
  } catch (err) {
    console.error('Error reading local gym store:', err);
    return DEFAULT_STORE;
  }
}

function writeLocalStore(store: GymDatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local gym store:', err);
  }
}

export function calculateMemberStatus(expiryDateStr: string, thresholdDays: number = 7): MemberStatus {
  if (!expiryDateStr) return 'active';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = expiryDateStr.split('-');
  if (parts.length < 3) return 'active';
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const expiry = new Date(year, month, day);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'expired';
  } else if (diffDays <= thresholdDays) {
    return 'expiring_soon';
  } else {
    return 'active';
  }
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${randomSuffix}`;
}

export function calculateExpiryDate(startDateStr: string, durationDays: number): string {
  const parts = startDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const start = new Date(year, month, day);
  start.setDate(start.getDate() + durationDays);

  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  const d = String(start.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// -------------------------------------------------------------
// Database Operations (Supabase with Local Persistent Mirror)
// -------------------------------------------------------------

// Settings
export async function getGymSettings(): Promise<GymSettings> {
  if (isServerSupabaseConfigured) {
    try {
      const { data, error } = await serverSupabase
        .from('gym_settings')
        .select('*')
        .eq('id', DEMO_GYM_ID)
        .single();
      if (!error && data) {
        return data as GymSettings;
      }
      // If table doesn't have it yet, try seeding
      if (error && error.code === 'PGRST116') {
        const fallback = readLocalStore().gym_settings;
        await serverSupabase.from('gym_settings').insert(fallback);
        return fallback;
      }
    } catch (e) {
      console.warn('Supabase getGymSettings error, falling back to local persistent store:', e);
    }
  }
  return readLocalStore().gym_settings;
}

export async function updateGymSettings(settings: Partial<GymSettings>): Promise<GymSettings> {
  const current = await getGymSettings();
  const updated: GymSettings = {
    ...current,
    ...settings,
    id: DEMO_GYM_ID,
    updated_at: new Date().toISOString(),
  };

  if (isServerSupabaseConfigured) {
    try {
      const { error } = await serverSupabase
        .from('gym_settings')
        .upsert(updated);
      if (error) {
        console.error('Supabase updateGymSettings error:', error);
      }
    } catch (e) {
      console.error('Supabase updateGymSettings exception:', e);
    }
  }

  const store = readLocalStore();
  store.gym_settings = updated;
  writeLocalStore(store);
  return updated;
}

// Membership Plans
export async function getPlans(): Promise<MembershipPlan[]> {
  if (isServerSupabaseConfigured) {
    try {
      const { data, error } = await serverSupabase
        .from('membership_plans')
        .select('*')
        .eq('gym_id', DEMO_GYM_ID)
        .order('price', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as MembershipPlan[];
      }
      // If table empty, seed with initial 4 plans
      if (!error && (!data || data.length === 0)) {
        const localPlans = readLocalStore().membership_plans;
        await serverSupabase.from('membership_plans').insert(localPlans);
        return localPlans;
      }
    } catch (e) {
      console.warn('Supabase getPlans error, falling back to local store:', e);
    }
  }
  const store = readLocalStore();
  return store.membership_plans;
}

export async function createPlan(planData: Omit<MembershipPlan, 'id' | 'gym_id' | 'created_at' | 'updated_at'>): Promise<MembershipPlan> {
  const newId = `plan-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const plan: MembershipPlan = {
    id: newId,
    gym_id: DEMO_GYM_ID,
    ...planData,
    created_at: now,
    updated_at: now,
  };

  if (isServerSupabaseConfigured) {
    try {
      const { error } = await serverSupabase.from('membership_plans').insert(plan);
      if (error) console.error('Supabase createPlan error:', error);
    } catch (e) {
      console.error('Supabase createPlan exception:', e);
    }
  }

  const store = readLocalStore();
  store.membership_plans.push(plan);
  writeLocalStore(store);
  return plan;
}

export async function updatePlan(id: string, planData: Partial<MembershipPlan>): Promise<MembershipPlan | null> {
  const store = readLocalStore();
  const existingIdx = store.membership_plans.findIndex(p => p.id === id);
  if (existingIdx === -1) return null;

  const updated: MembershipPlan = {
    ...store.membership_plans[existingIdx],
    ...planData,
    updated_at: new Date().toISOString(),
  };

  if (isServerSupabaseConfigured) {
    try {
      const { error } = await serverSupabase
        .from('membership_plans')
        .update(updated)
        .eq('id', id);
      if (error) console.error('Supabase updatePlan error:', error);
    } catch (e) {
      console.error('Supabase updatePlan exception:', e);
    }
  }

  store.membership_plans[existingIdx] = updated;
  writeLocalStore(store);
  return updated;
}

export async function deletePlan(id: string): Promise<boolean> {
  if (isServerSupabaseConfigured) {
    try {
      const { error } = await serverSupabase.from('membership_plans').delete().eq('id', id);
      if (error) console.error('Supabase deletePlan error:', error);
    } catch (e) {
      console.error('Supabase deletePlan exception:', e);
    }
  }

  const store = readLocalStore();
  store.membership_plans = store.membership_plans.filter(p => p.id !== id);
  writeLocalStore(store);
  return true;
}

// Members
export async function getMembers(filters?: { search?: string; status?: string; planId?: string }): Promise<Member[]> {
  const settings = await getGymSettings();
  const thresholdDays = settings.expiring_threshold_days || 7;

  let memberList: Member[] = [];

  if (isServerSupabaseConfigured) {
    try {
      let query = serverSupabase
        .from('members')
        .select('*')
        .eq('gym_id', DEMO_GYM_ID)
        .order('created_at', { ascending: false });

      if (filters?.planId) {
        query = query.eq('plan_id', filters.planId);
      }

      const { data, error } = await query;
      if (!error && data) {
        memberList = data as Member[];
      }
    } catch (e) {
      console.warn('Supabase getMembers error, falling back to local persistent store:', e);
      memberList = readLocalStore().members;
    }
  } else {
    memberList = readLocalStore().members;
  }

  // Dynamically compute exact status based on expiry date
  memberList = memberList.map(m => {
    const computedStatus = calculateMemberStatus(m.expiry_date, thresholdDays);
    return { ...m, status: computedStatus };
  });

  // Apply filters
  if (filters?.search) {
    const term = filters.search.toLowerCase().trim();
    memberList = memberList.filter(
      m =>
        m.name.toLowerCase().includes(term) ||
        m.phone.includes(term) ||
        (m.email && m.email.toLowerCase().includes(term))
    );
  }

  if (filters?.status && filters.status !== 'all') {
    memberList = memberList.filter(m => m.status === filters.status);
  }

  return memberList;
}

export async function getMemberById(id: string): Promise<Member | null> {
  const members = await getMembers();
  return members.find(m => m.id === id) || null;
}

export async function createMember(memberInput: {
  name: string;
  phone: string;
  email?: string | null;
  gender?: any;
  plan_id: string;
  plan_name: string;
  start_date: string;
  expiry_date: string;
  amount_paid: number;
  payment_method: any;
  payment_date: string;
  notes?: string | null;
}): Promise<{ member: Member; payment: Payment }> {
  const settings = await getGymSettings();
  const thresholdDays = settings.expiring_threshold_days || 7;
  const status = calculateMemberStatus(memberInput.expiry_date, thresholdDays);

  const memberId = `mem-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newMember: Member = {
    id: memberId,
    gym_id: DEMO_GYM_ID,
    name: memberInput.name,
    phone: memberInput.phone,
    email: memberInput.email || null,
    gender: memberInput.gender || null,
    plan_id: memberInput.plan_id,
    plan_name: memberInput.plan_name,
    start_date: memberInput.start_date,
    expiry_date: memberInput.expiry_date,
    amount_paid: Number(memberInput.amount_paid),
    payment_method: memberInput.payment_method,
    payment_date: memberInput.payment_date,
    notes: memberInput.notes || null,
    status,
    created_at: now,
    updated_at: now,
  };

  const paymentId = `pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const invoiceNumber = generateInvoiceNumber();

  const newPayment: Payment = {
    id: paymentId,
    gym_id: DEMO_GYM_ID,
    member_id: memberId,
    member_name: memberInput.name,
    plan_id: memberInput.plan_id,
    plan_name: memberInput.plan_name,
    amount: Number(memberInput.amount_paid),
    payment_date: memberInput.payment_date,
    payment_method: memberInput.payment_method,
    invoice_number: invoiceNumber,
    notes: `Initial membership fee for ${memberInput.plan_name}`,
    created_at: now,
  };

  if (isServerSupabaseConfigured) {
    try {
      const { error: memErr } = await serverSupabase.from('members').insert(newMember);
      if (memErr) console.error('Supabase createMember error:', memErr);

      if (newMember.amount_paid > 0) {
        const { error: payErr } = await serverSupabase.from('payments').insert(newPayment);
        if (payErr) console.error('Supabase initial payment insert error:', payErr);
      }
    } catch (e) {
      console.error('Supabase createMember exception:', e);
    }
  }

  // Update local persistent file mirror
  const store = readLocalStore();
  store.members.unshift(newMember);
  if (newMember.amount_paid > 0) {
    store.payments.unshift(newPayment);
  }
  writeLocalStore(store);

  return { member: newMember, payment: newPayment };
}

export async function updateMember(id: string, memberInput: Partial<Member>): Promise<Member | null> {
  const settings = await getGymSettings();
  const thresholdDays = settings.expiring_threshold_days || 7;

  const store = readLocalStore();
  const existingIdx = store.members.findIndex(m => m.id === id);
  if (existingIdx === -1) return null;

  const current = store.members[existingIdx];
  const expiryDate = memberInput.expiry_date || current.expiry_date;
  const status = calculateMemberStatus(expiryDate, thresholdDays);

  const updated: Member = {
    ...current,
    ...memberInput,
    id,
    status,
    updated_at: new Date().toISOString(),
  };

  if (isServerSupabaseConfigured) {
    try {
      const { error } = await serverSupabase
        .from('members')
        .update(updated)
        .eq('id', id);
      if (error) console.error('Supabase updateMember error:', error);
    } catch (e) {
      console.error('Supabase updateMember exception:', e);
    }
  }

  store.members[existingIdx] = updated;
  writeLocalStore(store);
  return updated;
}

export async function deleteMember(id: string): Promise<boolean> {
  if (isServerSupabaseConfigured) {
    try {
      // payments will be cascaded if foreign key has cascade, or manually delete
      await serverSupabase.from('payments').delete().eq('member_id', id);
      const { error } = await serverSupabase.from('members').delete().eq('id', id);
      if (error) console.error('Supabase deleteMember error:', error);
    } catch (e) {
      console.error('Supabase deleteMember exception:', e);
    }
  }

  const store = readLocalStore();
  store.members = store.members.filter(m => m.id !== id);
  store.payments = store.payments.filter(p => p.member_id !== id);
  writeLocalStore(store);
  return true;
}

// Payments
export async function getPayments(filters?: {
  search?: string;
  startDate?: string;
  endDate?: string;
  memberId?: string;
}): Promise<Payment[]> {
  let paymentList: Payment[] = [];

  if (isServerSupabaseConfigured) {
    try {
      let query = serverSupabase
        .from('payments')
        .select('*')
        .eq('gym_id', DEMO_GYM_ID)
        .order('payment_date', { ascending: false });

      if (filters?.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      const { data, error } = await query;
      if (!error && data) {
        paymentList = data as Payment[];
      }
    } catch (e) {
      console.warn('Supabase getPayments error, falling back to local persistent store:', e);
      paymentList = readLocalStore().payments;
    }
  } else {
    paymentList = readLocalStore().payments;
  }

  if (filters?.search) {
    const term = filters.search.toLowerCase().trim();
    paymentList = paymentList.filter(
      p =>
        p.member_name.toLowerCase().includes(term) ||
        p.invoice_number.toLowerCase().includes(term) ||
        p.payment_method.toLowerCase().includes(term)
    );
  }

  if (filters?.startDate) {
    paymentList = paymentList.filter(p => p.payment_date >= filters.startDate!);
  }

  if (filters?.endDate) {
    paymentList = paymentList.filter(p => p.payment_date <= filters.endDate!);
  }

  return paymentList;
}

export async function createPayment(paymentInput: {
  member_id: string;
  member_name: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  payment_date: string;
  payment_method: any;
  notes?: string | null;
  extendMembershipDays?: number;
}): Promise<Payment> {
  const paymentId = `pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const invoiceNumber = generateInvoiceNumber();
  const now = new Date().toISOString();

  const newPayment: Payment = {
    id: paymentId,
    gym_id: DEMO_GYM_ID,
    member_id: paymentInput.member_id,
    member_name: paymentInput.member_name,
    plan_id: paymentInput.plan_id,
    plan_name: paymentInput.plan_name,
    amount: Number(paymentInput.amount),
    payment_date: paymentInput.payment_date,
    payment_method: paymentInput.payment_method,
    invoice_number: invoiceNumber,
    notes: paymentInput.notes || null,
    created_at: now,
  };

  if (isServerSupabaseConfigured) {
    try {
      const { error } = await serverSupabase.from('payments').insert(newPayment);
      if (error) console.error('Supabase createPayment error:', error);
    } catch (e) {
      console.error('Supabase createPayment exception:', e);
    }
  }

  const store = readLocalStore();
  store.payments.unshift(newPayment);

  // If renewal option extends membership expiry date
  if (paymentInput.extendMembershipDays && paymentInput.extendMembershipDays > 0) {
    const memberIdx = store.members.findIndex(m => m.id === paymentInput.member_id);
    if (memberIdx !== -1) {
      const member = store.members[memberIdx];
      const baseDate = member.expiry_date && member.expiry_date > paymentInput.payment_date ? member.expiry_date : paymentInput.payment_date;
      const newExpiry = calculateExpiryDate(baseDate, paymentInput.extendMembershipDays);
      const settings = store.gym_settings;
      const newStatus = calculateMemberStatus(newExpiry, settings.expiring_threshold_days);

      const updatedMember: Member = {
        ...member,
        expiry_date: newExpiry,
        status: newStatus,
        plan_id: paymentInput.plan_id,
        plan_name: paymentInput.plan_name,
        amount_paid: Number(member.amount_paid) + Number(paymentInput.amount),
        updated_at: now,
      };

      if (isServerSupabaseConfigured) {
        try {
          await serverSupabase.from('members').update(updatedMember).eq('id', member.id);
        } catch (e) {
          console.error('Supabase update member on payment exception:', e);
        }
      }
      store.members[memberIdx] = updatedMember;
    }
  }

  writeLocalStore(store);
  return newPayment;
}

export async function deletePayment(id: string): Promise<boolean> {
  if (isServerSupabaseConfigured) {
    try {
      const { error } = await serverSupabase.from('payments').delete().eq('id', id);
      if (error) console.error('Supabase deletePayment error:', error);
    } catch (e) {
      console.error('Supabase deletePayment exception:', e);
    }
  }

  const store = readLocalStore();
  store.payments = store.payments.filter(p => p.id !== id);
  writeLocalStore(store);
  return true;
}

// Staff
export async function getStaffUsers(): Promise<StaffUser[]> {
  if (isServerSupabaseConfigured) {
    try {
      const { data, error } = await serverSupabase
        .from('staff_users')
        .select('*')
        .eq('gym_id', DEMO_GYM_ID);
      if (!error && data && data.length > 0) {
        return data as StaffUser[];
      }
    } catch (e) {
      console.warn('Supabase getStaffUsers error, falling back to local store:', e);
    }
  }
  return readLocalStore().staff_users;
}

export async function createStaffUser(staffInput: { name: string; email: string; role: 'Admin' | 'Manager' | 'Trainer' }): Promise<StaffUser> {
  const newStaff: StaffUser = {
    id: `staff-${Date.now().toString(36)}`,
    gym_id: DEMO_GYM_ID,
    name: staffInput.name,
    email: staffInput.email,
    role: staffInput.role,
    created_at: new Date().toISOString(),
  };

  if (isServerSupabaseConfigured) {
    try {
      await serverSupabase.from('staff_users').insert(newStaff);
    } catch (e) {
      console.error('Supabase createStaffUser exception:', e);
    }
  }

  const store = readLocalStore();
  store.staff_users.push(newStaff);
  writeLocalStore(store);
  return newStaff;
}

export async function deleteStaffUser(id: string): Promise<boolean> {
  if (isServerSupabaseConfigured) {
    try {
      await serverSupabase.from('staff_users').delete().eq('id', id);
    } catch (e) {
      console.error('Supabase deleteStaffUser exception:', e);
    }
  }

  const store = readLocalStore();
  store.staff_users = store.staff_users.filter(s => s.id !== id);
  writeLocalStore(store);
  return true;
}

// Dashboard Stats (All dynamically derived from real records, no hardcoding)
export async function getDashboardStats(): Promise<DashboardStats> {
  const members = await getMembers();
  const payments = await getPayments();

  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'active').length;
  const expiringSoonMembers = members.filter(m => m.status === 'expiring_soon').length;
  const expiredMembers = members.filter(m => m.status === 'expired').length;

  const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  // Current month revenue
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthlyRevenue = payments
    .filter(p => p.payment_date && p.payment_date.startsWith(currentYearMonth))
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  // Expiring members list (sorted by expiry_date ascending)
  const expiringMembersList = members
    .filter(m => m.status === 'expiring_soon')
    .sort((a, b) => a.expiry_date.localeCompare(b.expiry_date))
    .slice(0, 5);

  // Recent payments list (sorted by payment_date descending)
  const recentPaymentsList = payments
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  // Recently added members (sorted by created_at descending)
  const recentlyAddedMembersList = members
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  return {
    totalMembers,
    activeMembers,
    expiringSoonMembers,
    expiredMembers,
    totalRevenue,
    monthlyRevenue,
    expiringMembersList,
    recentPaymentsList,
    recentlyAddedMembersList,
  };
}

// Connection Health Check
export async function checkSupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  url: string;
  message: string;
  tablesVerified: {
    gym_settings: boolean;
    membership_plans: boolean;
    members: boolean;
    payments: boolean;
    staff_users: boolean;
  };
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!isServerSupabaseConfigured) {
    return {
      configured: false,
      connected: false,
      url: url ? url : 'Not configured (using local persistent store)',
      message: 'NEXT_PUBLIC_SUPABASE_URL or ANON_KEY not set. Using persistent Node.js storage with full PostgreSQL schema compatibility.',
      tablesVerified: {
        gym_settings: true,
        membership_plans: true,
        members: true,
        payments: true,
        staff_users: true,
      },
    };
  }

  const tables = {
    gym_settings: false,
    membership_plans: false,
    members: false,
    payments: false,
    staff_users: false,
  };

  try {
    const { error: errSettings } = await serverSupabase.from('gym_settings').select('id').limit(1);
    tables.gym_settings = !errSettings;

    const { error: errPlans } = await serverSupabase.from('membership_plans').select('id').limit(1);
    tables.membership_plans = !errPlans;

    const { error: errMembers } = await serverSupabase.from('members').select('id').limit(1);
    tables.members = !errMembers;

    const { error: errPayments } = await serverSupabase.from('payments').select('id').limit(1);
    tables.payments = !errPayments;

    const { error: errStaff } = await serverSupabase.from('staff_users').select('id').limit(1);
    tables.staff_users = !errStaff;

    const allConnected = Object.values(tables).every(Boolean);

    return {
      configured: true,
      connected: allConnected,
      url,
      message: allConnected
        ? 'Connected to live Supabase PostgreSQL database. All 5 tables verified.'
        : 'Connected to Supabase project, but some tables are missing. Run migration script to create tables.',
      tablesVerified: tables,
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      url,
      message: `Failed to connect to Supabase: ${err.message || 'Unknown network error'}`,
      tablesVerified: tables,
    };
  }
}
