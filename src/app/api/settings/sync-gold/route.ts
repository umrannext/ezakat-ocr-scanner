import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value || cookieStore.get('auth-token')?.value;
    const role = cookieStore.get('auth_role')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'ADMIN') {
      const user = await prisma.user.findUnique({ where: { id: token } });
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 1. Dapatkan harga spot emas semasa (XAU/SGD di mana 1 SGD = 1 BND)
    let pricePerGram: number | null = null;
    let sourceName = 'Pasaran Emas Spot Semasa';

    try {
      const res = await fetch('https://api.gold-api.com/price/XAU/SGD', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.price === 'number') {
          // 1 troy ounce = 31.1034768 gram
          const perGram = data.price / 31.1034768;
          pricePerGram = parseFloat(perGram.toFixed(2));
          sourceName = 'Pasaran Emas Spot Antarabangsa (XAU/SGD 1:1 BND)';
        }
      }
    } catch (err) {
      console.warn('GoldAPI SGD error:', err);
    }

    // 2. Fallback jika kaedah 1 gagal: XAU/USD ditukar ke SGD/BND
    if (!pricePerGram) {
      try {
        const resUsd = await fetch('https://api.gold-api.com/price/XAU', {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          cache: 'no-store'
        });
        if (resUsd.ok) {
          const usdData = await resUsd.json();
          if (usdData && typeof usdData.price === 'number') {
            let usdRate = 1.28;
            try {
              const rateRes = await fetch('https://open.er-api.com/v6/latest/USD');
              const rateData = await rateRes.json();
              if (rateData?.rates?.SGD) {
                usdRate = rateData.rates.SGD;
              }
            } catch (rateErr) {
              console.warn('Currency rate fetch fallback:', rateErr);
            }
            const perGram = (usdData.price * usdRate) / 31.1034768;
            pricePerGram = parseFloat(perGram.toFixed(2));
            sourceName = 'Pasaran Emas Spot (XAU/USD Ditukar ke BND)';
          }
        }
      } catch (errUsd) {
        console.warn('GoldAPI USD fallback error:', errUsd);
      }
    }

    // 3. Fallback nilai standard jika tiada sambungan internet luaran
    if (!pricePerGram) {
      const currentSetting = await prisma.systemSetting.findUnique({
        where: { key: 'GOLD_PRICE_PER_GRAM' }
      });
      pricePerGram = currentSetting ? parseFloat(currentSetting.value) : 115.00;
      sourceName = 'Rujukan Tetapan Tersimpan';
    }

    return NextResponse.json({
      success: true,
      price: pricePerGram,
      source: sourceName,
      message: `Harga emas pasaran semasa berjaya dikesan ($${pricePerGram.toFixed(2)}/g). Anda boleh menyelaraskan nilai ini sebelum menyimpan.`
    });
  } catch (error: any) {
    console.error('Ralat sync harga emas:', error);
    return NextResponse.json({ 
      error: error?.message || 'Gagal menyelaraskan harga emas semasa' 
    }, { status: 500 });
  }
}
