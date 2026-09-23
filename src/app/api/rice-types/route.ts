import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const types = await prisma.riceType.findMany({
      orderBy: [
        { activeYear: 'desc' },
        { price: 'asc' }
      ]
    });

    if (types && types.length > 0) {
      return NextResponse.json(types);
    }
  } catch (error) {
    console.error("Gagal mendapatkan senarai jenis beras dari pangkalan data:", error);
  }

  // Fallback sekiranya database kosong atau sambungan terganggu
  return NextResponse.json([
    { id: 'bf3a55f9-4fec-40b3-b690-3136f8b6b71d', code: 'B_SIAM_1447H', name: 'Beras Siam', price: 1.93, activeYear: '1447H' },
    { id: '1b1bebf6-4e54-4422-9847-59ef872dc5d5', code: 'B_WANGI_1447H', name: 'Beras Wangi', price: 2.84, activeYear: '1447H' },
    { id: 'd2bd2bb5-0526-4fbb-b02e-765893e63f78', code: 'B_SIAM_1446H', name: 'Beras Siam', price: 1.90, activeYear: '1446H' },
    { id: 'fc5d684b-f355-46c0-be2f-9431351dd792', code: 'B_WANGI_1446H', name: 'Beras Wangi', price: 2.80, activeYear: '1446H' },
  ]);
}
