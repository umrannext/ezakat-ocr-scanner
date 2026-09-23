import Link from 'next/link';
import { FileText, Plus, ScanLine, ArrowRight, UserCircle2, MapPin, LogOut, Download } from 'lucide-react';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';



export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;

  if (!userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { mosque: { include: { zone: true } } }
  });

  if (!user) {
    redirect('/login');
  }

  const receipts = await prisma.receipt.findMany({
    where: user.role === 'AMIL' ? { amilId: user.id } : {},
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { riceType: true }
  });

  const stats = await prisma.receipt.aggregate({
    where: user.role === 'AMIL' ? { amilId: user.id } : {},
    _sum: { totalAmount: true },
    _count: { id: true }
  });
  
  const totalAmount = stats._sum.totalAmount || 0;
  const totalReceipts = stats._count.id;

  const handleLogout = async () => {
    "use server";
    (await cookies()).delete('auth_token');
    redirect('/login');
  };

  return (
    <main className="min-h-screen p-6">
      <header className="mb-8 pt-4">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
              Sistem OCR <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500">
                Resit Zakat Fitrah
              </span>
            </h1>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-teal-50 p-3 rounded-full text-teal-600">
              <UserCircle2 size={32} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">{user.name}</p>
              <div className="flex items-center gap-1 mt-1 text-slate-500 text-[11px] font-medium tracking-wide">
                {user.role === 'ADMIN' ? (
                  <span className="bg-slate-800 text-white px-2 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-bold">Admin Pusat</span>
                ) : (
                  <>
                    <MapPin size={12} className="text-teal-500 shrink-0" />
                    <span className="truncate max-w-[150px]">{user.mosque?.name} • {user.mosque?.zone?.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <form action={handleLogout}>
            <button type="submit" className="text-slate-400 hover:text-red-500 p-2.5 active:scale-90 transition-all bg-slate-50 rounded-xl hover:bg-red-50" title="Log Keluar">
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </header>

      {/* Main Dashboard Card */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400 rounded-[2rem] p-7 text-white shadow-[0_20px_40px_-15px_rgba(20,184,166,0.5)] mb-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-20 -translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="absolute -bottom-10 -right-10 opacity-10 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700">
          <ScanLine size={180} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
          <div>
            <h2 className="text-[11px] font-bold mb-1 text-teal-100 uppercase tracking-widest opacity-90">
              {user.role === 'ADMIN' ? 'Jumlah Keseluruhan Kutipan' : 'Jumlah Kutipan Anda'}
            </h2>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-teal-100/70">$</span>
              <p className="text-5xl font-black tracking-tighter drop-shadow-md">{totalAmount.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2 mt-1 mb-6">
              <div className="inline-block bg-black/20 rounded-full px-3 py-1 backdrop-blur-sm border border-white/10">
                <p className="text-xs font-bold text-teal-50">Dari <span className="text-white">{totalReceipts}</span> Resit Pembayar</p>
              </div>
              {user.role === 'ADMIN' && (
                <a href="/api/export/receipts" className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors rounded-full px-3 py-1 backdrop-blur-sm border border-white/20 text-xs font-bold text-white shadow-sm" title="Muat turun senarai resit">
                  <Download size={14} />
                  Eksport
                </a>
              )}
            </div>
          </div>
          
          <Link href="/scan" className="group/btn inline-flex items-center justify-between w-full bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-4 rounded-2xl text-sm font-bold shadow-lg active:scale-[0.98] transition-all hover:bg-white hover:text-teal-700">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg group-hover/btn:bg-teal-100 group-hover/btn:text-teal-600 transition-colors">
                <Plus size={18} />
              </div>
              <span className="tracking-wide">Imbas Resit Zakat Baru</span>
            </div>
            <ArrowRight size={18} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      <section className="relative z-10">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">Rekod Terkini</h3>
          <Link href="/history" className="text-sm text-teal-600 font-bold hover:text-teal-700 transition-colors bg-teal-50 px-3 py-1 rounded-full">Lihat Semua</Link>
        </div>

        <div className="space-y-4">
          {receipts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100/50 flex flex-col items-center justify-center">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <FileText className="text-slate-300" size={40} />
              </div>
              <p className="text-slate-600 text-sm font-bold">Belum ada rekod zakat.</p>
              <p className="text-slate-400 text-xs mt-2 font-medium">Sila imbas resit zakat fitrah pertama anda.</p>
            </div>
          ) : (
            receipts.map((receipt) => (
              <div key={receipt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/50 flex justify-between items-center group hover:shadow-md transition-shadow">
                <div className="flex gap-4 items-center">
                  <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-teal-50 transition-colors">
                    <FileText size={20} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{receipt.payerName}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium tracking-wide">
                      No. Resit: <span className="text-slate-600">{receipt.receiptNumber}</span>
                      <span className="mx-1.5 text-slate-300">•</span>
                      <span className="text-teal-600 font-bold">{receipt.dependents}</span> Tanggungan
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="inline-block bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/50 text-teal-700 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    {receipt.riceType?.name || receipt.zakatType || 'Zakat'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium tracking-wide">
                    {new Date(receipt.paymentDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs font-black text-teal-600 mt-1">${receipt.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
