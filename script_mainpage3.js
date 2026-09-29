const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

const returnTarget = /return \([\s\S]*?<\/main>\s*\);\s*\}/;

const newReturn = `return (
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-teal-200 selection:text-teal-900">
      <div className="max-w-xl mx-auto px-5 pt-8">
        
        {/* Header Profil */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-3xl shadow-sm border border-slate-100 relative z-10">
          <div className="flex items-center gap-4 w-full">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-400 rounded-full flex items-center justify-center shadow-inner">
                <UserCircle2 className="text-white" size={28} />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                <div className="w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
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
            
            <form action={async () => {
              'use server';
              const { cookies } = await import('next/headers');
              const c = await cookies();
              c.delete('auth_token');
              c.delete('auth_name');
              c.delete('auth_role');
              c.delete('auth_mosque_id');
            }}>
              <button type="submit" className="text-slate-400 hover:text-red-500 p-2.5 active:scale-90 transition-all bg-slate-50 rounded-xl hover:bg-red-50" title="Log Keluar">
                <LogOut size={18} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </header>

        {user.role === 'ADMIN' ? (
          <AdminDashboard data={adminData} currentYear={currentYear} />
        ) : (
          <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400 rounded-[2rem] p-7 text-white shadow-[0_20px_40px_-15px_rgba(20,184,166,0.5)] mb-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-20 -translate-y-10 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-10 -right-10 opacity-10 transform -rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <ScanLine size={180} />
            </div>
            
            <div className="relative z-10 flex flex-col justify-between h-full min-h-[140px]">
              <div>
                <h2 className="text-[11px] font-bold mb-1 text-teal-100 uppercase tracking-widest opacity-90">
                  Jumlah Kutipan Anda
                </h2>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-teal-100/70">$</span>
                  <p className="text-5xl font-black tracking-tighter drop-shadow-md">{totalAmount.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 mb-6">
                  <div className="inline-block bg-black/20 rounded-full px-3 py-1 backdrop-blur-sm border border-white/10">
                    <p className="text-xs font-bold text-teal-50">Dari <span className="text-white">{totalReceipts}</span> Resit Pembayar</p>
                  </div>
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
        )}

        <section className="relative z-10">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Rekod Terkini</h3>
            <Link href="/history" className="text-sm text-teal-600 font-bold hover:text-teal-700 transition-colors bg-teal-50 px-3 py-1 rounded-full">Lihat Semua</Link>
          </div>
          
          <div className="space-y-3">
            {recentReceipts.length > 0 ? (
              recentReceipts.map((r: any) => (
                <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-teal-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${r.zakatType === 'HARTA' ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'}\`}>
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{r.payerName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{r.receiptNumber} • {new Date(r.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">$\{(r.totalAmount || 0).toFixed(2)}</p>
                    <p className={\`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block \${r.zakatType === 'HARTA' ? 'bg-amber-50 text-amber-600' : 'bg-teal-50 text-teal-600'}\`}>
                      {r.zakatType === 'HARTA' ? 'Harta' : 'Fitrah'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/60 p-8 rounded-3xl border border-dashed border-slate-300 text-center">
                <FileText className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-slate-500 font-medium text-sm">Belum ada sebarang rekod.</p>
                <p className="text-xs text-slate-400 mt-1">Mulakan imbasan untuk merekod resit zakat.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}`;

c = c.replace(returnTarget, newReturn);
fs.writeFileSync('src/app/page.tsx', c);
console.log('Success rewriting return');
