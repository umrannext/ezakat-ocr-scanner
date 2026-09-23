import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';



async function checkAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.role === 'ADMIN';
}

export async function GET() {
  if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });

  const rates = await prisma.riceType.findMany({
    orderBy: [
      { activeYear: 'desc' },
      { name: 'asc' }
    ]
  });

  return NextResponse.json(rates);
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { name, price, activeYear, code } = await req.json();

    const newRate = await prisma.riceType.create({
      data: {
        name,
        price: parseFloat(price),
        activeYear,
        code
      }
    });

    return NextResponse.json(newRate);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah kadar (mungkin tahun/nama sudah wujud)' }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { id, price } = await req.json();

    const updated = await prisma.riceType.update({
      where: { id },
      data: { price: parseFloat(price) }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengemaskini kadar' }, { status: 400 });
  }
}
