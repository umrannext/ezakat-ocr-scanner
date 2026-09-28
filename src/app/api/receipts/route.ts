import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get('auth_token')?.value;
    let userRole = cookieStore.get('auth_role')?.value;

    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match) userId = match[1];
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Sekiranya role tiada dalam kuki, semak user di DB
    if (!userRole) {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        userRole = user?.role || 'AMIL';
      } catch (_) {
        userRole = 'AMIL';
      }
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '60', 10)));

    const receipts = await prisma.receipt.findMany({
      where: userRole === 'AMIL' ? { amilId: userId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        riceType: {
          select: { id: true, name: true, code: true, price: true, activeYear: true }
        },
        amil: {
          select: { id: true, name: true, loginId: true }
        }
      }
    });

    const serialized = receipts.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      paymentDate: r.paymentDate.toISOString()
    }));

    const response = NextResponse.json({
      success: true,
      data: serialized,
      userRole
    });
    // Cache 5 saat di browser — halaman Sejarah refresh pantas tanpa fetch semula
    response.headers.set('Cache-Control', 'private, max-age=5');
    return response;
  } catch (error: any) {
    console.error("Ralat mendapatkan senarai resit:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal memuatkan rekod resit'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Dapatkan amilId daripada kuki atau header
    let amilId = (await cookies()).get('auth_token')?.value;
    if (!amilId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match) amilId = match[1];
    }

    // 2. Sahkan pengguna wujud dalam pangkalan data (sokong fallback jika sesi amil)
    let user = amilId ? await prisma.user.findUnique({ where: { id: amilId } }) : null;
    if (!user) {
      user = await prisma.user.findFirst({ where: { role: 'AMIL' } }) || await prisma.user.findFirst();
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Sesi log masuk tidak sah. Sila log masuk semula.' 
      }, { status: 401 });
    }

    const textBody = await req.text();
    const data = JSON.parse(textBody);

    // 3. Sahkan Nombor Resit & Nama Pembayar
    const receiptNumber = data.receiptNumber?.trim() || ('RZT-' + Math.floor(100000 + Math.random() * 900000));
    const payerName = data.isQuickMode 
      ? (data.payerName?.trim() || 'Arkib Zakat Fitrah') 
      : (data.payerName?.trim() || 'Pembayar Zakat');
    const payerIcNumber = data.isQuickMode ? null : (data.icNumber?.trim() || null);

    // 4. Sahkan RiceTypeId (Pastikan wujud dalam DB atau null jika Zakat Harta)
    let validRiceTypeId: string | null = null;
    let selectedRicePrice = 0;
    if (data.zakatType !== 'HARTA') {
      let checkRice = null;
      if (data.riceTypeId && typeof data.riceTypeId === 'string' && data.riceTypeId.trim() !== '') {
        checkRice = await prisma.riceType.findUnique({ where: { id: data.riceTypeId } });
      }
      if (!checkRice) {
        // Cari mengikut nama / kod beras jika ID tidak ditemui
        const isWangi = receiptNumber.startsWith('DW') || (typeof data.riceTypeId === 'string' && data.riceTypeId.toLowerCase().includes('wangi'));
        checkRice = await prisma.riceType.findFirst({
          where: {
            name: { contains: isWangi ? 'Wangi' : 'Siam', mode: 'insensitive' }
          }
        });
      }
      if (!checkRice) {
        checkRice = await prisma.riceType.findFirst({ where: { activeYear: '1447H' } }) || await prisma.riceType.findFirst();
      }
      if (checkRice) {
        validRiceTypeId = checkRice.id;
        selectedRicePrice = checkRice.price;
      }
    }

    const dependents = data.dependents !== undefined ? parseInt(data.dependents, 10) : 0;
    let totalAmount = data.totalAmount !== undefined ? parseFloat(data.totalAmount) : 0;
    
    // Failsafe: Jika bayaran fitrah $0.00, kira semula berasaskan (1 + tanggungan) * harga beras
    if (data.zakatType !== 'HARTA' && (!totalAmount || totalAmount <= 0)) {
      const price = selectedRicePrice > 0 ? selectedRicePrice : (receiptNumber.startsWith('DW') ? 2.84 : 1.93);
      totalAmount = parseFloat(((dependents + 1) * price).toFixed(2));
    }

    const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    const safeImageUrl = (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.length < 150000) ? data.imageUrl : null;
    const safeTotalAmount = isNaN(totalAmount) ? 0 : totalAmount;
    const safeDependents = isNaN(dependents) ? 0 : dependents;

    // 5. Jana senarai nombor resit — pembayar utama + running number untuk tanggungan
    // Contoh: DW 077703 → tanggungan 1: DW 077704, tanggungan 2: DW 077705
    const receiptNumbers: string[] = [receiptNumber];
    
    if (data.zakatType !== 'HARTA' && safeDependents > 0) {
      // Ekstrak kod (DW/CS) dan nombor digit dari receiptNumber
      const prefixMatch = receiptNumber.match(/^([A-Z]{2})\s*/i);
      const prefix = prefixMatch ? prefixMatch[1].toUpperCase() + ' ' : '';
      const digits = receiptNumber.replace(/^[A-Z]{2}\s*/i, '').replace(/\D/g, '');
      const baseNum = parseInt(digits, 10);
      
      if (!isNaN(baseNum)) {
        for (let i = 1; i <= safeDependents; i++) {
          const nextNum = String(baseNum + i).padStart(digits.length || 6, '0');
          receiptNumbers.push(`${prefix}${nextNum}`);
        }
      }
    }

    // 6. Semak semua nombor resit untuk elak pendua
    const existingReceipts = await prisma.receipt.findMany({
      where: { receiptNumber: { in: receiptNumbers } },
      select: { receiptNumber: true }
    });
    
    if (existingReceipts.length > 0) {
      const dupeNums = existingReceipts.map(r => r.receiptNumber).join(', ');
      return NextResponse.json({ 
        success: false, 
        error: `Nombor resit berikut telah pun wujud dalam sistem: ${dupeNums}`
      }, { status: 400 });
    }

    // 7. Cipta semua rekod (pembayar + tanggungan) sekaligus
    const pricePerPax = data.zakatType !== 'HARTA' && (dependents + 1) > 0 
      ? safeTotalAmount / (dependents + 1) 
      : safeTotalAmount;

    const receiptDataList = receiptNumbers.map((rNum, idx) => ({
      receiptNumber: rNum,
      payerName: idx === 0 ? payerName : `Tanggungan ${idx} - ${payerName || 'Pembayar Zakat'}`,
      zakatType: data.zakatType || 'FITRAH',
      riceTypeId: validRiceTypeId,
      amilId: user.id,
      payerIcNumber: idx === 0 ? payerIcNumber : null,
      isVerified: Boolean(data.isVerified && !data.isQuickMode),
      isWakalah: Boolean(data.isWakalah),
      isSedekah: false,
      paidAmount: parseFloat(pricePerPax.toFixed(2)),
      sedekahAmount: 0,
      imageUrl: idx === 0 ? safeImageUrl : null, // Gambar hanya pada rekod utama
      dependents: idx === 0 ? safeDependents : 0,
      paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
      totalAmount: parseFloat(pricePerPax.toFixed(2))
    }));

    // Gunakan createMany untuk kecekapan — satu request sahaja ke DB
    await prisma.receipt.createMany({ data: receiptDataList });

    // Ambil rekod utama (pembayar) untuk dikembalikan ke frontend
    const createdReceipt = await prisma.receipt.findUnique({
      where: { receiptNumber: receiptNumber }
    });

    return NextResponse.json({ 
      success: true, 
      data: createdReceipt,
      totalCreated: receiptNumbers.length,
      receiptNumbers 
    });
  } catch (error: any) {
    console.error("Ralat simpan resit:", error);
    return NextResponse.json({ 
      success: false, 

      error: error?.message || 'Gagal menyimpan rekod resit ke dalam sistem.' 
    }, { status: 500 });
  }
}
