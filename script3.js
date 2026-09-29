const fs = require('fs');
let c = fs.readFileSync('src/app/api/receipts/[id]/route.ts', 'utf8');

const target = `export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { id } = await params;
    await prisma.receipt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memadam rekod' }, { status: 500 });
  }
}`;

const replace = `export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const amilId = (await cookies()).get('auth_token')?.value;
  if (!amilId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { id } = await params;
    
    const user = await prisma.user.findUnique({ where: { id: amilId } });
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    
    if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    if (user?.role !== 'ADMIN' && receipt.amilId !== amilId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    await prisma.receipt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memadam rekod' }, { status: 500 });
  }
}`;

if(c.includes(target)) {
  fs.writeFileSync('src/app/api/receipts/[id]/route.ts', c.replace(target, replace));
  console.log("Success");
} else {
  console.log("Not found");
}
