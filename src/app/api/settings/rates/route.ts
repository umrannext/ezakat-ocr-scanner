import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';



async function checkAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  const role = cookieStore.get('auth_role')?.value;
  if (!userId) return false;
  if (role === 'ADMIN') return true;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user?.role === 'ADMIN';
  } catch (_) {
    return false;
  }
}

export async function GET() {
  if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });

  try {
    let rates = await prisma.riceType.findMany({
      orderBy: [
        { activeYear: 'desc' },
        { name: 'asc' }
      ]
    });

    if (!rates || rates.length === 0) {
      // Inisialisasi kadar beras asas Brunei jika pangkalan data masih kosong
      const defaults = [
        { code: 'B_SIAM_1447H', name: 'Beras Siam', price: 1.93, activeYear: '1447H' },
        { code: 'B_WANGI_1447H', name: 'Beras Wangi', price: 2.84, activeYear: '1447H' },
        { code: 'B_SIAM_1446H', name: 'Beras Siam', price: 1.90, activeYear: '1446H' },
        { code: 'B_WANGI_1446H', name: 'Beras Wangi', price: 2.80, activeYear: '1446H' }
      ];

      for (const d of defaults) {
        try {
          await prisma.riceType.upsert({
            where: { name_activeYear: { name: d.name, activeYear: d.activeYear } },
            update: { price: d.price, code: d.code },
            create: d
          });
        } catch (_) {}
      }

      rates = await prisma.riceType.findMany({
        orderBy: [{ activeYear: 'desc' }, { name: 'asc' }]
      });
    }

    return NextResponse.json(rates);
  } catch (err: any) {
    console.warn('Fetch rates notice:', err?.message);
    // Kembalikan senarai kadar sandaran rasmi Brunei jika DB tergendala
    return NextResponse.json([
      { id: 'def-1', code: 'B_SIAM_1447H', name: 'Beras Siam', price: 1.93, activeYear: '1447H' },
      { id: 'def-2', code: 'B_WANGI_1447H', name: 'Beras Wangi', price: 2.84, activeYear: '1447H' },
      { id: 'def-3', code: 'B_SIAM_1446H', name: 'Beras Siam', price: 1.90, activeYear: '1446H' },
      { id: 'def-4', code: 'B_WANGI_1446H', name: 'Beras Wangi', price: 2.80, activeYear: '1446H' }
    ]);
  }
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
