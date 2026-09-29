const fs = require('fs');
let c = fs.readFileSync('src/app/review/page.tsx', 'utf8');

const target = `if (res.ok && data.success) {
            sessionStorage.removeItem('scannedImage');
            if (isEReceipt && data.data?.id) {
              setGeneratedReceiptUrl(\`\${window.location.origin}/receipt/\${data.data.id}\`);
              return;
            }
            if (isQuickMode && formData.zakatType === 'FITRAH') {`;

const replace = `if (res.ok && data.success) {
            sessionStorage.removeItem('scannedImage');
            
            // Tunjuk status success 'Synced' untuk kedua-dua mod
            if (isEReceipt && data.data?.id) {
              setGeneratedReceiptUrl(\`\${window.location.origin}/receipt/\${data.data.id}\`);
              return;
            }
            
            alert("✅ Berjaya! Data telah disahkan dan disegerakkan (Synced) ke dalam pangkalan data.");
            
            if (isQuickMode && formData.zakatType === 'FITRAH') {`;

if (c.includes(target)) {
  c = c.replace(target, replace);
  
  // Update wording in QR Modal
  const qrTarget = `<h3 className="text-xl font-black text-slate-800 mb-2">Penyimpanan Berjaya!</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                Sila minta pembayar mengimbas Kod QR di bawah untuk memuat turun E-Resit mereka.
              </p>`;
  const qrReplace = `<h3 className="text-xl font-black text-slate-800 mb-2">✅ Disahkan & Synced!</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                Data telah tersimpan di pangkalan data. Sila minta pembayar mengimbas Kod QR di bawah untuk E-Resit mereka.
              </p>`;
  c = c.replace(qrTarget, qrReplace);
  
  fs.writeFileSync('src/app/review/page.tsx', c);
  console.log('Success updating review page');
} else {
  console.log('Target not found in review page');
}
