const fs = require('fs');
let c = fs.readFileSync('src/app/page.tsx', 'utf8');

c = c.replace(/let receipts: any\[\] = \[\];\s*let totalAmount = 0;\s*let totalReceipts = 0;/, `let receipts: any[] = [];
  let totalAmount = 0;
  let totalReceipts = 0;
  let adminData = { totalFitrah: 0, totalHarta: 0, totalSedekah: 0, zoneStats: [] as any[] };
  let recentReceipts: any[] = [];`);

c = c.replace(/const \[recentReceipts, stats, adminReceipts\] = await Promise.all/, `const [fetchedRecentReceipts, stats, adminReceipts] = await Promise.all`);
c = c.replace(/recentReceipts = fetchedRecentReceipts;/g, ''); // just in case
c = c.replace(/let adminData = \{ totalFitrah: 0, totalHarta: 0, totalSedekah: 0, zoneStats: \[\] as any\[\] \};\s*if \(\!isAmil\) \{/, `recentReceipts = fetchedRecentReceipts;\n      if (!isAmil) {`);

fs.writeFileSync('src/app/page.tsx', c);

let r = fs.readFileSync('src/app/review/page.tsx', 'utf8');
r = r.replace(/const \[isEReceipt, setIsEReceipt\] = useState\(false\);/, `const [isEReceipt, setIsEReceipt] = useState(false);\n    const [isSedekah, setIsSedekah] = useState(false);\n    const [paidAmount, setPaidAmount] = useState('');`);
fs.writeFileSync('src/app/review/page.tsx', r);

console.log('Fixed scope issues');
