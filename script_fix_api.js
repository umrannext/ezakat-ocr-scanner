const fs = require('fs');
let c = fs.readFileSync('src/app/api/receipts/route.ts', 'utf8');

c = c.replace(/isWakalah: Boolean\(data\.isWakalah\),\s*imageUrl: safeImageUrl,\s*dependents: isNaN\(dependents\) \? 0 : dependents,\s*paymentDate: isNaN\(paymentDate\.getTime\(\)\) \? new Date\(\) : paymentDate,\s*totalAmount: isNaN\(totalAmount\) \? 0 : totalAmount/g, 
  `isWakalah: Boolean(data.isWakalah),
          isSedekah: Boolean(data.isSedekah),
          paidAmount: data.paidAmount || (isNaN(totalAmount) ? 0 : totalAmount),
          sedekahAmount: data.sedekahAmount || 0,
          imageUrl: safeImageUrl,
          dependents: isNaN(dependents) ? 0 : dependents,
          paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount`);

fs.writeFileSync('src/app/api/receipts/route.ts', c);
console.log('Fixed API route');
