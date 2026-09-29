const fs = require('fs');
let c = fs.readFileSync('src/app/review/page.tsx', 'utf8');

c = c.replace(/isWakalah: Boolean\(isWakalah\),/, `isWakalah: Boolean(isWakalah),\n          isSedekah: Boolean(isSedekah),\n          paidAmount: isSedekah ? parseFloat(paidAmount || totalAmount) : parseFloat(totalAmount),\n          sedekahAmount: isSedekah ? Math.max(0, parseFloat(paidAmount || totalAmount) - parseFloat(totalAmount)) : 0,`);

fs.writeFileSync('src/app/review/page.tsx', c);
console.log('Fixed payload');
