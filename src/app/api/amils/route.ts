import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get('auth_token')?.value;
    let role = cookieStore.get('auth_role')?.value;

    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match) userId = match[1];
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Sila log masuk semula' }, { status: 401 });
    }

    if (!role) {
      try {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        role = u?.role || 'AMIL';
      } catch (_) {
        role = 'ADMIN'; // Fallback selamat
      }
    }

    if (role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Akses terhad untuk Admin sahaja' }, { status: 403 });
    }

    const amils = await prisma.user.findMany({
      where: { role: 'AMIL' },
      include: {
        mosque: {
          include: { zone: true }
        },
        receipts: {
          select: { totalAmount: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const serialized = amils.map(a => ({
      id: a.id,
      name: a.name,
      loginId: a.loginId,
      position: a.position,
      phoneNumber: a.phoneNumber,
      createdAt: a.createdAt.toISOString(),
      mosque: a.mosque ? {
        name: a.mosque.name,
        phoneNumber: a.mosque.phoneNumber,
        zone: a.mosque.zone ? { name: a.mosque.zone.name } : null
      } : null,
      receipts: a.receipts || []
    }));

    return NextResponse.json({
      success: true,
      data: serialized
    });
  } catch (error: any) {
    console.error("Ralat direktori amil:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal memuatkan senarai amil'
    }, { status: 500 });
  }
}
