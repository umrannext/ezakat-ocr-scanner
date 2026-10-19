import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getReceipts, createReceipt, getUserById } from '@/lib/sharepoint-db';
import { uploadReceiptImagesToSharePoint } from '@/lib/sharepoint-sync';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get('auth_token')?.value;
    let userRole = cookieStore.get('auth_role')?.value || 'AMIL';

    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match) userId = match[1];
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(200, Math.max(10, parseInt(searchParams.get('limit') || '80', 10)));

    const receipts = await getReceipts({
      amilId: userRole === 'AMIL' ? userId : undefined,
      limit
    });

    const response = NextResponse.json({
      success: true,
      data: receipts,
      userRole
    });

    response.headers.set('Cache-Control', 'private, max-age=5');
    return response;
  } catch (error: any) {
    console.error('Ralat mendapatkan senarai resit dari SharePoint:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal memuatkan rekod resit'
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get('auth_token')?.value;
    let userName = cookieStore.get('auth_name')?.value ? decodeURIComponent(cookieStore.get('auth_name')!.value) : 'Amil';

    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match) userId = match[1];
    }

    const user = userId ? await getUserById(userId) : null;
    const finalUserId = user?.id || userId || 'unknown';
    const finalUserName = user?.name || userName || 'Amil Zakat';
    const finalMosque = user?.mosqueName || 'Kariah Masjid';
    const finalZone = user?.zoneName || 'Brunei';

    const textBody = await req.text();
    const data = JSON.parse(textBody);

    const receiptNumber = data.receiptNumber?.trim() || ('RZT-' + Math.floor(100000 + Math.random() * 900000));
    const payerName = data.isQuickMode 
      ? (data.payerName?.trim() || 'Arkib Zakat Fitrah') 
      : (data.payerName?.trim() || 'Pembayar Zakat');
    const payerIcNumber = data.isQuickMode ? null : (data.icNumber?.trim() || null);

    const dependents = data.dependents !== undefined ? parseInt(data.dependents, 10) : 0;
    let totalAmount = data.totalAmount !== undefined ? parseFloat(data.totalAmount) : 0;
    
    // Auto calculate if zero
    if (data.zakatType !== 'HARTA' && (!totalAmount || totalAmount <= 0)) {
      const price = receiptNumber.startsWith('DW') ? 2.84 : 1.93;
      totalAmount = parseFloat(((dependents + 1) * price).toFixed(2));
    }

    const dependentReceipts = Array.isArray(data.dependentReceipts) ? data.dependentReceipts.filter(Boolean) : [];
    const dependentImages = Array.isArray(data.dependentImages) ? data.dependentImages.filter(Boolean) : [];

    // 1. Muat naik imej ke SharePoint Document Library (Drive)
    let imageShareLink: string | null = null;
    let dependentShareLinks: string[] = [];

    try {
      const syncResult = await uploadReceiptImagesToSharePoint(
        receiptNumber,
        data.imageUrl || null,
        dependentImages,
        dependentReceipts
      );
      imageShareLink = syncResult.imageShareLink;
      dependentShareLinks = syncResult.dependentShareLinks;
    } catch (uploadErr) {
      console.warn('Amaran muat naik gambar ke SharePoint:', uploadErr);
    }

    // 2. Simpan rekod resit ke SharePoint List (ZakatReceipts)
    const createdReceipt = await createReceipt({
      receiptNumber,
      payerName,
      payerIcNumber,
      zakatType: data.zakatType || 'FITRAH',
      hartaSubtype: data.hartaSubtype || null,
      riceType: data.riceTypeName || (receiptNumber.startsWith('DW') ? 'Beras Wangi' : 'Beras Siam'),
      ricePrice: data.ricePrice || (receiptNumber.startsWith('DW') ? 2.84 : 1.93),
      dependents,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      paidAmount: parseFloat(totalAmount.toFixed(2)),
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      isVerified: Boolean(data.isVerified),
      isWakalah: Boolean(data.isWakalah),
      amilId: finalUserId,
      amilName: finalUserName,
      mosqueName: finalMosque,
      zoneName: finalZone,
      groupId: data.groupId || null,
      remarks: data.remarks || null,
      dependentReceipts,
      missingDependents: data.missingDependents || 0,
      imageShareLink,
      dependentShareLinks
    });

    return NextResponse.json({
      success: true,
      data: createdReceipt
    });
  } catch (error: any) {
    console.error('Ralat simpan resit ke SharePoint:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal menyimpan rekod resit ke dalam SharePoint.'
    }, { status: 500 });
  }
}
