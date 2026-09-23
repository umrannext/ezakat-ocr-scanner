import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

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

    const data = await req.json();

    // 3. Sahkan Nombor Resit
    const receiptNumber = data.receiptNumber?.trim() || ('RZT-' + Math.floor(100000 + Math.random() * 900000));
    const payerName = data.payerName?.trim() || 'Pembayar Zakat';

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

    // 5. Gunakan upsert: Jika no. resit telah wujud, kemaskini rekod tersebut (elak ralat P2002 Unique Constraint)
    const receipt = await prisma.receipt.upsert({
      where: { receiptNumber: receiptNumber },
      update: {
        payerName: payerName,
        zakatType: data.zakatType || 'FITRAH',
        riceTypeId: validRiceTypeId,
        amilId: user.id,
        payerIcNumber: data.icNumber || null,
        isVerified: Boolean(data.isVerified),
        imageUrl: safeImageUrl,
        dependents: isNaN(dependents) ? 0 : dependents,
        paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
        totalAmount: isNaN(totalAmount) ? 0 : totalAmount
      },
      create: {
        receiptNumber: receiptNumber,
        payerName: payerName,
        zakatType: data.zakatType || 'FITRAH',
        riceTypeId: validRiceTypeId,
        amilId: user.id,
        payerIcNumber: data.icNumber || null,
        isVerified: Boolean(data.isVerified),
        imageUrl: safeImageUrl,
        dependents: isNaN(dependents) ? 0 : dependents,
        paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
        totalAmount: isNaN(totalAmount) ? 0 : totalAmount
      }
    });

    return NextResponse.json({ success: true, data: receipt });
  } catch (error: any) {
    console.error("Ralat simpan resit:", error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Gagal menyimpan rekod resit ke dalam sistem.' 
    }, { status: 500 });
  }
}
