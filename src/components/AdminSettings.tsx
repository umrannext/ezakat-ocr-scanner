"use client";
import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Plus, Edit2, Loader2, Save, X } from 'lucide-react';

export default function AdminSettings() {
  const [rates, setRates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const [showAdd, setShowAdd] = useState(false);
  const [newYear, setNewYear] = useState('1448H');
  const [newSiam, setNewSiam] = useState('1.93');
  const [newWangi, setNewWangi] = useState('2.84');
  const [isAdding, setIsAdding] = useState(false);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/rates');
      if (res.ok) {
        setRates(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSync = async () => {
    if (!confirm("Adakah anda pasti untuk sync harga rasmi dari laman web KHEU (MORA) untuk tahun 1447H?")) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/settings/sync-rates', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetYear: '1447H' })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchRates();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Ralat semasa sync.");
    }
    setIsSyncing(false);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await fetch('/api/settings/rates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, price: editPrice })
      });
      if (res.ok) {
        setEditingId(null);
        fetchRates();
      }
    } catch (e) {
      alert("Gagal mengemaskini");
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await fetch('/api/settings/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Beras Siam', price: newSiam, activeYear: newYear, code: `B_SIAM_${newYear}` })
      });
      await fetch('/api/settings/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Beras Wangi', price: newWangi, activeYear: newYear, code: `B_WANGI_${newYear}` })
      });
      setShowAdd(false);
      fetchRates();
    } catch (e) {
      alert("Gagal menambah tahun baru");
    }
    setIsAdding(false);
  };

  // Group by year
  const grouped = rates.reduce((acc: any, rate: any) => {
    if (!acc[rate.activeYear]) acc[rate.activeYear] = [];
    acc[rate.activeYear].push(rate);
    return acc;
  }, {});

  return (
    <div className="mt-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-2.5 rounded-xl">
            <Settings size={20} className="text-slate-600" />
          </div>
          <h2 className="font-bold text-slate-800 text-lg">Tetapan Kadar Zakat</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            <Plus size={14} /> Tambah Tahun
          </button>

        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAddYear} className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-700">Tambah Tahun Baru</h3>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tahun</label>
              <input required value={newYear} onChange={e=>setNewYear(e.target.value)} placeholder="Contoh: 1448H" className="w-full text-sm mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Beras Siam ($)</label>
              <input required type="number" step="0.01" value={newSiam} onChange={e=>setNewSiam(e.target.value)} className="w-full text-sm mt-1 p-2 border rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">Beras Wangi ($)</label>
              <input required type="number" step="0.01" value={newWangi} onChange={e=>setNewWangi(e.target.value)} className="w-full text-sm mt-1 p-2 border rounded-xl" />
            </div>
          </div>
          <button disabled={isAdding} type="submit" className="w-full bg-teal-600 text-white font-bold text-sm py-2 rounded-xl">
            {isAdding ? 'Menyimpan...' : 'Simpan Kadar'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-6"><Loader2 className="animate-spin text-slate-400 mx-auto" /></div>
      ) : (
        <div className="space-y-6">
          {Object.keys(grouped).sort().reverse().map(year => (
            <div key={year} className="border border-slate-100 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Tahun {year}</span>
              </div>
              <div>
                {grouped[year].map((rate: any) => (
                  <div key={rate.id} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0">
                    <span className="font-semibold text-slate-700 text-sm">{rate.name}</span>
                    <div className="flex items-center gap-3">
                      {editingId === rate.id ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-20 text-sm border rounded-lg px-2 py-1 text-right focus:ring-1 focus:ring-teal-500 outline-none"
                          />
                          <button onClick={() => saveEdit(rate.id)} className="text-teal-600 hover:text-teal-700 bg-teal-50 p-1.5 rounded-lg"><Save size={16}/></button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-lg"><X size={16}/></button>
                        </div>
                      ) : (
                        <>
                          <span className="font-black text-teal-600">${rate.price.toFixed(2)}</span>
                          <button 
                            onClick={() => { setEditingId(rate.id); setEditPrice(rate.price.toString()); }}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
