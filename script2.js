const fs = require('fs');
let c = fs.readFileSync('src/components/HistoryClient.tsx', 'utf8');

const regex1 = /\{userRole === 'ADMIN' && \(\s*<div className="flex gap-2">\s*<button\s*onClick=\{\(\) => \{\s*setEditData\(receipt\);\s*setEditId\(receipt\.id\);\s*\}\}\s*className="flex items-center gap-1 px-2\.5 py-1\.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 active:scale-95 transition-all"\s*>\s*<Pencil size=\{13\} \/> Edit\s*<\/button>\s*<button\s*onClick=\{\(\) => setDeleteId\(receipt\.id\)\}\s*className="flex items-center gap-1 px-2\.5 py-1\.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 active:scale-95 transition-all"\s*>\s*<Trash2 size=\{13\} \/> Padam\s*<\/button>\s*<\/div>\s*\)\}/g;

const replace1 = `<div className="flex gap-2">
                      {userRole === 'ADMIN' && (
                        <button 
                          onClick={() => {
                            setEditData(receipt);
                            setEditId(receipt.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 active:scale-95 transition-all"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                      )}
                      <button 
                        onClick={() => setDeleteId(receipt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 active:scale-95 transition-all"
                      >
                        <Trash2 size={13} /> Padam
                      </button>
                    </div>`;

c = c.replace(regex1, replace1);

const regex2 = /\{userRole === 'ADMIN' && \(\s*<div className="flex gap-1\.5">\s*<button\s*onClick=\{\(\) => setEditData\(receipt\)\}\s*className="flex items-center gap-1 px-2\.5 py-1\.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all"\s*>\s*<Edit2 size=\{13\} \/> Edit\s*<\/button>\s*<button\s*onClick=\{\(\) => setDeleteId\(receipt\.id\)\}\s*className="flex items-center gap-1 px-2\.5 py-1\.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 active:scale-95 transition-all"\s*>\s*<Trash2 size=\{13\} \/> Padam\s*<\/button>\s*<\/div>\s*\)\}/g;

const replace2 = `<div className="flex gap-1.5">
                      {userRole === 'ADMIN' && (
                        <button 
                          onClick={() => setEditData(receipt)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all"
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                      )}
                      <button 
                        onClick={() => setDeleteId(receipt.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 active:scale-95 transition-all"
                      >
                        <Trash2 size={13} /> Padam
                      </button>
                    </div>`;

c = c.replace(regex2, replace2);

fs.writeFileSync('src/components/HistoryClient.tsx', c);
console.log("Success");
