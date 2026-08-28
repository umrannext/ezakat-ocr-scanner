import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const amilId = (await cookies()).get('auth_token')?.value;
    if (!amilId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber: data.receiptNumber,
        payerName: data.payerName,
        riceTypeId: data.riceTypeId,
        amilId: amilId,
        payerIcNumber: data.icNumber || null,
        isVerified: data.isVerified || false,
        imageUrl: data.imageUrl || null,
        dependents: data.dependents ? parseInt(data.dependents) : 0,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        totalAmount: data.totalAmount ? parseFloat(data.totalAmount) : 0
      }
    });

    return NextResponse.json({ success: true, data: receipt });
  } catch (error) {
    console.error("Ralat simpan resit:", error);
    return NextResponse.json({ success: false, error: 'Gagal simpan' }, { status: 500 });
  }
}
