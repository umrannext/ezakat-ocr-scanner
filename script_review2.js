const fs = require('fs');
let c = fs.readFileSync('src/app/review/page.tsx', 'utf8');

const regex = /if \(res\.ok && data\.success\) \{\s*sessionStorage\.removeItem\('scannedImage'\);\s*if \(isEReceipt && data\.data\?\.id\) \{\s*setGeneratedReceiptUrl\(\`\$\{\s*window\.location\.origin\s*\}/receipt\/\$\{data\.data\.id\}\`\);\s*return;\s*\}\s*if \(isQuickMode && formData\.zakatType === 'FITRAH'\)/;

if (regex.test(c)) {
  console.log("Matched!");
} else {
  // Let's do a simpler replace
  c = c.replace(/if \(isEReceipt && data\.data\?\.id\) \{\s*setGeneratedReceiptUrl\([^)]+\);\s*return;\s*\}/, `if (isEReceipt && data.data?.id) {\n              setGeneratedReceiptUrl(\`\${window.location.origin}/receipt/\${data.data.id}\`);\n              return;\n            }\n            alert("✅ Berjaya! Data telah disahkan dan disegerakkan (Synced) ke dalam pangkalan data.");`);
  
  c = c.replace(/<h3 className="text-xl font-black text-slate-800 mb-2">Penyimpanan Berjaya!<\/h3>/, `<h3 className="text-xl font-black text-slate-800 mb-2">✅ Disahkan & Synced!</h3>`);
  c = c.replace(/Sila minta pembayar mengimbas Kod QR di bawah untuk memuat turun E-Resit mereka./, `Data telah tersimpan di pangkalan data. Sila minta pembayar mengimbas Kod QR di bawah untuk E-Resit mereka.`);
  
  fs.writeFileSync('src/app/review/page.tsx', c);
  console.log('Success replacing via simpler match');
}
