import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserById } from '@/lib/sharepoint-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('auth_token')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak dijumpai' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      loginId: user.loginId,
      role: user.role,
      position: user.position,
      phoneNumber: user.phoneNumber,
      mosque: {
        name: user.mosqueName || 'Kariah Masjid',
        zone: { name: user.zoneName || 'Brunei' }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 });
  }
}
