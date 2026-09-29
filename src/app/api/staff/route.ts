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
        role = 'ADMIN';
      }
    }

    if (role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Akses terhad untuk Admin sahaja' }, { status: 403 });
    }

    const staffs = await prisma.user.findMany({
      where: { role: 'STAFF' },
      orderBy: { name: 'asc' }
    });

    const serialized = staffs.map(s => ({
      id: s.id,
      name: s.name,
      loginId: s.loginId,
      position: s.position,
      phoneNumber: s.phoneNumber,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: serialized
    });
  } catch (error: any) {
    console.error("Ralat direktori staf:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal memuatkan senarai staf'
    }, { status: 500 });
  }
}
