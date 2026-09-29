const fs = require('fs');
let c = fs.readFileSync('src/app/api/receipts/route.ts', 'utf8');

const targetUpdate = `          isWakalah: Boolean(data.isWakalah),
          imageUrl: safeImageUrl,
          dependents: isNaN(dependents) ? 0 : dependents,
          paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount`;

const replaceUpdate = `          isWakalah: Boolean(data.isWakalah),
          isSedekah: Boolean(data.isSedekah),
          paidAmount: data.paidAmount || (isNaN(totalAmount) ? 0 : totalAmount),
          sedekahAmount: data.sedekahAmount || 0,
          imageUrl: safeImageUrl,
          dependents: isNaN(dependents) ? 0 : dependents,
          paymentDate: isNaN(paymentDate.getTime()) ? new Date() : paymentDate,
          totalAmount: isNaN(totalAmount) ? 0 : totalAmount`;

c = c.replace(targetUpdate, replaceUpdate);
c = c.replace(targetUpdate, replaceUpdate); // Do it twice for both create and update

fs.writeFileSync('src/app/api/receipts/route.ts', c);
console.log('Success API');
