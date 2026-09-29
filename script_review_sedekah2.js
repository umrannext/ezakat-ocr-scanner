const fs = require('fs');
let c = fs.readFileSync('src/app/review/page.tsx', 'utf8');

const regex = /<span className="text-\[9px\] font-bold text-amber-800 bg-amber-100 px-1\.5 py-0\.5 rounded-full ml-1\.5">Experimental<\/span>\s*<\/span>\s*<\/label>\s*<\/div>\s*\)\}\s*<\/div>/;

const uiReplace = `<span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full ml-1.5">Experimental</span>
                    </span>
                  </label>
                </div>
              )}

              {!isQuickMode && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <label className="relative flex items-center cursor-pointer select-none mb-3">
                    <input
                      type="checkbox"
                      checked={isSedekah}
                      onChange={e => setIsSedekah(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded-md border-slate-300 focus:ring-purple-500 cursor-pointer accent-purple-600"
                    />
                    <span className="ml-2 text-xs font-bold text-slate-700">
                      Wang baki sebagai sedekah <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full ml-1">Beta</span>
                    </span>
                  </label>
                  
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jumlah Wang Dibayar (Oleh Muzakki)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="Contoh: 10.00"
                        value={isSedekah ? paidAmount : (formData.zakatType === 'HARTA' ? formData.manualTotal : ((formData.dependents + 1) * (riceTypes.find(r => r.id === formData.riceTypeId)?.price || 1.93)).toFixed(2))} 
                        onChange={e => setPaidAmount(e.target.value)}
                        disabled={!isSedekah}
                        className={\`w-full border rounded-lg pl-8 pr-4 py-2 text-sm font-bold outline-none transition-all \${!isSedekah ? 'bg-slate-200 border-slate-300 text-slate-500' : 'bg-white border-purple-300 text-purple-700 focus:ring-2 focus:ring-purple-100 focus:border-purple-500'}\`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>`;

if (regex.test(c)) {
  c = c.replace(regex, uiReplace);
  fs.writeFileSync('src/app/review/page.tsx', c);
  console.log("Success with regex");
} else {
  console.log("Regex not found");
}
