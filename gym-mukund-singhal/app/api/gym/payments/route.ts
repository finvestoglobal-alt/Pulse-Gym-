import { NextRequest, NextResponse } from 'next/server';
import { getPayments, createPayment } from '@/lib/supabase/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const memberId = searchParams.get('memberId') || undefined;

    const payments = await getPayments({ search, startDate, endDate, memberId });
    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.member_id || !body.member_name || !body.amount || !body.payment_date) {
      return NextResponse.json(
        { success: false, error: 'Member ID, Member name, amount, and payment date are required.' },
        { status: 400 }
      );
    }

    const payment = await createPayment({
      member_id: body.member_id,
      member_name: body.member_name,
      plan_id: body.plan_id || '',
      plan_name: body.plan_name || 'Membership Fee',
      amount: Number(body.amount),
      payment_date: body.payment_date,
      payment_method: body.payment_method || 'UPI',
      notes: body.notes,
      extendMembershipDays: body.extendMembershipDays ? Number(body.extendMembershipDays) : undefined,
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
