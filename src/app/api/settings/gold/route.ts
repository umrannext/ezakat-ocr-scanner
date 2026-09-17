import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'GOLD_PRICE_PER_GRAM' }
    });
    return NextResponse.json({ price: setting ? parseFloat(setting.value) : 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gold price' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: token } });
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { price } = body;

    if (!price || isNaN(price)) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'GOLD_PRICE_PER_GRAM' },
      update: { value: price.toString() },
      create: { key: 'GOLD_PRICE_PER_GRAM', value: price.toString() }
    });

    return NextResponse.json({ success: true, price: parseFloat(setting.value) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update gold price' }, { status: 500 });
  }
}
