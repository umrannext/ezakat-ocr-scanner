import { NextResponse } from 'next/server';
import { getRiceRates } from '@/lib/sharepoint-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rates = await getRiceRates();
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Failed to get rice rates:', error);
    return NextResponse.json([
      { id: 'rate-siam-1447', code: 'B_SIAM_1447H', name: 'Beras Siam', price: 1.93, activeYear: '1447H' },
      { id: 'rate-wangi-1447', code: 'B_WANGI_1447H', name: 'Beras Wangi', price: 2.84, activeYear: '1447H' },
      { id: 'rate-siam-1446', code: 'B_SIAM_1446H', name: 'Beras Siam', price: 1.90, activeYear: '1446H' },
      { id: 'rate-wangi-1446', code: 'B_WANGI_1446H', name: 'Beras Wangi', price: 2.80, activeYear: '1446H' }
    ]);
  }
}
