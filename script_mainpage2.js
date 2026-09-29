const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!c.includes('import AdminDashboard')) {
  c = c.replace("import { FileText,", "import AdminDashboard from '@/components/AdminDashboard';\nimport { FileText,");
}

c = c.replace(/export default async function Home\(\) \{/, `export default async function Home(props: { searchParams?: Promise<{ year?: string }> }) {\n  const searchParams = await props.searchParams;\n  const currentYear = searchParams?.year || '1447H';`);

const replaceData = `const [recentReceipts, stats, adminReceipts] = await Promise.all([
        prisma.receipt.findMany({
          where: isAmil ? { amilId: user.id } : {},
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            receiptNumber: true,
            payerName: true,
            totalAmount: true,
            createdAt: true,
            zakatType: true,
          }
        }),
        prisma.receipt.aggregate({
          where: isAmil ? { amilId: user.id } : {},
          _sum: { totalAmount: true, sedekahAmount: true },
          _count: { id: true }
        }),
        !isAmil ? prisma.receipt.findMany({
          where: {
            OR: [
              { riceType: { activeYear: currentYear } }, 
              { AND: [{ zakatType: 'HARTA' }] }
            ]
          },
          include: {
            amil: { include: { mosque: { include: { zone: true } } } }
          }
        }) : Promise.resolve([])
      ]);
      
      let adminData = { totalFitrah: 0, totalHarta: 0, totalSedekah: 0, zoneStats: [] as any[] };
      if (!isAmil) {
        const zoneMap = new Map();
        adminReceipts.forEach((r: any) => {
          adminData.totalSedekah += (r.sedekahAmount || 0);
          if (r.zakatType === 'HARTA') {
            adminData.totalHarta += r.totalAmount;
          } else {
            adminData.totalFitrah += r.totalAmount;
            const zoneName = r.amil?.mosque?.zone?.name || 'Lain-lain';
            zoneMap.set(zoneName, (zoneMap.get(zoneName) || 0) + r.totalAmount);
          }
        });
        adminData.zoneStats = Array.from(zoneMap.entries()).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
      }`;

c = c.replace(/const \[recentReceipts, stats\] = await Promise\.all\(\[[\s\S]*?_count: \{ id: true \}\s*\}\)\s*\]\);/, replaceData);

c = c.replace(/\{\/\* Main Dashboard Card \*\/\}/, `{user.role === 'ADMIN' ? ( <AdminDashboard data={adminData} currentYear={currentYear} /> ) : ( <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400 rounded-[2rem] p-7 text-white shadow-[0_20px_40px_-15px_rgba(20,184,166,0.5)] mb-10 relative overflow-hidden group">
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
        </div> )}`);

// Remove the old Main Dashboard Card div completely (if it still exists after the inject)
c = c.replace(/<div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400 rounded-\[2rem\] p-7 text-white shadow-\[0_20px_40px_-15px_rgba\(20,184,166,0\.5\)\] mb-10 relative overflow-hidden group">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');

fs.writeFileSync('src/app/page.tsx', c);
console.log('Success replacing via regex');
