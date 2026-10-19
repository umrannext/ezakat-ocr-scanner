import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getReceipts, getUserById } from '@/lib/sharepoint-db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await getUserById(userId);
  if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const receipts = await getReceipts({ limit: 500 });

    const headers = [
      'No. Resit',
      'Jenis Zakat',
      'Tarikh',
      'Nama Pembayar',
      'No. K/P',
      'Wakalah',
      'Kategori Beras / Harta',
      'Tanggungan',
      'Jumlah Zakat ($)',
      'Jumlah Diterima ($)',
      'Timestamp Penuh',
      'Nama Amil',
      'Masjid',
      'Zon'
    ];

    const rows = receipts.map(r => [
      r.receiptNumber,
      r.zakatType === 'HARTA' ? 'Zakat Harta' : 'Zakat Fitrah',
      new Date(r.paymentDate).toLocaleDateString('ms-MY'),
      `"${r.payerName}"`,
      r.payerIcNumber || '-',
      r.isWakalah ? 'Ya' : 'Tidak',
      r.zakatType === 'HARTA' ? (r.hartaSubtype || 'Harta') : (r.riceType || 'Beras Siam'),
      r.zakatType === 'HARTA' ? '-' : r.dependents.toString(),
      r.totalAmount.toFixed(2),
      r.paidAmount.toFixed(2),
      r.createdAt,
      `"${r.amilName}"`,
      `"${r.mosqueName || '-'}"`,
      `"${r.zoneName || '-'}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const fileName = `Export_Kutipan_Zakat_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
