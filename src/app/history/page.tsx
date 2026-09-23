import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FileText } from 'lucide-react';
import HistoryClient from '@/components/HistoryClient';



export default async function HistoryPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;

  if (!userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    redirect('/login');
  }

  // Amil sees only their receipts, Admin sees everything
  const receipts = await prisma.receipt.findMany({
    where: user.role === 'AMIL' ? { amilId: user.id } : {},
    orderBy: { createdAt: 'desc' },
    include: { riceType: true, amil: true }
  });

  // Serialize dates for Client Component
  const serializedReceipts = receipts.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    paymentDate: r.paymentDate.toISOString()
  }));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[100px]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <h1 className="font-bold text-slate-800 ml-2 tracking-tight text-lg">Rekod Keseluruhan</h1>
        <div className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold mr-2">
          {receipts.length} Rekod
        </div>
      </div>

      <HistoryClient initialReceipts={serializedReceipts} userRole={user.role} />
    </div>
  );
}
