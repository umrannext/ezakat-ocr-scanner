"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js';
import { Loader2, CheckCircle2, AlertCircle, Save, ArrowLeft } from 'lucide-react';

export default function ReviewPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [riceTypes, setRiceTypes] = useState<any[]>([]);
  
    const [formData, setFormData] = useState({
    receiptNumber: '',
    payerName: '',
    riceTypeId: '',
    icNumber: '',
    isVerified: false,
    zakatType: 'FITRAH',
    manualTotal: '0',
    dependents: 0, 
    paymentDate: new Date().toISOString().split('T')[0],
    zakatYear: '1447H' // default current year
  });

  // Extract unique years from rice types
  const availableYears = Array.from(new Set(riceTypes.map(r => r.activeYear))).sort().reverse();
  const filteredRiceTypes = riceTypes.filter(r => r.activeYear === formData.zakatYear);

  useEffect(() => {
    const fetchRiceTypes = async () => {
      try {
        const res = await fetch('/api/rice-types');
        const data = await res.json();
        setRiceTypes(data);
        if (data.length > 0) {
           // set default based on first item
           const defaultYear = data[0].activeYear;
           const yearItems = data.filter((r: any) => r.activeYear === defaultYear);
           setFormData(prev => ({ ...prev, zakatYear: defaultYear, riceTypeId: yearItems[0]?.id || '' }));
        }
      } catch (err) {
        console.error("Failed to fetch rice types", err);
      }
    };
    fetchRiceTypes();
  }, []);

  const selectedRice = filteredRiceTypes.find(r => r.id === formData.riceTypeId);
  const currentPrice = selectedRice ? selectedRice.price : 0;
  const totalAmount = formData.zakatType === 'HARTA' ? formData.manualTotal : ((1 + formData.dependents) * currentPrice).toFixed(2);

  useEffect(() => {
    const savedImage = sessionStorage.getItem('scannedImage');
    if (!savedImage) {
      router.push('/scan');
      return;
    }
    setImage(savedImage);
    extractData(savedImage);
  }, [router, riceTypes]); // re-run if riceTypes loads after image? Actually just extractData when image loads.

  // To prevent multiple extractions, we can use a ref or state, but for MVP it's fine.
  const [extracted, setExtracted] = useState(false);
  
  const extractData = async (base64Image: string) => {
    if (extracted || riceTypes.length === 0) return;
    setExtracted(true);
    
    try {
      const result = await Tesseract.recognize(base64Image, 'eng+msa', {
        logger: m => console.log(m)
      });
      
      const text = result.data.text;

      let extReceiptRaw = text.match(/\b(EW|CS)?\s*(\d{5,10})\b/i);
      let extReceipt = null;
      let extZakatType = 'FITRAH';
      let detectedPrefix = '';
      if (extReceiptRaw) {
         detectedPrefix = (extReceiptRaw[1] || '').toUpperCase();
         if (!detectedPrefix) { extZakatType = 'HARTA'; }
         extReceipt = (detectedPrefix ? detectedPrefix + ' ' : '') + extReceiptRaw[2];
      }
      
      // Auto detect year (Hijri or Gregorian)
      let extYear = formData.zakatYear;
      const hijriMatch = text.match(/(14\d{2})H?/i);
      if (hijriMatch) {
         extYear = hijriMatch[1] + "H";
      }

      // Filter rice types by detected year
      const yearRices = riceTypes.filter(r => r.activeYear === extYear) || riceTypes.filter(r => r.activeYear === formData.zakatYear);
      let extRiceId = yearRices.length > 0 ? yearRices[0].id : formData.riceTypeId;
      
      if (yearRices.length > 0) {
        if (detectedPrefix === 'EW' || text.toLowerCase().includes('wangi')) {
          const wangi = yearRices.find(r => r.name.toLowerCase().includes('wangi'));
          if (wangi) extRiceId = wangi.id;
        } else if (detectedPrefix === 'CS' || text.toLowerCase().includes('siam')) {
          const siam = yearRices.find(r => r.name.toLowerCase().includes('siam'));
          if (siam) extRiceId = siam.id;
        }
      }
      
      let extDependents = 0;
      const tanggunganMatch = text.match(/(?:tanggungan|orang|jumlah)[\s\:\.]*(\d{1,2})/i);
      if (tanggunganMatch && tanggunganMatch[1]) {
        const num = parseInt(tanggunganMatch[1]);
        if (!isNaN(num) && num >= 0 && num <= 30) {
          extDependents = num;
        }
      }

      let extDate = new Date().toISOString().split('T')[0];
      const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        let year = dateMatch[3];
        if (year.length === 2) year = '20' + year;
        
        const parsedDate = `${year}-${month}-${day}`;
        if (!isNaN(new Date(parsedDate).getTime())) {
          extDate = parsedDate;
        }
      }

      setFormData(prev => ({
        ...prev,
        receiptNumber: extReceipt ? extReceipt : 'RZT-' + Math.floor(1000 + Math.random() * 9000),
        payerName: 'SILA KEMASKINI (OCR TULISAN TANGAN)',
        zakatType: extZakatType,
        zakatYear: extYear,
        riceTypeId: extRiceId,
        dependents: extDependents,
        paymentDate: extDate
      }));
      
    } catch (error) {
      console.error("Ralat OCR:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const verifyIC = async () => {
    if (!formData.icNumber || formData.icNumber.length < 7) {
      alert("Sila masukkan No. Kad Pintar yang sah (contoh: 01-123456)");
      return;
    }
    
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-ic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icNumber: formData.icNumber })
      });
      const data = await res.json();
      
      if (data.success) {
        setFormData(prev => ({ 
          ...prev, 
          payerName: data.data.verifiedName, 
          isVerified: true 
        }));
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Gagal menyemak Kad Pintar dengan sistem");
    }
    setIsVerifying(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setShowConfirm(false);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalAmount: parseFloat(totalAmount),
        zakatType: formData.zakatType,
          imageUrl: image
        })
      });
      
      if (res.ok) {
        sessionStorage.removeItem('scannedImage');
        router.push('/');
        router.refresh();
      } else {
        alert("Gagal menyimpan rekod data.");
      }
    } catch (error) {
      alert("Ralat sistem semasa memproses penyimpanan.");
    }
    setIsSaving(false);
  };

  if (isExtracting) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-teal-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="animate-spin text-teal-600 relative z-10" size={56} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-wide">Menganalisis Gambar...</h2>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-[280px]">
          Sistem sedang mengekstrak teks dari gambar resit zakat secara automatik menggunakan AI (OCR).
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pb-[100px]">
      <div className="bg-white/80 backdrop-blur-md p-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <button onClick={() => router.back()} className="text-slate-600 p-2 -ml-2 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-slate-800 ml-2 tracking-tight">Semakan Maklumat</h1>
      </div>

      <div className="p-5 flex-1">
        {image && (
          <div className="mb-6 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900 flex justify-center h-40 relative group">
            <img src={image} alt="Resit Zakat" className="h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>
            <p className="absolute bottom-3 left-3 text-white text-[10px] font-bold bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md uppercase tracking-wider border border-white/10">
              Gambar Asal Resit
            </p>
          </div>
        )}

        <div className="bg-teal-50 text-teal-800 p-4 rounded-2xl flex items-start gap-3 mb-6 text-sm shadow-sm border border-teal-100">
          <AlertCircle className="text-teal-600 shrink-0 mt-0.5" size={18} />
          <p className="leading-relaxed font-medium text-[13px]">
            Sila semak maklumat yang diekstrak. Anda boleh membuat pembetulan manual sekiranya OCR tersilap membaca tulisan tangan.
          </p>
        </div>

        <div className="space-y-4">

          {/* ZAKAT TYPE TOGGLE */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
            <button 
              type="button"
              onClick={() => setFormData({...formData, zakatType: 'FITRAH'})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${formData.zakatType === 'FITRAH' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}
            >
              Zakat Fitrah
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, zakatType: 'HARTA'})}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${formData.zakatType === 'HARTA' ? 'bg-white shadow text-amber-600' : 'text-slate-500'}`}
            >
              Zakat Harta
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tarikh Pembayaran</label>
            <input 
              type="date" 
              value={formData.paymentDate} 
              onChange={e => setFormData({...formData, paymentDate: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nombor Resit</label>
            <input 
              type="text" 
              value={formData.receiptNumber} 
              onChange={e => setFormData({...formData, receiptNumber: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Semakan Kad Pintar</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Contoh: 01-123456"
                value={formData.icNumber} 
                onChange={e => setFormData({...formData, icNumber: e.target.value, isVerified: false})}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm transition-all placeholder:text-slate-300 placeholder:font-normal"
              />
              <button 
                onClick={verifyIC}
                disabled={isVerifying || !formData.icNumber || formData.isVerified}
                className={`px-5 rounded-2xl font-bold text-sm whitespace-nowrap active:scale-95 transition-all shadow-sm border ${formData.isVerified ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-800 text-white border-transparent hover:bg-slate-900 disabled:opacity-50'}`}
              >
                {isVerifying ? <Loader2 className="animate-spin mx-auto" size={18} /> : (formData.isVerified ? 'Sah ✓' : 'Sahkan')}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Pembayar</label>
            <div className="relative">
              <input 
                type="text" 
                value={formData.payerName} 
                onChange={e => setFormData({...formData, payerName: e.target.value})}
                className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 outline-none pr-10 shadow-sm transition-all ${formData.isVerified ? 'border-teal-400 bg-teal-50/30' : 'border-slate-200 focus:border-teal-500'}`}
              />
              {formData.isVerified && (
                <div className="absolute right-4 top-4 text-teal-500 bg-white rounded-full">
                  <CheckCircle2 size={20} className="fill-current text-white bg-teal-500 rounded-full" />
                </div>
              )}
            </div>
            {formData.payerName.includes('KEMASKINI') && (
              <p className="text-[10px] text-red-500 ml-1 font-medium mt-1">Sila taip nama pembayar secara manual atau gunakan Semakan Kad Pintar.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tahun Zakat</label>
            <select 
              value={formData.zakatYear} 
              onChange={e => {
                const newYear = e.target.value;
                const yearItems = riceTypes.filter((r: any) => r.activeYear === newYear);
                setFormData({...formData, zakatYear: newYear, riceTypeId: yearItems[0]?.id || ''});
              }}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm appearance-none cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year as string} value={year as string}>{year as string}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Jenis Beras</label>
              <select 
                value={formData.riceTypeId} 
                onChange={e => setFormData({...formData, riceTypeId: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm appearance-none cursor-pointer"
              >
                {filteredRiceTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tanggungan</label>
              <select 
                value={formData.dependents} 
                onChange={e => setFormData({...formData, dependents: parseInt(e.target.value)})}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm appearance-none cursor-pointer"
              >
                {[...Array(21)].map((_, i) => (
                  <option key={i} value={i}>{i === 0 ? "Tiada Tanggungan" : `${i} Orang`}</option>
                ))}
              </select>
            </div>
          )}
          </div>

          <div className="mt-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-100 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">Jumlah Zakat</p>
              <p className="text-[10px] text-teal-500 mt-0.5">(1 Pembayar + {formData.dependents} Tanggungan) x ${currentPrice.toFixed(2)}</p>
            </div>
            <p className="text-2xl font-black text-teal-700">${totalAmount}</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 w-full max-w-md bg-white/90 backdrop-blur-lg border-t border-slate-100 p-4 pt-3 pb-6 z-50 rounded-t-3xl shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] flex gap-3">
        <button 
          onClick={() => { sessionStorage.removeItem('scannedImage'); router.push('/'); }}
          className="w-1/3 bg-slate-100 text-slate-600 rounded-2xl py-4 font-bold active:scale-[0.98] transition-all"
        >
          Batal
        </button>
        <button 
          onClick={() => {
            if (!formData.receiptNumber || !formData.payerName || !formData.riceTypeId) {
              alert("Sila lengkapkan maklumat penting (Nombor Resit, Nama & Jenis Beras).");
              return;
            }
            setShowConfirm(true);
          }}
          disabled={isSaving || riceTypes.length === 0}
          className="w-2/3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl py-4 font-bold shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isSaving ? 'Menyimpan...' : 'Hantar'}
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800">Sahkan Rekod Zakat</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Adakah maklumat ini tepat untuk disimpan?</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-6 text-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">No. Resit</span>
                <span className="font-bold text-slate-800">{formData.receiptNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Nama</span>
                <span className="font-bold text-slate-800 text-right max-w-[150px] truncate">{formData.payerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Beras</span>
                <span className="font-bold text-slate-800">{selectedRice?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Tanggungan</span>
                <span className="font-bold text-slate-800">{formData.dependents === 0 ? 'Tiada' : `${formData.dependents} Orang`}</span>
              </div>
              <div className="flex justify-between pt-1 items-center">
                <span className="text-teal-600 font-bold uppercase tracking-wider text-xs mt-1">Jumlah</span>
                <span className="text-xl font-black text-teal-700">${totalAmount}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="w-1/2 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-95 transition-all">
                Semak Semula
              </button>
              <button onClick={handleSave} className="w-1/2 bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-teal-500/30 active:scale-95 transition-all flex items-center justify-center">
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
