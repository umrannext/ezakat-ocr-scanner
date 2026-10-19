import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllUsers, getUserById, getReceipts } from '@/lib/sharepoint-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_token')?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Sila log masuk' }, { status: 401 });
    }

    const currentUser = await getUserById(userId);
    if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'STAFF') {
      return NextResponse.json({ success: false, error: 'Akses terhad untuk Admin / Staf' }, { status: 403 });
    }

    const [allUsers, allReceipts] = await Promise.all([
      getAllUsers(),
      getReceipts({ limit: 500 })
    ]);

    const amils = allUsers.filter(u => u.role === 'AMIL');

    const serialized = amils.map(a => {
      const userReceipts = allReceipts.filter(r => r.amilId === a.id || r.amilName === a.name);
      return {
        id: a.id,
        name: a.name,
        loginId: a.loginId,
        position: a.position,
        phoneNumber: a.phoneNumber,
        mosque: {
          name: a.mosqueName || 'Kariah Masjid',
          zone: { name: a.zoneName || 'Brunei' }
        },
        receipts: userReceipts.map(r => ({ totalAmount: r.totalAmount }))
      };
    });

    return NextResponse.json({ success: true, data: serialized });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
