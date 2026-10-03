import { NextRequest, NextResponse } from 'next/server';
import { getPlans, createPlan } from '@/lib/supabase/db';

export async function GET() {
  try {
    const plans = await getPlans();
    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.price || !body.duration_days) {
      return NextResponse.json({ success: false, error: 'Name, price, and duration are required.' }, { status: 400 });
    }
    const newPlan = await createPlan({
      name: body.name,
      duration_months: Number(body.duration_months || 1),
      duration_days: Number(body.duration_days),
      price: Number(body.price),
      description: body.description || '',
      is_popular: Boolean(body.is_popular),
    });
    return NextResponse.json({ success: true, data: newPlan }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
