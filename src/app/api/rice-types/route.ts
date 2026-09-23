import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';



export async function GET() {
  const types = await prisma.riceType.findMany({
    where: { activeYear: '1447H' }
  });
  return NextResponse.json(types);
}
