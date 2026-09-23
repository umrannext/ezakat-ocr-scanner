"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js';
import { 
  Loader2, CheckCircle2, AlertCircle, Save, ArrowLeft, 
  Sparkles, Plus, Minus, FileText, Check 
} from 'lucide-react';
import { 
  detectPaperColorFromImage, 
  extractReceiptCodeAndNumber, 
  extractMuzakkiInfo, 
  PaperColorResult 
} from '@/lib/ocr-helper';

interface DetectionInfo {
  code: 'DW' | 'CS' | '';
  digits: string;
  paperColor: PaperColorResult | null;
  totalMuzakki: number;
  dependents: number;
  muzakkiSource: string;
}

export default function ReviewPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [riceTypes, setRiceTypes] = useState<any[]>([]);
  const [detectionInfo, setDetectionInfo] = useState<DetectionInfo | null>(null);
  
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
  
  // Total Muzakki = 1 (Pembayar) + Bilangan Tanggungan
  const totalMuzakki = formData.dependents + 1;
  const totalAmount = formData.zakatType === 'HARTA' 
    ? formData.manualTotal 
    : (totalMuzakki * currentPrice).toFixed(2);

  useEffect(() => {
    const savedImage = sessionStorage.getItem('scannedImage');
    if (!savedImage) {
      router.push('/scan');
      return;
    }
    setImage(savedImage);
    extractData(savedImage);
  }, [router, riceTypes]);

  const [extracted, setExtracted] = useState(false);
  
  const extractData = async (base64Image: string) => {
    if (extracted || riceTypes.length === 0) return;
    setExtracted(true);
    
    try {
      // 1. Analisis warna kertas resit menggunakan HTML5 Canvas pixel sampling
      // Resit DW (Beras Wangi) berwarna HIJAU, Resit CS (Beras Siam) berwarna KUNING
      const paperColorResult = await detectPaperColorFromImage(base64Image);

      // 2. OCR recognition menggunakan Tesseract
      const result = await Tesseract.recognize(base64Image, 'eng+msa', {
        logger: m => console.log(m)
      });
      const text = result.data.text || '';

      // 3. Ekstrak 6-digit nombor resit & kod DW / CS
      const receiptData = extractReceiptCodeAndNumber(text, paperColorResult);

      // 4. Ekstrak bilangan muzakki (tulisan tangan Roman, nombor Arab/Jawi, perkataan Jawi)
      const muzakkiData = extractMuzakkiInfo(text);

      // 5. Kesan Tahun Zakat Hijrah
      let extYear = formData.zakatYear;
      const hijriMatch = text.match(/(14\d{2})H?/i);
      if (hijriMatch) {
         extYear = hijriMatch[1] + "H";
      }

      // 6. Padankan Jenis Beras berdasarkan kod DW / CS atau warna kertas
      const yearRices = riceTypes.filter(r => r.activeYear === extYear).length > 0 
        ? riceTypes.filter(r => r.activeYear === extYear)
        : riceTypes;

      let extRiceId = yearRices[0]?.id || '';
      const detectedCode = receiptData.code || paperColorResult.detectedCode;

      if (detectedCode === 'DW' || text.toLowerCase().includes('wangi')) {
        const wangi = yearRices.find(r => 
          r.name.toLowerCase().includes('wangi') || 
          r.code?.includes('DW') || 
          r.code?.toLowerCase().includes('wangi')
        );
        if (wangi) extRiceId = wangi.id;
      } else if (detectedCode === 'CS' || text.toLowerCase().includes('siam')) {
        const siam = yearRices.find(r => 
          r.name.toLowerCase().includes('siam') || 
          r.code?.includes('CS') || 
          r.code?.toLowerCase().includes('siam')
        );
        if (siam) extRiceId = siam.id;
      }

      // 7. Kesan Tarikh Pembayaran
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

      // Simpan maklumat pengesanan untuk rujukan visual amil
      setDetectionInfo({
        code: receiptData.code,
        digits: receiptData.digits,
        paperColor: paperColorResult,
        totalMuzakki: muzakkiData.totalMuzakki,
        dependents: muzakkiData.dependents,
        muzakkiSource: muzakkiData.source
      });

      setFormData(prev => ({
        ...prev,
        receiptNumber: receiptData.fullNumber,
        payerName: 'SILA KEMASKINI (OCR TULISAN TANGAN)',
        zakatType: 'FITRAH',
        zakatYear: extYear,
        riceTypeId: extRiceId,
        dependents: muzakkiData.dependents,
        paymentDate: extDate
      }));
      
    } catch (error) {
      console.error("Ralat OCR:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  // Pilihan Pantas untuk Jenis Beras (DW vs CS)
  const selectRiceByCode = (code: 'DW' | 'CS') => {
    const target = filteredRiceTypes.find(r => 
      (code === 'DW' && (r.name.toLowerCase().includes('wangi') || r.code?.includes('DW') || r.code?.includes('WANGI'))) ||
      (code === 'CS' && (r.name.toLowerCase().includes('siam') || r.code?.includes('CS') || r.code?.includes('SIAM')))
    );
    if (target) {
      setFormData(prev => {
        // Kekalkan 6-digit nombor resit, ubah awalan kod sahaja
        const digitsMatch = prev.receiptNumber.match(/\d{5,7}/);
        const digits = digitsMatch ? digitsMatch[0] : '';
        return {
          ...prev,
          riceTypeId: target.id,
          receiptNumber: digits ? `${code} ${digits}` : prev.receiptNumber
        };
      });
    }
  };

  // Kawalan Bilangan Muzakki oleh Amil
  const setTotalMuzakkiCount = (count: number) => {
    const safeCount = Math.max(1, Math.min(30, count));
    setFormData(prev => ({
      ...prev,
      dependents: safeCount - 1
    }));
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
        <h2 className="text-xl font-bold text-slate-800 tracking-wide">Menganalisis Resit...</h2>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-[290px]">
          Sistem sedang mengekstrak warna kertas (DW/CS), nombor 6-angka resit, dan bilangan muzakki secara automatik.
        </p>
      </div>
    );
  }

  // Tentukan sama ada jenis beras semasa ialah DW atau CS
  const isSelectedDW = selectedRice?.name.toLowerCase().includes('wangi') || selectedRice?.code?.includes('DW');
  const isSelectedCS = selectedRice?.name.toLowerCase().includes('siam') || selectedRice?.code?.includes('CS');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pb-[110px]">
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <button onClick={() => router.back()} className="text-slate-600 p-2 -ml-2 active:scale-90 transition-transform">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-slate-800 ml-2 tracking-tight">Semakan Maklumat Resit</h1>
      </div>

      <div className="p-5 flex-1">
        {/* Gambar Asal Resit */}
        {image && (
          <div className="mb-4 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900 flex justify-center h-44 relative group">
            <img src={image} alt="Resit Zakat" className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-bold">
              <span className="bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 uppercase tracking-wider">
                Gambar Resit Asal
              </span>
              {detectionInfo?.paperColor?.color && detectionInfo.paperColor.color !== 'UNKNOWN' && (
                <span className={`px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] ${
                  detectionInfo.paperColor.color === 'GREEN'
                    ? 'bg-emerald-600/80 border-emerald-400 text-white'
                    : 'bg-amber-600/80 border-amber-300 text-white'
                }`}>
                  {detectionInfo.paperColor.color === 'GREEN' ? 'Resit Hijau (DW)' : 'Resit Kuning (CS)'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Ringkasan Hasil Pengekstrakan AI & Status Pengesahan Amil */}
        {detectionInfo && (
          <div className="mb-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles size={16} className="text-teal-600" />
                <span>Hasil Ekstraksi AI & Warna Kertas</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Semak & Sahkan
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {/* Warna Kertas & Kod Beras */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                detectionInfo.paperColor?.color === 'GREEN'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : detectionInfo.paperColor?.color === 'YELLOW'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Kertas & Kod</span>
                <div className="font-bold flex items-center gap-1.5 mt-1">
                  <span className="text-base">
                    {detectionInfo.paperColor?.color === 'GREEN' ? '🟢' : detectionInfo.paperColor?.color === 'YELLOW' ? '🟡' : '⚪'}
                  </span>
                  <div>
                    <p className="font-black text-sm">
                      {detectionInfo.code || (detectionInfo.paperColor?.color === 'GREEN' ? 'DW' : detectionInfo.paperColor?.color === 'YELLOW' ? 'CS' : '—')}
                    </p>
                    <p className="text-[10px] opacity-80">
                      {detectionInfo.paperColor?.label || 'Biasa'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nombor 6-Angka Resit */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 text-slate-800 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. 6-Angka Merah</span>
                <div className="mt-1">
                  <span className="font-mono font-black text-base text-red-600 tracking-wider">
                    {detectionInfo.digits || '—'}
                  </span>
                  <p className="text-[10px] text-slate-500">Posisi Tengah</p>
                </div>
              </div>
            </div>

            {/* Sumber Pengesanan Bilangan Muzakki */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[11px] flex items-center justify-between text-slate-700">
              <span className="text-slate-500 font-medium">Pengesanan Muzakki:</span>
              <span className="font-bold text-teal-800 text-right max-w-[200px] truncate">
                {detectionInfo.muzakkiSource}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* ZAKAT TYPE TOGGLE */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
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

          {/* TARIKH PEMBAYARAN */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tarikh Pembayaran</label>
            <input 
              type="date" 
              value={formData.paymentDate} 
              onChange={e => setFormData({...formData, paymentDate: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm transition-all"
            />
          </div>

          {/* NOMBOR RESIT (DW / CS + 6 DIGIT) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Nombor Bilangan Resit (6 Angka)
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => selectRiceByCode('DW')}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                    formData.receiptNumber.startsWith('DW')
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  DW (Hijau)
                </button>
                <button
                  type="button"
                  onClick={() => selectRiceByCode('CS')}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                    formData.receiptNumber.startsWith('CS')
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  CS (Kuning)
                </button>
              </div>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Contoh: DW 077703 atau CS 014008"
                value={formData.receiptNumber} 
                onChange={e => setFormData({...formData, receiptNumber: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-mono font-bold text-lg tracking-wider focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm transition-all"
              />
            </div>
            <p className="text-[10px] text-slate-400 ml-1">
              Pencarian awal: Kod DW/CS di sebelah kiri, 6-angka bertaip merah di tengah resit.
            </p>
          </div>

          {/* SEMAKAN KAD PINTAR */}
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

          {/* NAMA PEMBAYAR */}
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
              <p className="text-[10px] text-amber-600 ml-1 font-medium mt-1">
                Sila lengkapkan nama pembayar secara manual atau gunakan Semakan Kad Pintar di atas.
              </p>
            )}
          </div>

          {/* BAHAGIAN KHAS ZAKAT FITRAH */}
          {formData.zakatType === 'FITRAH' && (
          <div className="space-y-4 pt-1">
            {/* TAHUN ZAKAT */}
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

            {/* PILIHAN JENIS BERAS (DW HIJAU vs CS KUNING) */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Jenis Beras (Kadar Fitrah Brunei)
              </label>
              
              {/* Butang Pintas Pilihan Visual (Warna Kertas Resit) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => selectRiceByCode('DW')}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelectedDW 
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20' 
                      : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:bg-emerald-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">Kertas Hijau</span>
                    {isSelectedDW && <Check size={16} className="text-white" />}
                  </div>
                  <p className="font-extrabold text-sm">DW - Beras Wangi</p>
                  <p className={`text-xs font-semibold mt-0.5 ${isSelectedDW ? 'text-emerald-100' : 'text-emerald-700'}`}>
                    $2.84 / orang
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => selectRiceByCode('CS')}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                    isSelectedCS 
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20' 
                      : 'bg-amber-50/60 border-amber-200 text-amber-900 hover:bg-amber-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">Kertas Kuning</span>
                    {isSelectedCS && <Check size={16} className="text-white" />}
                  </div>
                  <p className="font-extrabold text-sm">CS - Beras Siam</p>
                  <p className={`text-xs font-semibold mt-0.5 ${isSelectedCS ? 'text-amber-100' : 'text-amber-700'}`}>
                    $1.93 / orang
                  </p>
                </button>
              </div>

              {/* Dropdown Lengkap Sekiranya Terdapat Jenis Beras Tambahan */}
              <select 
                value={formData.riceTypeId} 
                onChange={e => setFormData({...formData, riceTypeId: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm cursor-pointer mt-1"
              >
                {filteredRiceTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name} (${type.price.toFixed(2)})</option>
                ))}
              </select>
            </div>

            {/* PENGESAHAN JUMLAH MUZAKKI & TANGGUNGAN OLEH AMIL */}
            <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-widest block">
                    Jumlah Muzakki
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">Disahkan oleh Amil (Boleh edit)</p>
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 shadow-2xs">
                  {formData.dependents === 0 ? '1 Pembayar Sahaja' : `1 Pembayar + ${formData.dependents} Tanggungan`}
                </span>
              </div>

              {/* Stepper Tambah / Kurang Muzakki */}
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setTotalMuzakkiCount(totalMuzakki - 1)}
                  disabled={totalMuzakki <= 1}
                  className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-90 transition-transform flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 disabled:active:scale-100"
                  aria-label="Kurangkan Muzakki"
                >
                  <Minus size={22} />
                </button>

                <div className="flex-1 text-center py-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-3xl font-black text-slate-800">{totalMuzakki}</span>
                    <span className="text-sm font-bold text-slate-500">Orang</span>
                  </div>
                  <span className="text-[11px] font-semibold text-teal-600 block">
                    {formData.dependents} Tanggungan
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setTotalMuzakkiCount(totalMuzakki + 1)}
                  disabled={totalMuzakki >= 30}
                  className="w-12 h-12 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-90 transition-transform flex items-center justify-center font-bold text-white shadow-md shadow-teal-600/20 disabled:opacity-30 disabled:active:scale-100"
                  aria-label="Tambah Muzakki"
                >
                  <Plus size={22} />
                </button>
              </div>

              {/* Pilihan Manual Tanggungan (Dropdown Alternatif) */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Bil. Tanggungan:
                </span>
                <select 
                  value={formData.dependents} 
                  onChange={e => setFormData({...formData, dependents: parseInt(e.target.value, 10)})}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  {[...Array(26)].map((_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? "Tiada Tanggungan (0)" : `${i} Orang Tanggungan`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          )}

          {/* KAD JUMLAH ZAKAT KESELURUHAN */}
          <div className="mt-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-100 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-[11px] font-bold text-teal-700 uppercase tracking-widest">Jumlah Bayaran Zakat</p>
              <p className="text-[10px] text-teal-600 mt-0.5">
                {formData.zakatType === 'HARTA' ? 'Bayaran Zakat Harta' : `(${totalMuzakki} Muzakki) × $${currentPrice.toFixed(2)}`}
              </p>
            </div>
            <p className="text-2xl font-black text-teal-800">${totalAmount}</p>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 w-full max-w-md bg-white/95 backdrop-blur-lg border-t border-slate-100 p-4 pt-3 pb-6 z-50 rounded-t-3xl shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)] flex gap-3">
        <button 
          onClick={() => { sessionStorage.removeItem('scannedImage'); router.push('/'); }}
          className="w-1/3 bg-slate-100 text-slate-600 rounded-2xl py-4 font-bold active:scale-[0.98] transition-all hover:bg-slate-200"
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
          {isSaving ? 'Menyimpan...' : 'Hantar & Sah'}
        </button>
      </div>

      {/* MODAL SAHKAN REKOD */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800">Sahkan Rekod Zakat</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Sila pastikan butiran resit adalah tepat sebelum disimpan.</p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-6 text-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">No. Resit</span>
                <span className="font-mono font-bold text-slate-900">{formData.receiptNumber}</span>
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
                <span className="text-slate-500 font-medium">Jumlah Muzakki</span>
                <span className="font-bold text-teal-700">
                  {totalMuzakki} Orang ({formData.dependents === 0 ? 'Tiada Tanggungan' : `${formData.dependents} Tanggungan`})
                </span>
              </div>
              <div className="flex justify-between pt-1 items-center">
                <span className="text-teal-600 font-bold uppercase tracking-wider text-xs mt-1">Jumlah Bayaran</span>
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
