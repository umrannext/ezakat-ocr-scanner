const fs = require('fs');
let c = fs.readFileSync('src/app/scan/page.tsx', 'utf8');

// Update Zakat Harta Icon
c = c.replace(/<div className="w-12 h-12 rounded-xl bg-amber-500\/25 border border-amber-400\/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">\s*🪙\s*<\/div>/, `<div className="w-12 h-12 rounded-xl bg-amber-500/25 border border-amber-400/30 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shrink-0 gap-0.5">\n                    💵🪙\n                  </div>`);

// Update Quick Scan Theme
c = c.replace(/className=\{\`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3\.5 group active:scale-\[0\.98\] transition-all \$\{\n\s*isQuickMode && receiptType === 'FITRAH'\n\s*\? 'bg-amber-500\/25 border-amber-400 shadow-xl shadow-amber-500\/20'\n\s*: 'bg-white\/5 border-white\/10 hover:bg-white\/10 hover:border-amber-400\/50'\n\s*\}\`\}/, `className={\`w-full p-4 rounded-2xl border-2 text-left flex items-center gap-3.5 group active:scale-[0.98] transition-all \${
                    isQuickMode && receiptType === 'FITRAH'
                      ? 'bg-purple-600/30 border-purple-400 shadow-xl shadow-purple-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/50'
                  }\`}`);

// Update Quick Scan Icon Box
c = c.replace(/<div className="w-12 h-12 rounded-xl bg-amber-500\/30 border border-amber-400\/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0">\s*⚡\s*<\/div>/, `<div className="w-12 h-12 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0 drop-shadow-md">\n                    ⚡\n                  </div>`);

// Update Quick Scan Badge
c = c.replace(/<span className="text-\[10px\] font-black text-amber-950 bg-amber-400 px-2 py-0\.5 rounded-full">\s*Arkib Pukal\s*<\/span>/, `<span className="text-[10px] font-black text-purple-950 bg-yellow-400 px-2 py-0.5 rounded-full">\n                          Arkib Pukal\n                        </span>`);

// Update Quick Scan Active Badge
c = c.replace(/\{isQuickMode && receiptType === 'FITRAH' && \(\s*<span className="text-\[10px\] font-bold text-amber-300 bg-amber-500\/30 px-2 py-0\.5 rounded-full border border-amber-400\/30">\s*Aktif\s*<\/span>\s*\)\}/, `{isQuickMode && receiptType === 'FITRAH' && (
                        <span className="text-[10px] font-bold text-purple-300 bg-purple-500/30 px-2 py-0.5 rounded-full border border-purple-400/30">
                          Aktif
                        </span>
                      )}`);

// Update Quick Scan subtext color
c = c.replace(/<p className="text-\[11px\] text-amber-200\/90 font-medium truncate mt-0\.5">\s*Khas resit fitrah lama \(Abaikan nama, IC &amp; tarikh\)\s*<\/p>/, `<p className="text-[11px] text-purple-200/90 font-medium truncate mt-0.5">\n                      Khas resit fitrah lama (Abaikan nama, IC &amp; tarikh)\n                    </p>`);

// Also update the small badge outside the modal
c = c.replace(/isQuickMode && receiptType === 'FITRAH'\n\s*\? 'bg-amber-500\/30 border-amber-400 text-amber-300 hover:bg-amber-500\/40'/, `isQuickMode && receiptType === 'FITRAH'
                      ? 'bg-purple-500/40 border-purple-400 text-purple-200 hover:bg-purple-500/50'`);

fs.writeFileSync('src/app/scan/page.tsx', c);
console.log("Success");
