import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  console.log('Clearing images...');
  const receipts = await prisma.receipt.findMany({ select: { id: true, imageUrl: true, dependentImages: true } });
  let count = 0;
  for (const r of receipts) {
    let needsUpdate = false;
    let newImageUrl = r.imageUrl;
    let newDepImages = r.dependentImages;
    if (r.imageUrl && r.imageUrl.startsWith('data:image')) { newImageUrl = null; needsUpdate = true; }
    if (r.dependentImages && r.dependentImages.some(img => img.startsWith('data:image'))) {
      newDepImages = []; needsUpdate = true;
    }
    if (needsUpdate) {
      await prisma.receipt.update({ where: { id: r.id }, data: { imageUrl: newImageUrl, dependentImages: newDepImages } });
      count++;
    }
  }
  console.log('Cleared images from ' + count + ' receipts.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
