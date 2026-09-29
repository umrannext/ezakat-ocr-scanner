const fs = require('fs');

// 1. Update API route
let api = fs.readFileSync('src/app/api/export/receipts/route.ts', 'utf8');
api = api.replace(/export async function GET\(\) \{/, 'export async function GET(req: Request) {');
api = api.replace(/const receipts = await prisma\.receipt\.findMany\(\{/, `const url = new URL(req.url);
    const year = url.searchParams.get('year');
    const whereClause = year ? {
      OR: [
        { riceType: { activeYear: year } },
        { AND: [{ zakatType: 'HARTA' }] }
      ]
    } : {};

    const receipts = await prisma.receipt.findMany({
      where: whereClause,`);
fs.writeFileSync('src/app/api/export/receipts/route.ts', api);

// 2. Update AdminDashboard component
let comp = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');
comp = comp.replace(/<a href="\/api\/export\/receipts"/, '  <a href={`/api/export/receipts?year=${currentYear}`}');
fs.writeFileSync('src/components/AdminDashboard.tsx', comp);

console.log('Fixed CSV Export Filter');
