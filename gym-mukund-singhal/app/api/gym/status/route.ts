import { NextResponse } from 'next/server';
import { checkSupabaseConnection } from '@/lib/supabase/db';

export async function GET() {
  try {
    const status = await checkSupabaseConnection();
    return NextResponse.json({ success: true, data: status });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
