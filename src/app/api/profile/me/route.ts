import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';



export async function GET() {
  try {
    const amilId = (await cookies()).get('auth_token')?.value;
    if (!amilId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: amilId },
      include: { mosque: { include: { zone: true } } }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Ralat pelayan' }, { status: 500 });
  }
}
