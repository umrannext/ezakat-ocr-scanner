const fs = require('fs');
let c = fs.readFileSync('src/app/api/export/receipts/route.ts', 'utf8');

const targetHeaders = `'Jumlah Zakat ($)',
      'Nama Amil',`;
const replaceHeaders = `'Jumlah Zakat ($)',
      'Sedekah Am ($)',
      'Jumlah Diterima ($)',
      'Timestamp Penuh',
      'Nama Amil',`;

const targetRows = `r.totalAmount.toFixed(2),
      \`"\${r.amil.name}"\`,`;
const replaceRows = `r.totalAmount.toFixed(2),
      (r.sedekahAmount || 0).toFixed(2),
      (r.paidAmount || r.totalAmount).toFixed(2),
      r.createdAt.toISOString(),
      \`"\${r.amil.name}"\`,`;

if (c.includes(targetHeaders)) {
  c = c.replace(targetHeaders, replaceHeaders);
  c = c.replace(targetRows, replaceRows);
  fs.writeFileSync('src/app/api/export/receipts/route.ts', c);
  console.log('Success updating export CSV');
} else {
  console.log('Target not found in export');
}
