import { NextResponse } from 'next/server';
import { getReceiptById, updateReceipt, deleteReceipt } from '@/lib/sharepoint-db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const receipt = await getReceiptById(params.id);
    if (!receipt) {
      return NextResponse.json({ success: false, error: 'Resit tidak dijumpai' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: receipt });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await req.json();
    await updateReceipt(params.id, body);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request, 
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    await deleteReceipt(params.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
