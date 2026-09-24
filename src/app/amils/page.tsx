import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AmilDirectoryClient from '@/components/AmilDirectoryClient';



export const dynamic = 'force-dynamic';

export default async function AmilsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  const role = cookieStore.get('auth_role')?.value;

  if (!userId) redirect('/login');
  if (role && role !== 'ADMIN') redirect('/');

  let amils: any[] = [];
  try {
    amils = await prisma.user.findMany({
      where: { role: 'AMIL' },
      include: { 
        mosque: { include: { zone: true } },
        receipts: { select: { totalAmount: true } }
      },
      orderBy: { name: 'asc' }
    });
  } catch (err) {
    console.warn("Amils query notice:", err);
  }

  return <AmilDirectoryClient initialAmils={amils} />;
}
