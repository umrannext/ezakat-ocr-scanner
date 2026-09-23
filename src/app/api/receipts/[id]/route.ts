import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';



const isAdmin = async () => {
  const amilId = (await cookies()).get('auth_token')?.value;
  if (!amilId) return false;
  const user = await prisma.user.findUnique({ where: { id: amilId } });
  return user?.role === 'ADMIN';
};

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { id } = await params;
    await prisma.receipt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memadam rekod' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { id } = await params;
    const data = await req.json();
    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        payerName: data.payerName,
        receiptNumber: data.receiptNumber,
        dependents: data.dependents,
        totalAmount: data.totalAmount
      },
      include: { riceType: true }
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengemaskini rekod' }, { status: 500 });
  }
}
