"use client";
import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, SlidersHorizontal, Edit2, Trash2, 
  AlertCircle, Loader2, X, Eye, Download, ExternalLink, Image as ImageIcon, RefreshCw 
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HistoryClient({ 
  initialReceipts = [], 
  userRole: initialRole = 'AMIL' 
}: { 
  initialReceipts?: any[], 
  userRole?: string 
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  
  const [receipts, setReceipts] = useState<any[]>(initialReceipts);
  const [userRole, setUserRole] = useState(initialRole);
  const [loading, setLoading] = useState(initialReceipts.length === 0);
  const [error, setError] = useState<string | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [editData, setEditData] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [previewReceipt, setPreviewReceipt] = useState<any | null>(null);

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/receipts?limit=80');
      const json = await res.json();
      if (res.ok && json.success) {
        setReceipts(json.data || []);
        if (json.userRole) setUserRole(json.userRole);
      } else {
        setError(json.error || 'Gagal memuatkan rekod resit.');
      }
    } catch (err: any) {
      setError('Ralat sambungan. Sila semak sambungan internet anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialReceipts.length === 0) {
      fetchReceipts();
    }
  }, []);

  let filtered = receipts.filter(r => 
    r.payerName.toLowerCase().includes(search.toLowerCase()) || 
    r.receiptNumber.toLowerCase().includes(search.toLowerCase())
  );

  filtered = filtered.sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    if (sortBy === 'date_asc') return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
    if (sortBy === 'amount_desc') return b.totalAmount - a.totalAmount;
    if (sortBy === 'amount_asc') return a.totalAmount - b.totalAmount;
    return 0;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/receipts/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        setReceipts(prev => prev.filter(r => r.id !== deleteId));
        setDeleteId(null);
        router.refresh(); // Update server counts if any
      } else {
        alert("Gagal memadam rekod.");
      }
    } catch(err) {
      alert("Ralat sistem.");
    }
    setIsDeleting(false);
  };

  const handleEditSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    
    // Auto-calculate new total based on modified dependents for FITRAH, or keep amount for HARTA
    const isHarta = editData.zakatType === 'HARTA';
    const ricePrice = editData.riceType?.price || 1.93;
    const newTotal = isHarta
      ? (parseFloat(editData.totalAmount) || 0)
      : (1 + editData.dependents) * ricePrice;
    
    try {
      const res = await fetch(`/api/receipts/${editData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerName: editData.payerName,
          receiptNumber: editData.receiptNumber,
          dependents: isHarta ? 0 : editData.dependents,
          totalAmount: newTotal
        })
      });
      
      if (res.ok) {
        const { data } = await res.json();
        setReceipts(prev => prev.map(r => r.id === data.id ? { ...r, ...data } : r));
        setEditData(null);
        router.refresh();
      } else {
        alert("Gagal mengemaskini.");
      }
    } catch (err) {
      alert("Ralat sistem.");
    }
    setIsSaving(false);
  };

  return (
    <div>
      {/* Header Bar Konsisten & Responsif */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <h1 className="font-bold text-slate-800 ml-2 tracking-tight text-lg">Rekod Keseluruhan</h1>
        <div className="flex items-center gap-2 mr-1">
          <button 
            type="button"
            onClick={fetchReceipts}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-teal-600 active:rotate-180 transition-all disabled:opacity-50"
            title="Muat semula rekod"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-teal-600" : ""} />
          </button>
          <div className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">
            {filtered.length} Rekod
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex gap-2 mb-6">
          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 flex-1 transition-all focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
            <Search className="text-slate-400 shrink-0" size={20} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Resit / Nama..." 
              className="w-full bg-transparent outline-none text-sm font-semibold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
            />
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center px-3 relative min-w-[50px]">
            <SlidersHorizontal className="text-teal-600 absolute left-3 pointer-events-none" size={20} />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
            >
              <option value="date_desc">Tarikh (Terbaru)</option>
              <option value="date_asc">Tarikh (Lama)</option>
              <option value="amount_desc">Jumlah (Tertinggi)</option>
              <option value="amount_asc">Jumlah (Terendah)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 px-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {filtered.length} Rekod Dijumpai
          </p>
          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">
            {sortBy.includes('date') ? 'Susunan Tarikh' : 'Susunan Jumlah'}
          </span>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                  </div>
                  <div className="w-16 h-6 bg-slate-100 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <AlertCircle size={32} className="text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-amber-800">{error}</p>
              <button
                type="button"
                onClick={fetchReceipts}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all shadow-sm"
              >
                Cuba Semula
              </button>
            </div>
          ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100/50 flex flex-col items-center justify-center mt-4">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <FileText className="text-slate-300" size={40} />
            </div>
            <p className="text-slate-600 text-sm font-bold">Tiada rekod ditemui.</p>
            <p className="text-slate-400 text-xs mt-2 font-medium">Cuba gunakan kata kunci carian lain.</p>
          </div>
        ) : (
          filtered.map((receipt) => {
            const isHarta = receipt.zakatType === 'HARTA';
            return (
              <div key={receipt.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100/50 relative group transition-shadow hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3.5 items-center overflow-hidden">
                    {receipt.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewReceipt(receipt)}
                        className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 relative group/thumb shadow-xs active:scale-95 transition-transform bg-slate-900"
                        title="Klik untuk lihat gambar resit asal"
                      >
                        <img src={receipt.imageUrl} alt="Resit" className="w-full h-full object-cover opacity-90 group-hover/thumb:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye size={16} className="text-white drop-shadow" />
                        </div>
                      </button>
                    ) : (
                      <div className={`p-3 rounded-xl shrink-0 transition-colors ${
                        isHarta ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-500'
                      }`}>
                        <FileText size={20} />
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-800 text-sm truncate pr-2">{receipt.payerName || 'Pembayar Zakat'}</p>
                        {isHarta && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-300 shrink-0">
                            HARTA
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium tracking-wide flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold whitespace-nowrap font-mono ${isHarta ? 'text-red-600' : 'text-slate-700'}`}>
                          {receipt.receiptNumber}
                        </span>
                        <span className="text-slate-300">•</span>
                        {isHarta ? (
                          <span className="text-amber-800 font-bold text-[10px]">5-Angka Merah</span>
                        ) : (
                          <span className="whitespace-nowrap"><span className="text-teal-600 font-bold">{receipt.dependents === 0 ? 'Tiada' : receipt.dependents}</span> Tgn</span>
                        )}
                      </p>
                      {userRole === 'ADMIN' && receipt.amil && (
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest bg-slate-50 inline-block px-1.5 py-0.5 rounded border border-slate-100">
                          {receipt.amil.loginId}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0 ml-2">
                    <span className={`inline-block text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm ${
                      isHarta
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-800'
                        : 'bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/50 text-teal-700'
                    }`}>
                      {isHarta ? 'Zakat Harta' : (receipt.riceType?.name || 'Zakat Fitrah')}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium tracking-wide">
                      {new Date(receipt.paymentDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className={`text-xs font-black mt-1 ${isHarta ? 'text-amber-800' : 'text-teal-600'}`}>
                      ${receipt.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              
              {/* Footer Tindakan: Lihat Resit & Edit/Padam */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                {receipt.imageUrl ? (
                  <button 
                    type="button"
                    onClick={() => setPreviewReceipt(receipt)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-50/80 hover:bg-teal-100 text-teal-700 font-bold active:scale-95 transition-all"
                  >
                    <Eye size={14} className="text-teal-600" />
                    <span>Lihat Resit</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-300 italic">Tiada foto resit</span>
                )}

                {userRole === 'ADMIN' && (
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => setEditData(receipt)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 active:scale-95 transition-all"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button 
                      onClick={() => setDeleteId(receipt.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 active:scale-95 transition-all"
                    >
                      <Trash2 size={13} /> Padam
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-center text-slate-800">Padam Rekod?</h3>
            <p className="text-sm text-center text-slate-500 mt-2 font-medium mb-6">Tindakan ini tidak boleh diundur. Adakah anda pasti?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="w-1/2 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-95">
                Batal
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="w-1/2 bg-red-600 text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 active:scale-95">
                {isDeleting ? <Loader2 className="animate-spin" size={18}/> : 'Ya, Padam'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">Kemaskini Rekod</h3>
              <button onClick={() => setEditData(null)} className="text-slate-400 p-1 bg-slate-50 rounded-full hover:bg-slate-100"><X size={20}/></button>
            </div>
            
            <div className="space-y-4 overflow-y-auto pb-4 pr-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">No. Resit</label>
                <input 
                  type="text" 
                  value={editData.receiptNumber}
                  onChange={e => setEditData({...editData, receiptNumber: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Pembayar</label>
                <input 
                  type="text" 
                  value={editData.payerName}
                  onChange={e => setEditData({...editData, payerName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500"
                />
              </div>
              {editData.zakatType === 'HARTA' ? (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-amber-800 uppercase tracking-widest ml-1">Jumlah Bayaran Zakat Harta ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={editData.totalAmount}
                    onChange={e => setEditData({...editData, totalAmount: e.target.value})}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-xl px-4 py-3 text-base font-black text-amber-950 outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-amber-700 font-medium ml-1 mt-1">*Resit Zakat Harta (5-Angka) tidak mempunyai tanggungan.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Bil. Tanggungan</label>
                  <select 
                    value={editData.dependents}
                    onChange={e => setEditData({...editData, dependents: parseInt(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-teal-500"
                  >
                    {[...Array(21)].map((_, i) => (
                      <option key={i} value={i}>{i === 0 ? "Tiada Tanggungan" : `${i} Orang`}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-teal-600 font-medium ml-1 mt-1">*Jumlah keseluruhan akan dikira semula secara automatik.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditData(null)} className="w-1/3 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-95">
                Batal
              </button>
              <button 
                onClick={handleEditSave} 
                disabled={isSaving} 
                className={`w-2/3 font-bold py-3.5 rounded-xl shadow-lg flex justify-center items-center gap-2 active:scale-95 ${
                  editData.zakatType === 'HARTA' ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black' : 'bg-teal-600 text-white'
                }`}
              >
                {isSaving ? <Loader2 className="animate-spin" size={18}/> : 'Simpan Kemaskini'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Preview Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className={`text-base font-extrabold font-mono ${previewReceipt.zakatType === 'HARTA' ? 'text-red-600' : 'text-slate-800'}`}>
                  {previewReceipt.receiptNumber}
                </h3>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                  {previewReceipt.payerName || 'Pembayar Zakat'}
                </p>
              </div>
              <button 
                onClick={() => setPreviewReceipt(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 active:scale-90 transition-all"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Receipt Image Display */}
            <div className="my-3 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[50vh] relative group">
              <img 
                src={previewReceipt.imageUrl} 
                alt={`Resit ${previewReceipt.receiptNumber}`}
                className="w-full h-auto max-h-[50vh] object-contain rounded-xl"
              />
            </div>

            {/* Ringkasan Maklumat */}
            <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1.5 mb-3 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Jenis Zakat:</span>
                <span className="font-bold text-slate-700">
                  {previewReceipt.zakatType === 'HARTA' ? 'Zakat Harta' : (previewReceipt.riceType?.name || 'Zakat Fitrah')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Jumlah Bayaran:</span>
                <span className={`font-black text-sm ${previewReceipt.zakatType === 'HARTA' ? 'text-amber-800' : 'text-teal-700'}`}>
                  ${previewReceipt.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Tarikh:</span>
                <span className="font-semibold text-slate-600">
                  {new Date(previewReceipt.paymentDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Action Buttons: Buka Penuh & Muat Turun */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const win = window.open();
                  if (win) {
                    win.document.write(`<title>Resit ${previewReceipt.receiptNumber}</title><body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;"><img src="${previewReceipt.imageUrl}" style="max-width:100%;height:auto;border-radius:8px;" /></body>`);
                  }
                }}
                className="w-1/2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink size={14} />
                <span>Buka Imej</span>
              </button>

              <a
                href={previewReceipt.imageUrl}
                download={`Resit_${previewReceipt.receiptNumber.replace(/\s+/g, '_')}.jpg`}
                className="w-1/2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-center"
              >
                <Download size={14} />
                <span>Muat Turun</span>
              </a>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}
