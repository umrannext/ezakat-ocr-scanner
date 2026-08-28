import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AmilDirectoryClient from '@/components/AmilDirectoryClient';

const prisma = new PrismaClient();

export default async function AmilsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;

  if (!userId) redirect('/login');

  const admin = await prisma.user.findUnique({ where: { id: userId } });
  if (admin?.role !== 'ADMIN') redirect('/');

  const amils = await prisma.user.findMany({
    where: { role: 'AMIL' },
    include: { 
      mosque: { include: { zone: true } },
      receipts: { select: { totalAmount: true } }
    },
    orderBy: { name: 'asc' }
  });

  return <AmilDirectoryClient initialAmils={amils} />;
}
