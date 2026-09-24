"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js';
import { 
  Loader2, CheckCircle2, AlertCircle, Save, ArrowLeft, 
  Sparkles, Plus, Minus, FileText, Check, Zap, WifiOff 
} from 'lucide-react';
import { 
  detectPaperColorFromImage, 
  extractReceiptCodeAndNumber, 
  extractZakatHartaDetails,
  extractMuzakkiInfo, 
  compressReceiptImage,
  convertArabicIndicToRomanDigits,
  extractStandardizedPaymentDate,
  PaperColorResult 
} from '@/lib/ocr-helper';
import { saveOfflineReceipt } from '@/lib/offline-storage';

interface DetectionInfo {
  code: 'DW' | 'CS' | '';
  digits: string;
  zakatType: 'FITRAH' | 'HARTA';
  paperColor: PaperColorResult | null;
  totalMuzakki: number;
  dependents: number;
  muzakkiSource: string;
  detectionReasons: string[];
}

export default function ReviewPage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isWakalah, setIsWakalah] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);
  
  useEffect(() => {
    const qm = typeof window !== 'undefined' && sessionStorage.getItem('scanQuickMode') === 'true';
    if (qm) setIsQuickMode(true);
  }, []);
  
  const [riceTypes, setRiceTypes] = useState<any[]>([
    { id: 'bf3a55f9-4fec-40b3-b690-3136f8b6b71d', code: 'B_SIAM_1447H', name: 'Beras Siam', price: 1.93, activeYear: '1447H' },
    { id: '1b1bebf6-4e54-4422-9847-59ef872dc5d5', code: 'B_WANGI_1447H', name: 'Beras Wangi', price: 2.84, activeYear: '1447H' },
    { id: 'd2bd2bb5-0526-4fbb-b02e-765893e63f78', code: 'B_SIAM_1446H', name: 'Beras Siam', price: 1.90, activeYear: '1446H' },
    { id: 'fc5d684b-f355-46c0-be2f-9431351dd792', code: 'B_WANGI_1446H', name: 'Beras Wangi', price: 2.80, activeYear: '1446H' },
  ]);
  const [detectionInfo, setDetectionInfo] = useState<DetectionInfo | null>(null);
  
  const [formData, setFormData] = useState({
    receiptNumber: '',
    payerName: '',
    riceTypeId: 'bf3a55f9-4fec-40b3-b690-3136f8b6b71d',
    icNumber: '',
    isVerified: false,
    zakatType: 'FITRAH' as 'FITRAH' | 'HARTA',
    manualTotal: '0.00',
    dependents: 0, 
    paymentDate: new Date().toISOString().split('T')[0],
    zakatYear: '1447H',
    // Butiran khusus Zakat Harta (Borang A)
    hartaSubtype: 'Wang Simpanan',
    hartaPaymentMethod: 'TUNAI', // 'TUNAI' | 'CEK'
    bankName: '',
    chequeNumber: '',
    payerAddress: ''
  });

  // Senarai tahun zakat yang ada
  const availableYears = Array.from(new Set(riceTypes.map(r => r.activeYear))).filter(Boolean).sort().reverse();
  const effectiveYear = availableYears.includes(formData.zakatYear) 
    ? formData.zakatYear 
    : (availableYears[0] || '1447H');

  const filteredRiceTypes = riceTypes.filter(r => r.activeYear === effectiveYear);
  const displayRiceTypes = filteredRiceTypes.length > 0 ? filteredRiceTypes : riceTypes;

  const isReceiptDW = formData.receiptNumber.trim().toUpperCase().startsWith('DW');
  const isReceiptCS = formData.receiptNumber.trim().toUpperCase().startsWith('CS');

  const selectedRice = displayRiceTypes.find(r => r.id === formData.riceTypeId)
    || riceTypes.find(r => r.id === formData.riceTypeId)
    || displayRiceTypes.find(r => isReceiptDW ? (r.name.toLowerCase().includes('wangi') || r.code?.includes('DW')) : (r.name.toLowerCase().includes('siam') || r.code?.includes('CS')))
    || displayRiceTypes[0]
    || riceTypes[0];

  const fallbackPrice = isReceiptDW ? (effectiveYear === '1446H' ? 2.80 : 2.84) : (effectiveYear === '1446H' ? 1.90 : 1.93);
  const currentPrice = (selectedRice && selectedRice.price > 0) ? selectedRice.price : fallbackPrice;
  
  // Total Muzakki = 1 (Pembayar) + Bilangan Tanggungan
  const totalMuzakki = formData.dependents + 1;
  const totalAmount = formData.zakatType === 'HARTA' 
    ? (parseFloat(formData.manualTotal) || 0).toFixed(2)
    : (totalMuzakki * currentPrice).toFixed(2);

  useEffect(() => {
    const fetchRiceTypes = async () => {
      try {
        const res = await fetch('/api/rice-types');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setRiceTypes(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch rice types", err);
      }
    };
    fetchRiceTypes();
  }, []);

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
  const [isOfflineDetected, setIsOfflineDetected] = useState(false);
  const [ocrOfflineNote, setOcrOfflineNote] = useState<string | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOfflineDetected(!navigator.onLine);
      const setOnline = () => setIsOfflineDetected(false);
      const setOffline = () => setIsOfflineDetected(true);
      window.addEventListener('online', setOnline);
      window.addEventListener('offline', setOffline);
      return () => {
        window.removeEventListener('online', setOnline);
        window.removeEventListener('offline', setOffline);
      };
    }
  }, []);
  
  const extractData = async (base64Image: string) => {
    if (extracted || riceTypes.length === 0) return;
    setExtracted(true);
    
    try {
      const scanHint = (typeof window !== 'undefined' ? sessionStorage.getItem('scanReceiptType') : null) as 'FITRAH' | 'HARTA' | null;

      // 1. Analisis warna kertas resit & orientasi menggunakan Canvas
      const paperColorResult = await detectPaperColorFromImage(base64Image);

      // 2. OCR recognition menggunakan Tesseract
      const result = await Tesseract.recognize(base64Image, 'eng+msa', {
        logger: m => console.log(m)
      });
      const text = result.data.text || '';

      // 3. Ekstrak nombor resit & kenal pasti Zakat Harta (5-angka) vs Zakat Fitrah (DW/CS 6-angka)
      const receiptData = extractReceiptCodeAndNumber(
        text, 
        paperColorResult, 
        scanHint || undefined
      );

      // 4. Jika Zakat Harta, ekstrak butiran khusus Borang A
      const hartaDetails = extractZakatHartaDetails(text);

      // 5. Ekstrak bilangan muzakki jika Fitrah
      const muzakkiData = extractMuzakkiInfo(text);

      // 6. Kesan Tahun Zakat Hijrah
      let extYear = formData.zakatYear;
      const hijriMatch = text.match(/(14\d{2})H?/i);
      if (hijriMatch) {
         const detectedYear = hijriMatch[1] + "H";
         if (riceTypes.some(r => r.activeYear === detectedYear)) {
           extYear = detectedYear;
         }
      }

      // 7. Padankan Jenis Beras berdasarkan kod DW / CS atau warna kertas jika Fitrah
      const yearRices = riceTypes.filter(r => r.activeYear === extYear).length > 0 
        ? riceTypes.filter(r => r.activeYear === extYear)
        : riceTypes;

      let extRiceId = yearRices[0]?.id || '';
      const detectedCode = receiptData.code || paperColorResult.detectedCode;

      if (detectedCode === 'DW' || text.toLowerCase().includes('wangi') || text.toLowerCase().includes('hijau')) {
        const wangi = yearRices.find(r => 
          r.name.toLowerCase().includes('wangi') || 
          r.code?.includes('DW') || 
          r.code?.toLowerCase().includes('wangi')
        );
        if (wangi) extRiceId = wangi.id;
      } else if (detectedCode === 'CS' || text.toLowerCase().includes('siam') || text.toLowerCase().includes('kuning')) {
        const siam = yearRices.find(r => 
          r.name.toLowerCase().includes('siam') || 
          r.code?.includes('CS') || 
          r.code?.toLowerCase().includes('siam')
        );
        if (siam) extRiceId = siam.id;
      }

      // 8. Kesan Tarikh Pembayaran (Auto-selaras digit Jawi / Arab / Roman kepada format standard ISO)
      const extDate = extractStandardizedPaymentDate(text);

      const isHarta = receiptData.zakatType === 'HARTA';

      // Semak sekiranya resit menyebut perwakilan atau Wakalah
      if (/wakalah|وكالة|mewakili|wakil/i.test(text)) {
        setIsWakalah(true);
      }

      // Simpan maklumat pengesanan untuk rujukan visual amil
      setDetectionInfo({
        code: receiptData.code,
        digits: receiptData.digits,
        zakatType: receiptData.zakatType,
        paperColor: paperColorResult,
        totalMuzakki: isHarta ? 1 : muzakkiData.totalMuzakki,
        dependents: isHarta ? 0 : muzakkiData.dependents,
        muzakkiSource: isHarta ? 'Resit Zakat Harta (Borang A)' : muzakkiData.source,
        detectionReasons: receiptData.detectionReasons
      });

      setFormData(prev => ({
        ...prev,
        receiptNumber: receiptData.fullNumber,
        payerName: isHarta ? (hartaDetails.payerName || '') : '',
        icNumber: isHarta ? (hartaDetails.payerIcNumber || '') : '',
        zakatType: receiptData.zakatType,
        zakatYear: extYear,
        riceTypeId: isHarta ? '' : extRiceId,
        dependents: isHarta ? 0 : muzakkiData.dependents,
        manualTotal: isHarta ? (parseFloat(hartaDetails.amount) > 0 ? hartaDetails.amount : '0.00') : '0.00',
        hartaSubtype: isHarta ? (hartaDetails.zakatSubtype || 'Wang Simpanan') : 'Wang Simpanan',
        bankName: hartaDetails.bankName || '',
        chequeNumber: hartaDetails.chequeNumber || '',
        hartaPaymentMethod: hartaDetails.chequeNumber ? 'CEK' : 'TUNAI',
        paymentDate: extDate
      }));
      
    } catch (error: any) {
      console.error("Ralat OCR:", error);
      const offline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
      if (offline || error?.message?.includes('Network') || error?.message?.includes('fetch')) {
        setOcrOfflineNote("Mod Luar Talian (Beta): Pengecaman automatik luar talian memerlukan internet untuk muat turun modul kali pertama. Sila semak gambar resit di atas dan isi Nombor Resit secara manual.");
      }
    } finally {
      setIsExtracting(false);
    }
  };


  // Pilihan Pantas untuk Jenis Beras (DW vs CS)
  const selectRiceByCode = (code: 'DW' | 'CS') => {
    const candidates = displayRiceTypes.length > 0 ? displayRiceTypes : riceTypes;
    const target = candidates.find(r => 
      (code === 'DW' && (r.name.toLowerCase().includes('wangi') || r.code?.includes('DW') || r.code?.toLowerCase().includes('wangi'))) ||
      (code === 'CS' && (r.name.toLowerCase().includes('siam') || r.code?.includes('CS') || r.code?.toLowerCase().includes('siam')))
    ) || candidates[0];

    setFormData(prev => {
      // Kekalkan 6-digit nombor resit, ubah awalan kod sahaja
      const digitsMatch = prev.receiptNumber.match(/\d{4,8}/);
      const digits = digitsMatch ? digitsMatch[0] : '';
      const newNum = digits 
        ? `${code} ${digits}` 
        : (prev.receiptNumber.replace(/^(DW|CS)\s*/i, '').trim() ? `${code} ${prev.receiptNumber.replace(/^(DW|CS)\s*/i, '').trim()}` : `${code} `);

      return {
        ...prev,
        riceTypeId: target?.id || prev.riceTypeId,
        receiptNumber: newNum
      };
    });
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
      // Mampatkan imej asal kepada saiz ultra-ringan (~15KB - 20KB) untuk pangkalan data & rujukan pantas
      let compressedThumb: string | null = null;
      if (image) {
        try {
          compressedThumb = await compressReceiptImage(image, 520, 0.58);
          // Simpan juga salinan dalam LocalStorage untuk akses sepantas kilat
          if (typeof window !== 'undefined' && formData.receiptNumber) {
            try {
              localStorage.setItem(`receipt_img_${formData.receiptNumber.trim()}`, compressedThumb);
            } catch (_) {}
          }
        } catch (e) {
          console.warn('Gagal memampatkan imej thumbnail:', e);
        }
      }

      const finalPayerName = isQuickMode
        ? 'Arkib Zakat Fitrah'
        : (formData.payerName?.trim() || 'Pembayar Zakat');

      const finalIcNumber = isQuickMode ? null : (formData.icNumber || null);

      const payload = {
        ...formData,
        payerName: finalPayerName,
        icNumber: finalIcNumber,
        isQuickMode,
        isWakalah: Boolean(isWakalah),
        riceTypeId: formData.zakatType === 'HARTA' ? null : (formData.riceTypeId || selectedRice?.id),
        totalAmount: parseFloat(totalAmount),
        zakatType: formData.zakatType,
        imageUrl: compressedThumb
      };

      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      // KES 1: Mod Luar Talian jika tiada internet
      if (!isOnline) {
        saveOfflineReceipt(payload);
        sessionStorage.removeItem('scannedImage');
        alert("📴 MOD LUAR TALIAN (BETA)\n\nTiada sambungan internet dikesan. Rekod resit ini telah disimpan dengan selamat di dalam peranti anda.\n\nSistem akan memuat naik (auto-sync) rekod ini ke pangkalan data secara automatik sebaik sahaja talian internet kembali pulih.");
        
        if (isQuickMode && formData.zakatType === 'FITRAH') {
          sessionStorage.setItem('scanQuickMode', 'true');
          sessionStorage.setItem('scanReceiptType', 'FITRAH');
          router.push('/scan');
        } else {
          sessionStorage.setItem('scanQuickMode', 'false');
          router.push('/');
          router.refresh();
        }
        setIsSaving(false);
        return;
      }

      // KES 2: Sambungan biasa ke pangkalan data
      try {
        const res = await fetch('/api/receipts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const data = await res.json();

        if (res.ok && data.success) {
          sessionStorage.removeItem('scannedImage');
          if (isQuickMode && formData.zakatType === 'FITRAH') {
            sessionStorage.setItem('scanQuickMode', 'true');
            sessionStorage.setItem('scanReceiptType', 'FITRAH');
            router.push('/scan');
          } else {
            sessionStorage.setItem('scanQuickMode', 'false');
            router.push('/');
            router.refresh();
          }
        } else {
          alert(data.error || "Gagal menyimpan rekod data. Sila semak maklumat resit.");
        }
      } catch (networkErr: any) {
        // KES 3: Talian terputus semasa penghantaran (Fallback ke Offline Storage)
        console.warn("Rangkaian terputus, disimpan ke peranti:", networkErr);
        saveOfflineReceipt(payload);
        sessionStorage.removeItem('scannedImage');
        alert("📴 ISYARAT TERPUTUS (MOD LUAR TALIAN BETA)\n\nSambungan internet terputus semasa menyimpan. Rekod telah disimpan dengan selamat di dalam peranti dan akan diselaraskan (auto-sync) sebaik sahaja isyarat internet dikesan.");

        if (isQuickMode && formData.zakatType === 'FITRAH') {
          sessionStorage.setItem('scanQuickMode', 'true');
          sessionStorage.setItem('scanReceiptType', 'FITRAH');
          router.push('/scan');
        } else {
          sessionStorage.setItem('scanQuickMode', 'false');
          router.push('/');
          router.refresh();
        }
      }
    } catch (error: any) {
      alert("Ralat sistem semasa memproses penyimpanan: " + (error?.message || "Sila cuba lagi"));
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
  const isSelectedDW = selectedRice?.name.toLowerCase().includes('wangi') || selectedRice?.code?.includes('DW') || isReceiptDW;
  const isSelectedCS = selectedRice?.name.toLowerCase().includes('siam') || selectedRice?.code?.includes('CS') || isReceiptCS;

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
        {/* Banner Mod Luar Talian jika Tiada Internet atau OCR Memerlukan Bantuan Manual */}
        {(isOfflineDetected || ocrOfflineNote) && (
          <div className="mb-4 bg-amber-500/10 border-2 border-amber-400/70 text-amber-950 p-3.5 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-amber-900">
              <WifiOff size={16} className="text-amber-600 shrink-0" />
              <span>Mod Luar Talian (Offline Beta) Aktif</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
              {ocrOfflineNote || "Tiada sambungan internet dikesan. Anda boleh menyemak butiran resit dan mengisi secara manual. Rekod akan disimpan ke peranti dan diselaraskan (auto-sync) ke pangkalan data sebaik talian dikesan."}
            </p>
          </div>
        )}

        {/* Gambar Asal Resit */}
        {image && (
          <div className="mb-4 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-slate-900 flex justify-center h-44 relative group">
            <img src={image} alt="Resit Zakat" className="h-full w-full object-cover opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-bold">
              <span className="bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 uppercase tracking-wider">
                Gambar Resit Asal
              </span>
              {formData.zakatType === 'HARTA' ? (
                <span className="px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] bg-slate-900/80 border-amber-400 text-amber-300 font-bold">
                  Resit Putih (Zakat Harta)
                </span>
              ) : (detectionInfo?.paperColor?.color && detectionInfo.paperColor.color !== 'UNKNOWN' && (
                <span className={`px-2.5 py-1 rounded-full backdrop-blur-md border text-[11px] ${
                  detectionInfo.paperColor.color === 'GREEN'
                    ? 'bg-emerald-600/80 border-emerald-400 text-white'
                    : 'bg-amber-600/80 border-amber-300 text-white'
                }`}>
                  {detectionInfo.paperColor.color === 'GREEN' ? 'Resit Hijau (DW)' : 'Resit Kuning (CS)'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ringkasan Hasil Pengekstrakan AI & Ciri Fizikal Resit */}
        {detectionInfo && (
          <div className={`mb-5 border rounded-2xl p-4 shadow-sm space-y-3 ${
            formData.zakatType === 'HARTA' 
              ? 'bg-amber-50/50 border-amber-200/80' 
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles size={16} className={formData.zakatType === 'HARTA' ? 'text-amber-600' : 'text-teal-600'} />
                <span>
                  {formData.zakatType === 'HARTA' 
                    ? 'Pengesanan Resit Zakat Harta (Borang A)' 
                    : 'Pengesanan Resit Zakat Fitrah'}
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                formData.zakatType === 'HARTA'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-teal-50 text-teal-700 border-teal-200'
              }`}>
                {formData.zakatType === 'HARTA' ? 'Kertas Putih • Lanskap' : 'Slip Segi Empat • DW/CS'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {/* Warna Kertas & Format Resit */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between ${
                formData.zakatType === 'HARTA'
                  ? 'bg-amber-100/60 border-amber-200 text-amber-950'
                  : detectionInfo.paperColor?.color === 'GREEN'
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">Format & Kertas</span>
                <div className="font-bold flex items-center gap-1.5 mt-1">
                  <span className="text-base">
                    {formData.zakatType === 'HARTA' ? '📄' : (detectionInfo.paperColor?.color === 'GREEN' ? '🟢' : '🟡')}
                  </span>
                  <div>
                    <p className="font-black text-sm">
                      {formData.zakatType === 'HARTA' ? (
                        'Kertas Putih'
                      ) : (
                        <span className="text-red-600 font-black text-base tracking-wider">
                          {detectionInfo.code || (isReceiptDW ? 'DW' : (isReceiptCS ? 'CS' : 'Fitrah'))}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] opacity-80">
                      {formData.zakatType === 'HARTA' ? 'Memanjang (Landscape)' : (detectionInfo.paperColor?.label || 'Segi Empat Tepat')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nombor Resit (5-Angka Harta vs 6-Angka Fitrah) */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-slate-800 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {formData.zakatType === 'HARTA' ? '5-Angka Merah' : 'No. 6-Angka Merah'}
                </span>
                <div className="mt-1">
                  <span className="font-mono font-black text-base text-red-600 tracking-wider">
                    {formData.zakatType === 'HARTA'
                      ? (formData.receiptNumber || '—')
                      : (detectionInfo.digits || formData.receiptNumber.replace(/^(DW|CS)\s*/i, '').trim() || '—')}
                  </span>
                  <p className="text-[10px] text-slate-500">
                    {formData.zakatType === 'HARTA' ? 'Sebelah Atas Kanan (Tiada Kod)' : 'Posisi Tengah Resit'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sebab Pengesanan AI */}
            {detectionInfo.detectionReasons && detectionInfo.detectionReasons.length > 0 && (
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl px-3 py-2 text-[11px] text-slate-600">
                <span className="font-bold text-slate-700">Ciri Resit: </span>
                <span>{detectionInfo.detectionReasons.join(' • ')}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* TAB PILIHAN JENIS ZAKAT: FITRAH VS HARTA */}
          <div className="flex bg-slate-200/70 p-1 rounded-2xl border border-slate-300/60 shadow-inner">
            <button 
              type="button"
              onClick={() => {
                setFormData(prev => {
                  const isWangi = selectedRice?.name.toLowerCase().includes('wangi') || selectedRice?.code?.includes('DW');
                  const code = isWangi ? 'DW' : 'CS';
                  const digits = prev.receiptNumber.replace(/\D/g, '').padStart(6, '0').slice(-6);
                  return {
                    ...prev, 
                    zakatType: 'FITRAH',
                    receiptNumber: `${code} ${digits}`
                  };
                });
              }}
              className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                formData.zakatType === 'FITRAH' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🌾 Zakat Fitrah</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${formData.zakatType === 'FITRAH' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-300 text-slate-700'}`}>
                DW / CS
              </span>
            </button>

            <button 
              type="button"
              onClick={() => {
                setFormData(prev => {
                  const digits = prev.receiptNumber.replace(/\D/g, '').slice(-5) || '46440';
                  return {
                    ...prev, 
                    zakatType: 'HARTA',
                    receiptNumber: digits
                  };
                });
              }}
              className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                formData.zakatType === 'HARTA' 
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🪙 Zakat Harta</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${formData.zakatType === 'HARTA' ? 'bg-amber-600 text-white' : 'bg-slate-300 text-slate-700'}`}>
                5-Angka
              </span>
            </button>
          </div>

          {/* QUICK SCAN TOGGLE BANNER (KHAS RESIT ZAKAT FITRAH LAMA) */}
          {formData.zakatType === 'FITRAH' && (
            <div className={`rounded-2xl p-3.5 border transition-all ${
              isQuickMode 
                ? 'bg-amber-500/10 border-amber-300 text-amber-950 shadow-sm' 
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    isQuickMode ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-200 text-slate-500'
                  }`}>
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black">Mod Pantas Arkib (Quick Scan)</h4>
                      {isQuickMode && (
                        <span className="text-[9px] font-black text-amber-950 bg-amber-400 px-1.5 py-0.5 rounded-md">
                          Resit Lama
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {isQuickMode 
                        ? 'Nama, IC & Tarikh dilumpuhkan (Hanya Tahun Zakat disimpan)' 
                        : 'Nyahaktif (Guna mod penuh dengan butiran pembayar)'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isQuickMode;
                    setIsQuickMode(next);
                    sessionStorage.setItem('scanQuickMode', next ? 'true' : 'false');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 ${
                    isQuickMode 
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isQuickMode ? 'AKTIF ✓' : 'Togol ON'}
                </button>
              </div>
            </div>
          )}

          {/* TARIKH PEMBAYARAN (DILUMPUHKAN JIKA MOD ARKIB) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className={`text-[11px] font-bold uppercase tracking-widest ${isQuickMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Tarikh Pembayaran
              </label>
              {isQuickMode && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  Tak Perlu Diisi (Mod Arkib)
                </span>
              )}
            </div>
            <input 
              type="date" 
              disabled={isQuickMode}
              value={formData.paymentDate} 
              onChange={e => setFormData({...formData, paymentDate: e.target.value})}
              className={`w-full rounded-2xl px-4 py-3.5 font-semibold outline-none shadow-sm transition-all ${
                isQuickMode 
                  ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed select-none opacity-80' 
                  : 'bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
              }`}
            />
            {isQuickMode && (
              <p className="text-[10px] text-slate-400 ml-1">
                Dalam mod arkib, tarikh harian tidak diperlukan — hanya <strong>Tahun Zakat</strong> di bawah yang direkodkan.
              </p>
            )}
          </div>

          {/* ========================================================= */}
          {/* MEDAN A: KHAS UNTUK RESIT ZAKAT HARTA (BORANG A - PUTIH)   */}
          {/* ========================================================= */}
          {formData.zakatType === 'HARTA' ? (
            <div className="space-y-4 pt-1">
              
              {/* NOMBOR BILANGAN RESIT (5 ANGKA MERAH ATAS KANAN - TIADA KOD) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Nombor Bilangan Resit (5 Angka)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                    🔴 Merah Atas Kanan
                  </span>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    maxLength={7}
                    placeholder="Contoh: 46440"
                    value={formData.receiptNumber} 
                    onChange={e => {
                      // Tukar digit Jawi/Arab ke Roman dan hanya benarkan angka
                      const converted = convertArabicIndicToRomanDigits(e.target.value);
                      const cleanNum = converted.replace(/[^0-9]/g, '');
                      setFormData({...formData, receiptNumber: cleanNum});
                    }}
                    className="w-full bg-white border-2 border-amber-300/80 rounded-2xl px-4 py-3.5 text-red-600 font-mono font-black text-xl tracking-widest focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none shadow-sm transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-500 ml-1">
                  Resit Zakat Harta bersaiz memanjang (Landscape) mempunyai 5 angka merah di sudut atas kanan <strong>tanpa sebarang kod resit</strong>.
                </p>
              </div>

              {/* JUMLAH BAYARAN ZAKAT HARTA ($) */}
              <div className="space-y-1.5 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-amber-900 uppercase tracking-widest">
                    Jumlah Bayaran Zakat ($)
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    Kolum Banyak ($ & ¢)
                  </span>
                </div>

                <div className="relative mt-2">
                  <span className="absolute left-4 top-3.5 text-xl font-black text-amber-700">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.manualTotal}
                    onChange={e => {
                      const converted = convertArabicIndicToRomanDigits(e.target.value);
                      setFormData({...formData, manualTotal: converted});
                    }}
                    className="w-full bg-white border-2 border-amber-400 rounded-xl pl-9 pr-4 py-3 text-slate-900 font-black text-2xl tracking-tight focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
                  />
                </div>
                <p className="text-[10px] text-amber-800 font-medium pt-1">
                  Rujukan Nisab Zakat Emas semasa: <strong>$9,775.00</strong> (85g × $115.00/g).
                </p>
              </div>

              {/* KATEGORI JENIS ZAKAT HARTA */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Kategori Zakat Harta
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'Wang Simpanan', label: '💰 Wang Simpanan' },
                    { id: 'Emas & Perak', label: '🪙 Emas & Perak' },
                    { id: 'Perniagaan', label: '🏪 Perniagaan' },
                    { id: 'Pendapatan', label: '💼 Pendapatan' },
                    { id: 'Saham & Pelaburan', label: '📈 Saham / Pelaburan' },
                    { id: 'Lain-lain Harta', label: '📦 Lain-lain Harta' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({...formData, hartaSubtype: cat.id})}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                        formData.hartaSubtype === cat.id
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* KAEDAH BAYARAN (TUNAI VS CEK) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Kaedah Bayaran
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, hartaPaymentMethod: 'TUNAI'})}
                    className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                      formData.hartaPaymentMethod === 'TUNAI'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    💵 Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, hartaPaymentMethod: 'CEK'})}
                    className={`py-2 px-3 rounded-xl border font-bold transition-all ${
                      formData.hartaPaymentMethod === 'CEK'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    📑 Cek / Bank
                  </button>
                </div>

                {/* Butiran Cek jika dipilih */}
                {formData.hartaPaymentMethod === 'CEK' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Nama Bank
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: BIBD / Baiduri"
                        value={formData.bankName}
                        onChange={e => setFormData({...formData, bankName: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Nombor Cek
                      </label>
                      <input 
                        type="text"
                        placeholder="Contoh: 0012345"
                        value={formData.chequeNumber}
                        onChange={e => {
                          const roman = convertArabicIndicToRomanDigits(e.target.value);
                          setFormData({...formData, chequeNumber: roman});
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (

          /* ========================================================= */
          /* MEDAN B: KHAS UNTUK RESIT ZAKAT FITRAH (SLIP POTRET)      */
          /* ========================================================= */
            <div className="space-y-4 pt-1">
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
                    onChange={e => {
                      const converted = convertArabicIndicToRomanDigits(e.target.value);
                      setFormData({...formData, receiptNumber: converted});
                    }}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-mono font-bold text-lg tracking-wider focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 ml-1">
                  Pencarian awal: Kod DW/CS di sebelah kiri, 6-angka bertaip merah di tengah resit.
                </p>
              </div>

              {/* TAHUN ZAKAT (KEKAL AKTIF & UTAMA UNTUK ARKIB RESIT) */}
              <div className={`space-y-1.5 transition-all ${isQuickMode ? 'p-3.5 bg-amber-500/10 border-2 border-amber-400 rounded-2xl shadow-xs' : ''}`}>
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                    Tahun Zakat
                  </label>
                  {isQuickMode && (
                    <span className="text-[10px] font-black text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300">
                      Wajib Untuk Arkib
                    </span>
                  )}
                </div>
                <select 
                  value={effectiveYear} 
                  onChange={e => {
                    const newYear = e.target.value;
                    const yearItems = riceTypes.filter((r: any) => r.activeYear === newYear);
                    const isWangi = selectedRice?.name.toLowerCase().includes('wangi') || selectedRice?.code?.includes('DW') || isReceiptDW;
                    const matchedItem = yearItems.find((r: any) => 
                      isWangi ? (r.name.toLowerCase().includes('wangi') || r.code?.includes('DW')) : (r.name.toLowerCase().includes('siam') || r.code?.includes('CS'))
                    ) || yearItems[0];

                    setFormData(prev => ({
                      ...prev, 
                      zakatYear: newYear, 
                      riceTypeId: matchedItem?.id || yearItems[0]?.id || prev.riceTypeId
                    }));
                  }}
                  className={`w-full bg-white rounded-2xl px-4 py-3.5 outline-none shadow-sm appearance-none cursor-pointer ${
                    isQuickMode 
                      ? 'border-2 border-amber-400 text-amber-950 font-black text-base focus:ring-2 focus:ring-amber-500' 
                      : 'border border-slate-200 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 focus:border-teal-500'
                  }`}
                >
                  {availableYears.map(year => (
                    <option key={year as string} value={year as string}>{year as string}</option>
                  ))}
                </select>
                {isQuickMode && (
                  <p className="text-[10px] text-amber-900 font-medium ml-1">
                    Tahun Zakat Hijrah resit arkib yang sedang dimasukkan ke pangkalan data.
                  </p>
                )}
              </div>

              {/* PILIHAN JENIS BERAS (DW HIJAU vs CS KUNING) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Jenis Beras (Kadar Fitrah Brunei)
                </label>
                
                {/* Butang Pintas Pilihan Visual (Warna Kertas Resit) */}
                <div className="grid grid-cols-2 gap-2.5">
                  {(() => {
                    const dwRice = displayRiceTypes.find(r => r.name.toLowerCase().includes('wangi') || r.code?.includes('DW'))
                      || riceTypes.find(r => (r.activeYear === effectiveYear) && (r.name.toLowerCase().includes('wangi') || r.code?.includes('DW')));
                    const dwPrice = dwRice?.price || (effectiveYear === '1446H' ? 2.80 : 2.84);
                    return (
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
                          ${dwPrice.toFixed(2)} / orang
                        </p>
                      </button>
                    );
                  })()}

                  {(() => {
                    const csRice = displayRiceTypes.find(r => r.name.toLowerCase().includes('siam') || r.code?.includes('CS'))
                      || riceTypes.find(r => (r.activeYear === effectiveYear) && (r.name.toLowerCase().includes('siam') || r.code?.includes('CS')));
                    const csPrice = csRice?.price || (effectiveYear === '1446H' ? 1.90 : 1.93);
                    return (
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
                          ${csPrice.toFixed(2)} / orang
                        </p>
                      </button>
                    );
                  })()}
                </div>

                {/* Dropdown Lengkap Sekiranya Terdapat Jenis Beras Tambahan */}
                <select 
                  value={selectedRice?.id || formData.riceTypeId} 
                  onChange={e => setFormData({...formData, riceTypeId: e.target.value})}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-700 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm cursor-pointer mt-1"
                >
                  {displayRiceTypes.map(type => (
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

          {/* ========================================================= */}
          {/* MEDAN BERSAMA: MAKLUMAT PEMBAYAR (KAD PINTAR & NAMA)       */}
          {/* ========================================================= */}
          
          {/* NOMBOR KAD PINTAR (DILUMPUHKAN JIKA MOD ARKIB) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between ml-1">
              <label className={`text-[11px] font-bold uppercase tracking-widest ${isQuickMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Nombor Kad Pintar {!isQuickMode && <span className="font-normal text-slate-400 capitalize text-[10px] ml-1">(Pilihan)</span>}
              </label>
              {isQuickMode && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  Tak Perlu Diisi (Mod Arkib)
                </span>
              )}
            </div>
            <input 
              type="text" 
              disabled={isQuickMode}
              placeholder={isQuickMode ? "Dikosongkan (Mod Arkib Resit Lama)" : "Contoh: 01-123456"}
              value={isQuickMode ? '' : formData.icNumber} 
              onChange={e => {
                const roman = convertArabicIndicToRomanDigits(e.target.value);
                setFormData({...formData, icNumber: roman, isVerified: false});
              }}
              className={`w-full rounded-2xl px-4 py-3.5 font-semibold outline-none shadow-sm transition-all ${
                isQuickMode 
                  ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed select-none placeholder:text-slate-400 placeholder:italic opacity-80' 
                  : 'bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder:text-slate-400'
              }`}
            />
          </div>

          {/* NAMA PEMBAYAR (DILUMPUHKAN JIKA MOD ARKIB) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className={`text-[11px] font-bold uppercase tracking-widest ${isQuickMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Nama Pembayar {!isQuickMode && <span className="font-normal text-slate-400 capitalize text-[10px] ml-1">(Pilihan)</span>}
              </label>
              {isQuickMode && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                  Tak Perlu Diisi (Mod Arkib)
                </span>
              )}
            </div>
            <div className="relative">
              <input 
                type="text" 
                disabled={isQuickMode}
                placeholder={isQuickMode ? "Arkib Zakat Fitrah (Dikosongkan)" : "Contoh: Abu bin Ali"}
                value={isQuickMode ? '' : formData.payerName} 
                onChange={e => setFormData({...formData, payerName: e.target.value})}
                className={`w-full rounded-2xl px-4 py-3.5 font-semibold outline-none shadow-sm transition-all ${
                  isQuickMode 
                    ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed select-none placeholder:text-slate-400 placeholder:italic opacity-80' 
                    : 'bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 placeholder:text-slate-400'
                }`}
              />
            </div>

            {/* CHECKBOX WAKALAH (SEMBUNYI JIKA MOD ARKIB) */}
            {!isQuickMode && (
              <div className="flex items-center gap-2 pt-1 ml-1">
                <label className="relative flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isWakalah}
                    onChange={e => setIsWakalah(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500 cursor-pointer accent-teal-600"
                  />
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    Wakalah <span className="text-[11px] font-medium text-slate-500">(Mewakili Pembayar Lain)</span>
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* MEDAN ALAMAT JIKA ZAKAT HARTA (TANPA JAWI) */}
          {formData.zakatType === 'HARTA' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                Alamat Pembayar
              </label>
              <input 
                type="text" 
                placeholder="Contoh: No. 12, Spg 34, Kg. Kiulap (Pilihan)"
                value={formData.payerAddress} 
                onChange={e => setFormData({...formData, payerAddress: e.target.value})}
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none shadow-sm transition-all placeholder:text-slate-300"
              />
            </div>
          )}

          {/* KAD JUMLAH ZAKAT KESELURUHAN */}
          <div className={`mt-3 rounded-2xl p-4 border flex justify-between items-center shadow-sm ${
            formData.zakatType === 'HARTA' 
              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' 
              : 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-100'
          }`}>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-widest ${
                formData.zakatType === 'HARTA' ? 'text-amber-800' : 'text-teal-700'
              }`}>
                {formData.zakatType === 'HARTA' ? 'Jumlah Bayaran Zakat Harta' : 'Jumlah Bayaran Zakat Fitrah'}
              </p>
              <p className={`text-[10px] mt-0.5 ${
                formData.zakatType === 'HARTA' ? 'text-amber-700' : 'text-teal-600'
              }`}>
                {formData.zakatType === 'HARTA' ? `Kategori: ${formData.hartaSubtype}` : `(${totalMuzakki} Muzakki) × $${currentPrice.toFixed(2)}`}
              </p>
            </div>
            <p className={`text-2xl font-black ${
              formData.zakatType === 'HARTA' ? 'text-amber-900' : 'text-teal-800'
            }`}>${totalAmount}</p>
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
            if (formData.zakatType === 'HARTA') {
              if (!formData.receiptNumber || formData.receiptNumber.trim().length === 0) {
                alert("Sila masukkan Nombor Resit (5-angka merah di atas kanan).");
                return;
              }
              const val = parseFloat(formData.manualTotal);
              if (isNaN(val) || val <= 0) {
                alert("Sila masukkan Jumlah Bayaran Zakat Harta ($).");
                return;
              }
            } else {
              if (!formData.receiptNumber || !formData.riceTypeId) {
                alert("Sila lengkapkan maklumat penting (Nombor Resit & Jenis Beras).");
                return;
              }
            }
            setShowConfirm(true);
          }}
          disabled={isSaving || (formData.zakatType === 'FITRAH' && riceTypes.length === 0)}
          className={`w-2/3 rounded-2xl py-4 font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 ${
            formData.zakatType === 'HARTA'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-amber-500/30'
              : (isQuickMode 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-amber-500/30'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/30')
          }`}
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            isQuickMode ? <Zap size={20} className="fill-current" /> : <Save size={20} />
          )}
          {isSaving ? 'Menyimpan Arkib...' : (isQuickMode ? 'Simpan & Imbas Seterusnya ⚡' : 'Hantar & Sah')}
        </button>
      </div>

      {/* MODAL SAHKAN REKOD */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                formData.zakatType === 'HARTA' 
                  ? 'bg-amber-100 text-amber-700' 
                  : (isQuickMode ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-600')
              }`}>
                {isQuickMode ? <Zap size={32} className="fill-current text-amber-600" /> : <AlertCircle size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800">
                {formData.zakatType === 'HARTA' 
                  ? 'Sahkan Rekod Zakat Harta' 
                  : (isQuickMode ? 'Sahkan Arkib Zakat Fitrah' : 'Sahkan Rekod Zakat Fitrah')}
              </h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                {formData.zakatType === 'HARTA' 
                  ? 'Sila pastikan 5-angka nombor resit & jumlah bayaran adalah tepat.' 
                  : (isQuickMode 
                      ? 'Mod Pantas Arkib: Nama, Kad Pintar dan Tarikh tidak direkodkan. Hanya No. Resit, Tahun Hijrah & Muzakki disimpan.' 
                      : 'Sila pastikan butiran resit adalah tepat sebelum disimpan.')}
              </p>
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3 mb-6 text-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">No. Resit</span>
                <span className={`font-mono font-black ${formData.zakatType === 'HARTA' ? 'text-red-600 text-base' : 'text-slate-900'}`}>
                  {formData.receiptNumber}
                  {formData.zakatType === 'HARTA' && (
                    <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded ml-1 font-bold">5-Angka</span>
                  )}
                  {isQuickMode && (
                    <span className="text-[10px] text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded ml-1 font-bold">Arkib</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-medium">Nama</span>
                <div className="text-right">
                  <span className="font-bold text-slate-800 max-w-[160px] truncate block">
                    {isQuickMode ? 'Arkib Zakat Fitrah' : (formData.payerName || 'Pembayar Zakat')}
                  </span>
                  {isQuickMode ? (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                      Dikosongkan (Mod Arkib)
                    </span>
                  ) : (isWakalah && (
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                      Wakalah (Mewakili)
                    </span>
                  ))}
                </div>
              </div>
              
              {formData.zakatType === 'HARTA' ? (
                <>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Kategori Harta</span>
                    <span className="font-bold text-amber-900">{formData.hartaSubtype}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Kaedah Bayaran</span>
                    <span className="font-bold text-slate-800">
                      {formData.hartaPaymentMethod === 'CEK' ? (formData.bankName ? `Cek (${formData.bankName})` : 'Cek / Bank') : 'Tunai'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Beras</span>
                    <span className="font-bold text-slate-800">
                      {selectedRice?.name || (isReceiptDW ? 'Beras Wangi' : 'Beras Siam')}
                      <span className="text-xs font-semibold text-slate-500 ml-1.5">
                        (${currentPrice.toFixed(2)})
                      </span>
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Jumlah Muzakki</span>
                    <span className="font-bold text-teal-700">
                      {totalMuzakki} Orang ({formData.dependents === 0 ? 'Tiada Tanggungan' : `${formData.dependents} Tanggungan`})
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-1 items-center">
                <span className={`font-bold uppercase tracking-wider text-xs mt-1 ${
                  formData.zakatType === 'HARTA' ? 'text-amber-800' : 'text-teal-600'
                }`}>
                  Jumlah Bayaran
                </span>
                <span className={`text-2xl font-black ${
                  formData.zakatType === 'HARTA' ? 'text-amber-900' : 'text-teal-700'
                }`}>
                  ${totalAmount}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="w-1/2 bg-slate-100 text-slate-600 font-bold py-3.5 rounded-xl active:scale-95 transition-all">
                Semak Semula
              </button>
              <button 
                onClick={handleSave} 
                className={`w-1/2 font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center ${
                  formData.zakatType === 'HARTA' 
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-amber-500/30' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/30'
                }`}
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
