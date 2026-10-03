export type MemberStatus = 'active' | 'expiring_soon' | 'expired';

export type PaymentMethod = 'UPI' | 'Cash' | 'Credit Card' | 'Debit Card' | 'Net Banking';

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export interface GymSettings {
  id: string; // e.g. 'pulse-fitness-club'
  gym_name: string;
  tagline: string;
  currency: string;
  phone: string;
  email: string;
  address: string;
  expiring_threshold_days: number;
  updated_at: string;
}

export interface MembershipPlan {
  id: string;
  gym_id: string;
  name: string;
  duration_months: number;
  duration_days: number;
  price: number;
  description: string;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  gym_id: string;
  name: string;
  phone: string;
  email?: string | null;
  gender?: Gender | null;
  plan_id: string;
  plan_name: string;
  start_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_date: string; // YYYY-MM-DD
  notes?: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  gym_id: string;
  member_id: string;
  member_name: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  invoice_number: string;
  notes?: string | null;
  created_at: string;
}

export interface StaffUser {
  id: string;
  gym_id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Trainer';
  created_at: string;
}

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  expiringSoonMembers: number;
  expiredMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  expiringMembersList: Member[];
  recentPaymentsList: Payment[];
  recentlyAddedMembersList: Member[];
}
