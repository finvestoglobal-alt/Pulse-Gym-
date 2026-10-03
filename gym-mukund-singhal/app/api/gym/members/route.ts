import { NextRequest, NextResponse } from 'next/server';
import { getMembers, createMember } from '@/lib/supabase/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const planId = searchParams.get('planId') || undefined;

    const members = await getMembers({ search, status, planId });
    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.phone || !body.plan_id || !body.start_date || !body.expiry_date) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, plan, start date, and expiry date are required.' },
        { status: 400 }
      );
    }

    const result = await createMember({
      name: body.name,
      phone: body.phone,
      email: body.email,
      gender: body.gender,
      plan_id: body.plan_id,
      plan_name: body.plan_name,
      start_date: body.start_date,
      expiry_date: body.expiry_date,
      amount_paid: Number(body.amount_paid || 0),
      payment_method: body.payment_method || 'UPI',
      payment_date: body.payment_date || body.start_date,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, data: result.member, payment: result.payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
