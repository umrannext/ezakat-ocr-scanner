const fs = require('fs');
let content = fs.readFileSync('src/components/AdminSettings.tsx', 'utf8');

// Add gold states
content = content.replace(
  "const [isAdding, setIsAdding] = useState(false);",
  `const [isAdding, setIsAdding] = useState(false);
  const [goldPrice, setGoldPrice] = useState('0');
  const [isSavingGold, setIsSavingGold] = useState(false);`
);

// Fetch gold price
const fetchGold = `
  const fetchGoldPrice = async () => {
    try {
      const res = await fetch('/api/settings/gold');
      if (res.ok) {
        const data = await res.json();
        setGoldPrice(data.price.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };
`;
content = content.replace(
  "useEffect(() => {",
  fetchGold + "\n  useEffect(() => {"
);
content = content.replace(
  "fetchRates();\n  }, []);",
  "fetchRates();\n    fetchGoldPrice();\n  }, []);"
);

// Add handleSaveGold
const saveGold = `
  const handleSaveGold = async () => {
    setIsSavingGold(true);
    try {
      const res = await fetch('/api/settings/gold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(goldPrice) })
      });
      if (res.ok) alert("Harga Emas berjaya dikemaskini!");
    } catch (e) {
      alert("Gagal mengemaskini harga emas");
    }
    setIsSavingGold(false);
  };
`;
content = content.replace(
  "const saveEdit = async",
  saveGold + "\n  const saveEdit = async"
);

// Add UI for Gold Price
const goldUI = `
      <div className="mb-8 bg-amber-50 p-6 rounded-3xl border border-amber-200">
        <h3 className="text-lg font-bold text-amber-900 mb-2">Kadar Zakat Harta (Emas)</h3>
        <p className="text-sm text-amber-700 mb-4">Sila kemaskini harga 1 gram emas (999) semasa. Nisab adalah bersamaan 85 gram emas.</p>
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-amber-700 uppercase mb-1 block">Harga 1 Gram Emas ($)</label>
            <input type="number" step="0.01" value={goldPrice} onChange={e => setGoldPrice(e.target.value)} className="w-full text-lg font-bold p-3 border-2 border-amber-200 rounded-xl focus:border-amber-400 outline-none" />
          </div>
          <div className="flex-1 bg-white p-3 rounded-xl border border-amber-200">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Nisab Zakat Harta (85g)</label>
            <div className="text-lg font-bold text-slate-800">$\\{parseFloat(goldPrice || '0') > 0 ? (parseFloat(goldPrice) * 85).toFixed(2) : '0.00'\\}</div>
          </div>
          <button onClick={handleSaveGold} disabled={isSavingGold} className="bg-amber-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-amber-700 flex items-center gap-2">
            \\{isSavingGold ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />\\}
            Simpan
          </button>
        </div>
      </div>
`;
// Fix escaping in template string above by unescaping where needed, but write_to_file handles strings nicely.
// Wait, I put \\{ and \\} for JSX escapes inside JS template string. I will just fix it cleanly.
content = content.replace(
  "{showAdd && (",
  goldUI.replace(/\\\\/g, '') + "\n      {showAdd && ("
);

fs.writeFileSync('src/components/AdminSettings.tsx', content);
