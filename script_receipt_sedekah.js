const fs = require('fs');
let c = fs.readFileSync('src/app/receipt/[id]/page.tsx', 'utf8');

const regex = /<div className="p-6 relative bg-slate-800 text-white rounded-b-2xl print:bg-white print:text-black print:border-t-2 print:border-slate-800 print:rounded-none">\s*<div className="flex justify-between items-center">\s*<span className="text-sm font-bold text-slate-300 print:text-slate-500 uppercase tracking-widest">Jumlah Bayaran<\/span>\s*<span className="text-3xl font-black">\$\{receipt\.totalAmount\.toFixed\(2\)\}<\/span>\s*<\/div>\s*<\/div>/;

const replace = `{receipt.sedekahAmount > 0 ? (
              <div className="p-6 relative bg-slate-800 text-white rounded-b-2xl print:bg-white print:text-black print:border-t-2 print:border-slate-800 print:rounded-none">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-slate-400 print:text-slate-500">Zakat {isHarta ? 'Harta' : 'Fitrah'}</span>
                  <span className="text-lg font-bold">\${receipt.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-600 print:border-slate-300">
                  <span className="text-sm font-bold text-slate-400 print:text-slate-500">Sedekah Am</span>
                  <span className="text-lg font-bold">\${receipt.sedekahAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-300 print:text-slate-500 uppercase tracking-widest">Jumlah Diterima</span>
                  <span className="text-3xl font-black">\${receipt.paidAmount?.toFixed(2) || (receipt.totalAmount + receipt.sedekahAmount).toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 relative bg-slate-800 text-white rounded-b-2xl print:bg-white print:text-black print:border-t-2 print:border-slate-800 print:rounded-none">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-300 print:text-slate-500 uppercase tracking-widest">Jumlah Bayaran</span>
                  <span className="text-3xl font-black">\${receipt.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}`;

if (regex.test(c)) {
  c = c.replace(regex, replace);
  fs.writeFileSync('src/app/receipt/[id]/page.tsx', c);
  console.log("Success updating receipt page");
} else {
  console.log("Regex not found in receipt page");
}
