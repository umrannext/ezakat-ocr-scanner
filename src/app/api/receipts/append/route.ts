import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { id, imageUrl, receiptNumber, isMissing } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: id }
    });

    if (!receipt) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }

    let updateData: any = {};
    
    if (isMissing) {
      updateData.missingDependents = receipt.missingDependents + 1;
    } else {
      if (imageUrl) {
        updateData.dependentImages = [...receipt.dependentImages, imageUrl];
      }
      if (receiptNumber) {
        updateData.dependentReceipts = [...receipt.dependentReceipts, receiptNumber];
      }
    }

    const updatedReceipt = await prisma.receipt.update({
      where: { id: id },
      data: updateData
    });

    return NextResponse.json({ success: true, data: updatedReceipt });
  } catch (error: any) {
    console.error('Append receipt error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
