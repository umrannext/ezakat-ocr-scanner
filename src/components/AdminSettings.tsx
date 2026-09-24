"use client";
import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Plus, Edit2, Loader2, Save, X, Coins, Sparkles, CheckCircle2 } from 'lucide-react';

const FALLBACK_RATES = [
  { id: 'fb-1', name: 'Beras Siam', price: 1.93, activeYear: '1447H', code: 'B_SIAM_1447H' },
  { id: 'fb-2', name: 'Beras Wangi', price: 2.84, activeYear: '1447H', code: 'B_WANGI_1447H' },
  { id: 'fb-3', name: 'Beras Siam', price: 1.90, activeYear: '1446H', code: 'B_SIAM_1446H' },
  { id: 'fb-4', name: 'Beras Wangi', price: 2.80, activeYear: '1446H', code: 'B_WANGI_1446H' }
];

export default function AdminSettings() {
  const [rates, setRates] = useState<any[]>(FALLBACK_RATES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');

  const [showAdd, setShowAdd] = useState(false);
  const [newYear, setNewYear] = useState('1448H');
  const [newSiam, setNewSiam] = useState('1.93');
  const [newWangi, setNewWangi] = useState('2.84');
  const [isAdding, setIsAdding] = useState(false);
  
  const [goldPrice, setGoldPrice] = useState('115.00');
  const [isSavingGold, setIsSavingGold] = useState(false);
  const [goldSavedMsg, setGoldSavedMsg] = useState(false);
  const [isSyncingGold, setIsSyncingGold] = useState(false);
  const [goldSyncMsg, setGoldSyncMsg] = useState<string | null>(null);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/rates');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRates(data);
        }
      }
    } catch (e) {
      console.warn('Rates fetch fallback active:', e);
    }
    setIsLoading(false);
  };

  const fetchGoldPrice = async () => {
    try {
      const res = await fetch('/api/settings/gold');
      if (res.ok) {
        const data = await res.json();
        if (data.price && data.price > 0) {
          setGoldPrice(data.price.toString());
        }
      }
    } catch (e) {
      console.warn('Gold price fallback active:', e);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchGoldPrice();
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
        alert(data.message || 'Kadar berjaya diselaraskan!');
        fetchRates();
      } else {
        alert(data.error || 'Ralat penyelarasan');
      }
    } catch (e) {
      alert("Ralat semasa sync kadar MORA.");
    }
    setIsSyncing(false);
  };

  const handleSaveGold = async () => {
    setIsSavingGold(true);
    setGoldSavedMsg(false);
    try {
      const res = await fetch('/api/settings/gold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseFloat(goldPrice) })
      });
      if (res.ok) {
        setGoldSavedMsg(true);
        setTimeout(() => setGoldSavedMsg(false), 3000);
      } else {
        alert("Gagal mengemaskini harga emas");
      }
    } catch (e) {
      alert("Ralat semasa menyimpan harga emas");
    }
    setIsSavingGold(false);
  };

  const handleSyncGold = async () => {
    setIsSyncingGold(true);
    setGoldSyncMsg(null);
    try {
      const res = await fetch('/api/settings/sync-gold', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.price) {
        const formattedPrice = Number(data.price).toFixed(2);
        setGoldPrice(formattedPrice);
        setGoldSyncMsg(data.message || `Harga emas pasaran semasa ($${formattedPrice}/g) berjaya dikesan dan diselaraskan ke dalam medan harga 1 gram emas. Anda boleh adjust nilai ini jika perlu sebelum menyimpan.`);
      } else {
        alert(data.error || 'Gagal menyelaraskan harga emas semasa.');
      }
    } catch (e) {
      alert('Ralat semasa menghubungi pelayan harga emas.');
    }
    setIsSyncingGold(false);
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
      } else {
        alert("Gagal mengemaskini kadar");
      }
    } catch (e) {
      alert("Gagal mengemaskini kadar");
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

  // Group rates by Hijrah year
  const grouped = rates.reduce((acc: any, rate: any) => {
    const yr = rate.activeYear || '1447H';
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(rate);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* 1. SEKSYEN KADAR ZAKAT FITRAH (BERAS) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 p-2.5 rounded-xl text-teal-600">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-lg leading-tight">Kadar Zakat Fitrah (Beras)</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Kadar rasmi Brunei mengikut gred beras dan tahun Hijrah</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-xl transition-colors active:scale-95 shadow-xs"
            >
              <Plus size={14} /> Tambah Tahun
            </button>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync kadar rasmi KHEU"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors active:scale-95 shadow-xs"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin text-teal-600' : ''} /> Sync MORA
            </button>
          </div>
        </div>

        {/* Modal / Form Tambah Tahun Baru */}
        {showAdd && (
          <form onSubmit={handleAddYear} className="mb-6 bg-slate-50 p-5 rounded-2xl border border-teal-200/60 shadow-xs animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={16} className="text-teal-600" />
                Tambah Kadar Tahun Hijrah Baru
              </h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X size={16}/>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tahun Hijrah</label>
                <input required value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="Cth: 1448H" className="w-full text-sm font-bold mt-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Beras Siam ($)</label>
                <input required type="number" step="0.01" value={newSiam} onChange={e => setNewSiam(e.target.value)} className="w-full text-sm font-bold mt-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Beras Wangi ($)</label>
                <input required type="number" step="0.01" value={newWangi} onChange={e => setNewWangi(e.target.value)} className="w-full text-sm font-bold mt-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-400" />
              </div>
            </div>
            <button disabled={isAdding} type="submit" className="w-full bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold text-sm py-3 rounded-xl shadow-sm hover:opacity-95 active:scale-98 transition-all">
              {isAdding ? 'Menyimpan...' : 'Simpan Kadar Tahun Baru'}
            </button>
          </form>
        )}

        {/* Senarai Kadar Zakat Fitrah Mengikut Tahun */}
        <div className="space-y-4">
          {Object.keys(grouped).sort().reverse().map(year => (
            <div key={year} className="border border-slate-200/70 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="bg-gradient-to-r from-teal-50 to-slate-50 px-4 py-2.5 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-teal-800 tracking-wide">TAHUN HIJRAH {year}</span>
                {year === '1447H' && (
                  <span className="bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Semasa
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {grouped[year].map((rate: any) => (
                  <div key={rate.id} className="flex justify-between items-center p-4 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="font-bold text-slate-800 text-sm block">{rate.name}</span>
                      <span className="text-[11px] text-slate-400 font-medium">1 Gantang / Seorang</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingId === rate.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-slate-400">$</span>
                          <input 
                            type="number" 
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-20 text-sm font-bold border border-teal-400 rounded-lg px-2 py-1 text-right focus:ring-2 focus:ring-teal-400 outline-none"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(rate.id)} className="text-teal-700 hover:text-teal-800 bg-teal-100 p-2 rounded-lg transition-colors" title="Simpan">
                            <Save size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-700 bg-slate-100 p-2 rounded-lg transition-colors" title="Batal">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="font-black text-teal-600 text-base">
                            ${Number(rate.price || 0).toFixed(2)}
                          </span>
                          <button 
                            onClick={() => { setEditingId(rate.id); setEditPrice(rate.price.toString()); }}
                            className="text-slate-400 hover:text-teal-600 p-1.5 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit Harga"
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SEKSYEN KADAR ZAKAT HARTA (EMAS & NISAB) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-50 to-orange-50 p-6 rounded-3xl border border-amber-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-xs">
              <Coins size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-950 leading-tight">Kadar Zakat Harta (Emas &amp; Nisab)</h3>
              <p className="text-xs text-amber-800/80 font-medium mt-0.5">
                Nisab zakat harta di Brunei bersamaan 85 gram emas tulen (999).
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleSyncGold}
            disabled={isSyncingGold}
            title="Dapatkan harga emas pasaran semasa untuk diselaraskan ke dalam medan harga"
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3.5 py-2.5 rounded-xl transition-all active:scale-95 shadow-xs border border-amber-300 self-start sm:self-auto cursor-pointer disabled:opacity-60"
          >
            <RefreshCw size={14} className={isSyncingGold ? 'animate-spin text-amber-800' : ''} />
            <span>{isSyncingGold ? 'Menyemak Pasaran...' : 'Sync Harga Emas Semasa'}</span>
          </button>
        </div>

        {goldSyncMsg && (
          <div className="mb-4 bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-semibold p-3.5 rounded-2xl flex items-start gap-2.5 animate-in fade-in">
            <Sparkles size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="leading-relaxed">{goldSyncMsg}</p>
              <p className="text-[10px] text-amber-800/90 font-bold mt-1">
                *Nilai harga 1 gram emas di bawah telah dikemaskini. Anda boleh membuat pelarasan (adjust) secara manual jika perlu sebelum menekan &quot;Simpan Harga Emas&quot;.
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setGoldSyncMsg(null)}
              className="text-amber-700 hover:text-amber-900 p-1 text-xs font-bold"
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {goldSavedMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            Harga emas berjaya disimpan dan nisab dikemaskini!
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-white/70 backdrop-blur-xs p-4 rounded-2xl border border-amber-200/50">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Harga 1 Gram Emas ($)
              </label>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Boleh Adjust
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-3 font-bold text-slate-400 text-sm">$</span>
              <input 
                type="number" 
                step="0.01" 
                value={goldPrice} 
                onChange={e => {
                  setGoldPrice(e.target.value);
                  if (goldSyncMsg) setGoldSyncMsg(null);
                }} 
                className="w-full text-base font-bold pl-8 pr-3 py-2.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all" 
                placeholder="Cth: 115.00"
              />
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200/80">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Nisab Zakat Harta (85g)
            </label>
            <div className="text-xl font-black text-amber-900 mt-1">
              ${parseFloat(goldPrice || '0') > 0 ? (parseFloat(goldPrice) * 85).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>

          <button 
            onClick={handleSaveGold} 
            disabled={isSavingGold} 
            className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold py-3 px-4 rounded-xl hover:from-amber-700 hover:to-amber-800 flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-60"
          >
            {isSavingGold ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Simpan Harga Emas
          </button>
        </div>
      </div>
    </div>
  );
}
