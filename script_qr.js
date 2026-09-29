const fs = require('fs');
let c = fs.readFileSync('src/app/receipt/[id]/page.tsx', 'utf8');

// Import QRDisplay at the top
if (!c.includes('import QRDisplay')) {
  c = c.replace("import Link from 'next/link';", "import Link from 'next/link';\nimport QRDisplay from '@/components/QRDisplay';\nimport { headers } from 'next/headers';");
}

// Add QR code block
const target = `<div className="p-6 relative bg-slate-800 text-white rounded-b-2xl print:bg-white print:text-black print:border-t-2 print:border-slate-800 print:rounded-none">`;
const replace = `<div className="p-6 flex flex-col items-center justify-center border-t border-dashed border-slate-300">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Imbas untuk versi E-Resit</span>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <QRDisplay url={\`https://ezakat-ocr-scanner-v2.umrannext.workers.dev/receipt/\${receipt.id}\`} />
              </div>
            </div>
            
            <div className="p-6 relative bg-slate-800 text-white rounded-b-2xl print:bg-white print:text-black print:border-t-2 print:border-slate-800 print:rounded-none">`;

if (c.includes(target)) {
  c = c.replace(target, replace);
  fs.writeFileSync('src/app/receipt/[id]/page.tsx', c);
  console.log('Success adding QR to receipt');
} else {
  console.log('Target not found in receipt page');
}
