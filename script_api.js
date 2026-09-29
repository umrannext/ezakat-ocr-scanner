const fs = require('fs');
let c = fs.readFileSync('src/app/api/receipts/route.ts', 'utf8');

const target = `const created = await prisma.receipt.create({
        data: {
          receiptNumber: data.receiptNumber,
          payerName: data.payerName,
          payerIcNumber: data.payerIcNumber,
          isVerified: data.isVerified || false,
          isWakalah: data.isWakalah || false,
          imageUrl: data.imageUrl,
          dependents: data.dependents || 0,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          totalAmount: data.totalAmount,
          zakatType: data.zakatType || 'FITRAH',
          riceTypeId: data.riceTypeId,
          amilId: data.amilId
        },
        include: { riceType: true }
      });`;

const replace = `const created = await prisma.receipt.create({
        data: {
          receiptNumber: data.receiptNumber,
          payerName: data.payerName,
          payerIcNumber: data.payerIcNumber,
          isVerified: data.isVerified || false,
          isWakalah: data.isWakalah || false,
          isSedekah: data.isSedekah || false,
          paidAmount: data.paidAmount || data.totalAmount,
          sedekahAmount: data.sedekahAmount || 0,
          imageUrl: data.imageUrl,
          dependents: data.dependents || 0,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
          totalAmount: data.totalAmount,
          zakatType: data.zakatType || 'FITRAH',
          riceTypeId: data.riceTypeId,
          amilId: data.amilId
        },
        include: { riceType: true }
      });`;

if (c.includes(target)) {
  c = c.replace(target, replace);
  fs.writeFileSync('src/app/api/receipts/route.ts', c);
  console.log("Success updating api/receipts/route.ts");
} else {
  console.log("Target not found");
}
