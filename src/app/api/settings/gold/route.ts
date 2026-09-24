import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';



export async function GET(req: NextRequest) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'GOLD_PRICE_PER_GRAM' }
    });
    // Jika belum ditetapkan, gunakan nilai rujukan standard emas 999 semasa (~$115.00/g)
    const price = setting ? parseFloat(setting.value) : 115.00;
    return NextResponse.json({ price });
  } catch (error) {
    return NextResponse.json({ price: 115.00 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    const role = cookieStore.get('auth_role')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (role !== 'ADMIN') {
      const user = await prisma.user.findUnique({ where: { id: token } });
      if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { price } = body;

    if (price === undefined || isNaN(parseFloat(price))) {
      return NextResponse.json({ error: 'Harga tidak sah' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'GOLD_PRICE_PER_GRAM' },
      update: { value: parseFloat(price).toString() },
      create: { key: 'GOLD_PRICE_PER_GRAM', value: parseFloat(price).toString() }
    });

    return NextResponse.json({ success: true, price: parseFloat(setting.value) });
  } catch (error: any) {
    console.error('Failed to update gold price:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update gold price' }, { status: 500 });
  }
}
