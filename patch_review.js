const fs = require('fs');
let content = fs.readFileSync('src/app/review/page.tsx', 'utf8');

// 1. Add zakatType and manualTotal to formData
content = content.replace(
  "dependents: 0,",
  "zakatType: 'FITRAH',\n    manualTotal: '0',\n    dependents: 0,"
);

// 2. Add Harta auto-detect logic in extractData
content = content.replace(
  "let extReceipt = null;",
  "let extReceipt = null;\n      let extZakatType = 'FITRAH';"
);
content = content.replace(
  "detectedPrefix = (extReceiptRaw[1] || '').toUpperCase();",
  "detectedPrefix = (extReceiptRaw[1] || '').toUpperCase();\n         if (!detectedPrefix) { extZakatType = 'HARTA'; }"
);
content = content.replace(
  "payerName: 'SILA KEMASKINI (OCR TULISAN TANGAN)',",
  "payerName: 'SILA KEMASKINI (OCR TULISAN TANGAN)',\n        zakatType: extZakatType,"
);

// 3. Total amount calculation logic
content = content.replace(
  "const totalAmount = ((1 + formData.dependents) * currentPrice).toFixed(2);",
  "const totalAmount = formData.zakatType === 'HARTA' ? formData.manualTotal : ((1 + formData.dependents) * currentPrice).toFixed(2);"
);

// 4. UI Toggle for Zakat Type
const zakatTypeToggle = `
          {/* ZAKAT TYPE TOGGLE */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
            <button 
              type="button"
              onClick={() => setFormData({...formData, zakatType: 'FITRAH'})}
              className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors \${formData.zakatType === 'FITRAH' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}\`}
            >
              Zakat Fitrah
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, zakatType: 'HARTA'})}
              className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-colors \${formData.zakatType === 'HARTA' ? 'bg-white shadow text-amber-600' : 'text-slate-500'}\`}
            >
              Zakat Harta
            </button>
          </div>
`;
content = content.replace(
  `<div className="space-y-4">`,
  `<div className="space-y-4">\n${zakatTypeToggle}`
);

// 5. Hide/Show fields based on Zakat Type
content = content.replace(
  `<div>
              <label className="text-xs font-bold text-slate-500 uppercase">Tahun Zakat</label>`,
  `{formData.zakatType === 'FITRAH' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Tahun Zakat</label>`
);

content = content.replace(
  `</div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Jumlah Tanggungan</label>`,
  `</div>
          )}
          {formData.zakatType === 'FITRAH' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Jumlah Tanggungan</label>`
);

content = content.replace(
  `</select>
            </div>
          </div>`,
  `</select>
            </div>
          )}
          </div>`
);

// 6. If Harta, show input for manual total
const manualTotalUI = `
          {formData.zakatType === 'HARTA' && (
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Jumlah Zakat Harta Dibayar ($)</label>
              <input 
                type="number" step="0.01" 
                value={formData.manualTotal} 
                onChange={(e) => setFormData({...formData, manualTotal: e.target.value})} 
                className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-amber-500"
              />
            </div>
          )}
`;
content = content.replace(
  `{/* TOTAL & SUBMIT */}`,
  `${manualTotalUI}\n          {/* TOTAL & SUBMIT */}`
);

// 7. Update handleSubmit to include zakatType
content = content.replace(
  `totalAmount: parseFloat(totalAmount)`,
  `totalAmount: parseFloat(totalAmount),
        zakatType: formData.zakatType`
);
content = content.replace(
  `if (!formData.riceTypeId) return alert("Pilih jenis beras");`,
  `if (formData.zakatType === 'FITRAH' && !formData.riceTypeId) return alert("Pilih jenis beras");`
);

fs.writeFileSync('src/app/review/page.tsx', content);
