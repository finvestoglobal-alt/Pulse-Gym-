import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
);

// Fallback dummy URL to prevent createClient throwing on invalid URL when unconfigured
const validSupabaseUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const validSupabaseKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(validSupabaseUrl, validSupabaseKey);
