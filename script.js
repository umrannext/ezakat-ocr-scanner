const fs = require('fs');
let c = fs.readFileSync('src/components/HistoryClient.tsx', 'utf8');

const target = `<p className="text-sm text-center text-slate-500 mt-2 font-medium mb-6">Tindakan ini tidak boleh diundur. Adakah anda pasti?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="w-1/2 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-95">
                  Batal
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="w-1/2 bg-red-600 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 active:scale-95">`;

const replace = `<p className="text-sm text-center text-slate-500 mt-2 font-medium mb-4">Tindakan ini tidak boleh diundur. Sila taip <span className="font-bold text-slate-800">padam</span> untuk mengesahkan.</p>
              <input type="text" placeholder="Taip padam di sini" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} className="w-full mb-6 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all lowercase" />
              <div className="flex gap-3">
                <button onClick={() => { setDeleteId(null); setDeleteConfirmText(''); }} className="w-1/2 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-95">
                  Batal
                </button>
                <button onClick={handleDelete} disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'padam'} className="w-1/2 bg-red-600 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-opacity">`;

if(c.includes(target)) {
  fs.writeFileSync('src/components/HistoryClient.tsx', c.replace(target, replace));
  console.log("Success");
} else {
  // Try regex if whitespace is weird
  const regex = /<p className="text-sm text-center text-slate-500 mt-2 font-medium mb-6">Tindakan ini tidak boleh diundur\. Adakah anda pasti\?<\/p>[\s\S]*?<button onClick=\{handleDelete\} disabled=\{isDeleting\} className="w-1\/2 bg-red-600 text-white font-bold py-3\.5 rounded-xl flex justify-center items-center gap-2 active:scale-95">/;
  if (regex.test(c)) {
    fs.writeFileSync('src/components/HistoryClient.tsx', c.replace(regex, replace));
    console.log("Success with Regex");
  } else {
    console.log("Target not found!");
  }
}
