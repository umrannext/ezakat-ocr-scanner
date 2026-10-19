import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getRiceRates, updateRiceRate, getUserById } from '@/lib/sharepoint-db';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  const role = cookieStore.get('auth_role')?.value;
  if (!userId) return false;
  if (role === 'ADMIN') return true;
  const user = await getUserById(userId);
  return user?.role === 'ADMIN';
}

export async function GET() {
  if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });
  const rates = await getRiceRates();
  return NextResponse.json(rates);
}

export async function PUT(req: Request) {
  if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });
  try {
    const { id, price } = await req.json();
    await updateRiceRate(id, parseFloat(price));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengemaskini kadar' }, { status: 400 });
  }
}
