import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';



export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;

  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (user?.role !== 'ADMIN') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const receipts = await prisma.receipt.findMany({
      include: {
        amil: {
          select: { name: true, loginId: true, mosque: { select: { name: true, zone: { select: { name: true } } } } }
        },
        riceType: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    // Generate CSV
    const headers = [
      'No. Resit',
      'Tarikh',
      'Nama Pembayar',
      'No. K/P',
      'Kategori Beras',
      'Tanggungan',
      'Jumlah Zakat ($)',
      'Nama Amil',
      'ID Amil',
      'Masjid',
      'Zon'
    ];

    const rows = receipts.map(r => [
      r.receiptNumber,
      new Date(r.paymentDate).toLocaleDateString('ms-MY'),
      `"${r.payerName}"`, // Quote strings that might have commas
      r.payerIcNumber || '-',
      r.riceType?.name || r.zakatType || '-',
      r.dependents.toString(),
      r.totalAmount.toFixed(2),
      `"${r.amil.name}"`,
      r.amil.loginId,
      `"${r.amil.mosque?.name || '-'}"`,
      `"${r.amil.mosque?.zone?.name || '-'}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const fileName = `Export_Kutipan_Zakat_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
