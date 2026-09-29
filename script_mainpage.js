const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

if (!c.includes('import AdminDashboard')) {
  c = c.replace("import { FileText,", "import AdminDashboard from '@/components/AdminDashboard';\nimport { FileText,");
}

const targetProps = `export default async function Home() {`;
const replaceProps = `export default async function Home(props: { searchParams?: Promise<{ year?: string }> }) {
  const searchParams = await props.searchParams;
  const currentYear = searchParams?.year || '1447H';`;

if (c.includes(targetProps)) {
  c = c.replace(targetProps, replaceProps);
}

const targetData = `const [recentReceipts, stats] = await Promise.all([
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
          _sum: { totalAmount: true },
          _count: { id: true }
        })
      ]);`;

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
        // Fetch specific data for Admin Dashboard
        !isAmil ? prisma.receipt.findMany({
          where: {
            OR: [
              { riceType: { activeYear: currentYear } }, // Fitrah for this year
              { AND: [{ zakatType: 'HARTA' }, { createdAt: { gte: new Date(\`\${currentYear === '1447H' ? 2026 : (currentYear === '1446H' ? 2025 : 2027)}-01-01\`) } }] } // Approximation for Harta
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

if (c.includes(targetData)) {
  c = c.replace(targetData, replaceData);
}

const targetUI = `{/* Main Dashboard Card */}
        <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400 rounded-[2rem] p-7 text-white shadow-[0_20px_40px_-15px_rgba(20,184,166,0.5)] mb-10 relative overflow-hidden group">`;

const replaceUI = `{user.role === 'ADMIN' ? (
          <AdminDashboard data={adminData} currentYear={currentYear} />
        ) : (
          <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400 rounded-[2rem] p-7 text-white shadow-[0_20px_40px_-15px_rgba(20,184,166,0.5)] mb-10 relative overflow-hidden group">`;

const endTargetUI = `</Link>
          </div>
        </div>`;

const endReplaceUI = `</Link>
          </div>
        </div>
        )}`;

if (c.includes(targetUI)) {
  c = c.replace(targetUI, replaceUI);
  c = c.replace(endTargetUI, endReplaceUI);
  fs.writeFileSync('src/app/page.tsx', c);
  console.log("Success updating main page UI");
} else {
  console.log("UI Target not found in main page");
}
