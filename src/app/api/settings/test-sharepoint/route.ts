import { NextResponse } from 'next/server';
import { testSharePointConnection } from '@/lib/ms-graph';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await testSharePointConnection();
    return NextResponse.json({
      success: true,
      message: 'Sambungan ke Microsoft Graph API & SharePoint Site BERJAYA!',
      details: result
    });
  } catch (error: any) {
    console.error("Test SharePoint connection failed:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal mengesahkan sambungan ke SharePoint Site'
    }, { status: 400 });
  }
}
