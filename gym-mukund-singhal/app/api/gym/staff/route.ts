import { NextRequest, NextResponse } from 'next/server';
import { getStaffUsers, createStaffUser } from '@/lib/supabase/db';

export async function GET() {
  try {
    const staff = await getStaffUsers();
    return NextResponse.json({ success: true, data: staff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ success: false, error: 'Name, email, and role are required.' }, { status: 400 });
    }
    const newStaff = await createStaffUser({
      name: body.name,
      email: body.email,
      role: body.role,
    });
    return NextResponse.json({ success: true, data: newStaff }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
