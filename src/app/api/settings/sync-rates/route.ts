import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

async function checkAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.role === 'ADMIN';
}

export async function POST(req: Request) {
  if (!(await checkAdmin())) return new NextResponse('Unauthorized', { status: 401 });

  try {
    // Determine target year (e.g., 1447H) from request if provided, otherwise default to "1447H"
    const { targetYear } = await req.json().catch(() => ({ targetYear: '1447H' }));
    
    // Fetch from MORA
    const response = await fetch('https://www.mora.gov.bn/SitePages/ZFQP/ZakatFitrahQPW.aspx', {
       headers: {
         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
       }
    });
    
    if (!response.ok) {
       throw new Error('Gagal menghubungi laman KHEU');
    }
    
    const html = await response.text();
    
    // Regex to find prices
    // Example format: Beras Wangi - $2.84
    const wangiMatch = html.match(/Beras Wangi\s*(?:<\/?[^>]+>\s*)*-\s*(?:<\/?[^>]+>\s*)*\$(\d+\.\d+)/i);
    const siamMatch = html.match(/Beras Siam\s*(?:<\/?[^>]+>\s*)*-\s*(?:<\/?[^>]+>\s*)*\$(\d+\.\d+)/i);
    
    if (!wangiMatch && !siamMatch) {
       throw new Error('Format harga dalam laman web KHEU telah berubah atau gagal dijumpai.');
    }

    const updates = [];

    if (wangiMatch) {
      const price = parseFloat(wangiMatch[1]);
      updates.push(prisma.riceType.upsert({
        where: { name_activeYear: { name: 'Beras Wangi', activeYear: targetYear } },
        update: { price },
        create: {
          name: 'Beras Wangi',
          price,
          activeYear: targetYear,
          code: `B_WANGI_${targetYear}`
        }
      }));
    }

    if (siamMatch) {
      const price = parseFloat(siamMatch[1]);
      updates.push(prisma.riceType.upsert({
        where: { name_activeYear: { name: 'Beras Siam', activeYear: targetYear } },
        update: { price },
        create: {
          name: 'Beras Siam',
          price,
          activeYear: targetYear,
          code: `B_SIAM_${targetYear}`
        }
      }));
    }

    await prisma.$transaction(updates);

    return NextResponse.json({ success: true, message: 'Harga berjaya di-sync dari KHEU' });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message || 'Gagal sync dari laman KHEU' }, { status: 500 });
  }
}
