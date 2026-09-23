import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';



export async function PUT(req: Request) {
  try {
    const amilId = (await cookies()).get('auth_token')?.value;
    if (!amilId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    
    const updated = await prisma.user.update({
      where: { id: amilId },
      data: {
        position: data.position,
        phoneNumber: data.phoneNumber
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengemaskini profil' }, { status: 500 });
  }
}
