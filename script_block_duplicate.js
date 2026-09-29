const fs = require('fs');

let c = fs.readFileSync('src/app/api/receipts/route.ts', 'utf8');

const targetUpsert = `// 5. Gunakan upsert: Jika no. resit telah wujud, kemaskini rekod tersebut (elak ralat P2002 Unique Constraint)
      const receipt = await prisma.receipt.upsert({
        where: { receiptNumber: receiptNumber },
        update: {
          payerName: payerName,
          zakatType: data.zakatType || 'FITRAH',
          riceTypeId: validRiceTypeId,
          amilId: user.id,
          payerIcNumber: payerIcNumber,
          isVerified: Boolean(data.isVerified && !data.isQuickMode),
          isWakalah: Boolean(data.isWakalah),
          isSedekah: Boolean(data.isSedekah),
          paidAmount: data.paidAmount || (isNaN(totalAmount) ? 0 : totalAmount),
          sedekahAmount: data.sedekahAmount || 0,
          imageUrl: safeImageUrl,
          dependents: isNaN(dependents) ? 0 : dependents,
          paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount
        },
        create: {
          receiptNumber: receiptNumber,
          payerName: payerName,
          zakatType: data.zakatType || 'FITRAH',
          riceTypeId: validRiceTypeId,
          amilId: user.id,
          payerIcNumber: payerIcNumber,
          isVerified: Boolean(data.isVerified && !data.isQuickMode),
          isWakalah: Boolean(data.isWakalah),
          isSedekah: Boolean(data.isSedekah),
          paidAmount: data.paidAmount || (isNaN(totalAmount) ? 0 : totalAmount),
          sedekahAmount: data.sedekahAmount || 0,
          imageUrl: safeImageUrl,
          dependents: isNaN(dependents) ? 0 : dependents,
          paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount
        }
      });`;

const replacement = `// 5. Semak jika no. resit telah wujud untuk elak pendua (duplicate)
      const existingReceipt = await prisma.receipt.findUnique({
        where: { receiptNumber: receiptNumber }
      });
      
      if (existingReceipt) {
        return NextResponse.json({ 
          success: false, 
          error: \`Nombor resit \${receiptNumber} telah pun wujud di dalam sistem! Sila elakkan mengimbas resit yang sama.\`
        }, { status: 400 });
      }

      // 6. Cipta rekod baharu
      const receipt = await prisma.receipt.create({
        data: {
          receiptNumber: receiptNumber,
          payerName: payerName,
          zakatType: data.zakatType || 'FITRAH',
          riceTypeId: validRiceTypeId,
          amilId: user.id,
          payerIcNumber: payerIcNumber,
          isVerified: Boolean(data.isVerified && !data.isQuickMode),
          isWakalah: Boolean(data.isWakalah),
          isSedekah: Boolean(data.isSedekah),
          paidAmount: data.paidAmount || (isNaN(totalAmount) ? 0 : totalAmount),
          sedekahAmount: data.sedekahAmount || 0,
          imageUrl: safeImageUrl,
          dependents: isNaN(dependents) ? 0 : dependents,
          paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount
        }
      });`;

// Try exact match first
if (c.includes(targetUpsert)) {
  c = c.replace(targetUpsert, replacement);
  fs.writeFileSync('src/app/api/receipts/route.ts', c);
  console.log("Success with exact match");
} else {
  // Try regex if spacing differs
  const regex = /\/\/\s*5\.\s*Gunakan upsert:[\s\S]*?create:\s*\{[\s\S]*?\}\s*\}\);/;
  if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/app/api/receipts/route.ts', c);
    console.log("Success with regex match");
  } else {
    console.log("Failed to find target");
  }
}
