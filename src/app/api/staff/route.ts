import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllUsers, getUserById } from '@/lib/sharepoint-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_token')?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Sila log masuk' }, { status: 401 });
    }

    const currentUser = await getUserById(userId);
    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Akses terhad untuk Admin sahaja' }, { status: 403 });
    }

    const allUsers = await getAllUsers();
    const staffs = allUsers.filter(u => u.role === 'STAFF');

    return NextResponse.json({
      success: true,
      data: staffs
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
