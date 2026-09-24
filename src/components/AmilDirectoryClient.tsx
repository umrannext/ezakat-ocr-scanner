"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, MapPin, Phone, UserCircle2, Search, Filter, 
  Eye, EyeOff, Download, Upload, FileSpreadsheet, RefreshCw, 
  CheckCircle2, AlertCircle, X, Loader2, Sparkles, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';

export type AmilData = {
  id: string;
  name: string;
  loginId: string;
  position: string | null;
  phoneNumber: string | null;
  mosque: {
    name: string;
    phoneNumber: string | null;
    zone: { name: string } | null;
  } | null;
  receipts: { totalAmount: number }[];
};

export default function AmilDirectoryClient({ initialAmils = [] }: { initialAmils?: AmilData[] }) {
  const [amils, setAmils] = useState<AmilData[]>(initialAmils);
  const [loading, setLoading] = useState(initialAmils.length === 0);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('Semua Zon');
  const [showFullInfo, setShowFullInfo] = useState(true);

  // State Modal Bulk Assign
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [parsedAmils, setParsedAmils] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil senarai Amil dari API
  const fetchAmils = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/amils');
      const json = await res.json();
      if (res.ok && json.success) {
        setAmils(json.data || []);
      } else {
        setError(json.error || 'Gagal memuatkan senarai amil');
      }
    } catch (err: any) {
      setError('Ralat sambungan. Sila semak sambungan internet anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAmils.length === 0) {
      fetchAmils();
    }
  }, []);

  // 1. FUNGSI MUAT TURUN TEMPLATE EXCEL (.XLSX)
  const downloadTemplate = () => {
    const headers = [
      "ID Amil",
      "Nama Penuh",
      "Kata Laluan",
      "Jawatan",
      "No Telefon",
      "Nama Masjid",
      "Zon"
    ];

    const sampleRows = [
      [
        "AMIL-Z01-001",
        "Haji Ahmad bin Haji Kassim",
        "123456",
        "Ketua Amil",
        "+673 8712345",
        "Masjid Omar Ali Saifuddien",
        "Zon 1 (Brunei Muara)"
      ],
      [
        "AMIL-Z01-002",
        "Awangku Mohd Ali bin Pengiran Besar",
        "123456",
        "Bilal 1",
        "+673 8823456",
        "Masjid Jame' Asr Hassanil Bolkiah",
        "Zon 1 (Brunei Muara)"
      ],
      [
        "AMIL-Z02-001",
        "Pengiran Zainal bin Pengiran Othman",
        "123456",
        "Imam",
        "+673 8934567",
        "Masjid Hassanal Bolkiah Tutong",
        "Zon 2 (Tutong)"
      ]
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Tetapkan kelebaran lajur agar kemas dan mudah dibaca
    ws['!cols'] = [
      { wch: 16 }, // ID Amil
      { wch: 35 }, // Nama Penuh
      { wch: 14 }, // Kata Laluan
      { wch: 16 }, // Jawatan
      { wch: 16 }, // No Telefon
      { wch: 36 }, // Nama Masjid
      { wch: 24 }  // Zon
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Senarai_Amil");
    XLSX.writeFile(wb, "Template_Senarai_Amil_Zakat.xlsx");
  };

  // 2. FUNGSI PARSE FAIL EXCEL / CSV YANG DIMUAT NAIK
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!rawJson || rawJson.length === 0) {
          alert("Fail Excel kosong atau tidak mempunyai data yang sah.");
          return;
        }

        // Petakan lajur secara pintar (sokong Bahasa Melayu & Inggeris)
        const mapped = rawJson.map((row) => ({
          loginId: String(row["ID Amil"] || row["ID"] || row["loginId"] || row["Login ID"] || "").trim(),
          name: String(row["Nama Penuh"] || row["Nama"] || row["name"] || "").trim(),
          password: String(row["Kata Laluan"] || row["Password"] || row["password"] || "123456").trim(),
          position: String(row["Jawatan"] || row["Position"] || row["position"] || "Amil Lantikan").trim(),
          phoneNumber: String(row["No Telefon"] || row["Telefon"] || row["Phone"] || row["phoneNumber"] || "").trim(),
          mosqueName: String(row["Nama Masjid"] || row["Masjid"] || row["Surau"] || row["mosqueName"] || "").trim(),
          zoneName: String(row["Zon"] || row["Zone"] || row["zoneName"] || "").trim(),
        })).filter(r => r.loginId && r.name);

        if (mapped.length === 0) {
          alert("Tiada rekod amil yang sah dijumpai. Pastikan lajur 'ID Amil' dan 'Nama Penuh' diisi.");
          return;
        }

        setParsedAmils(mapped);
      } catch (err) {
        console.error("Ralat membaca fail Excel:", err);
        alert("Gagal membaca fail Excel. Pastikan format fail adalah .xlsx atau .csv.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // 3. FUNGSI HANTAR BULK ASSIGN KE BACKEND
  const submitBulkAssign = async () => {
    if (parsedAmils.length === 0) return;
    setIsUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch('/api/amils/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amils: parsedAmils })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadResult({
          success: true,
          message: data.message || `Berjaya memproses ${parsedAmils.length} amil.`
        });
        setParsedAmils([]);
        setFileName('');
        // Muat semula direktori amil secara automatik
        fetchAmils();
      } else {
        setUploadResult({
          success: false,
          message: data.error || 'Gagal menyimpan lantikan amil.'
        });
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: 'Ralat sambungan pelayan. Sila cuba lagi.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Extract unique zones
  const zones = ['Semua Zon', ...Array.from(new Set(amils.map(a => a.mosque?.zone?.name).filter(Boolean)))];

  // Filter amils
  const filteredAmils = amils.filter(amil => {
    const matchesSearch = amil.name.toLowerCase().includes(searchQuery.toLowerCase()) || amil.loginId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'Semua Zon' || amil.mosque?.zone?.name === selectedZone;
    return matchesSearch && matchesZone;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[100px]">
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 border-b border-slate-200/50">
        <h1 className="font-bold text-slate-800 ml-2 tracking-tight text-lg">Direktori Amil</h1>
        <div className="flex items-center gap-2 mr-1">
          <button 
            type="button"
            onClick={fetchAmils}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-teal-600 active:rotate-180 transition-all disabled:opacity-50"
            title="Muat semula senarai"
          >
            <RefreshCw size={17} className={loading ? "animate-spin text-teal-600" : ""} />
          </button>
          <div className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">
            {filteredAmils.length} Amil
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* PANEL KHAS ADMIN: BULK ASSIGN & TEMPLATE EXCEL */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-800 rounded-3xl p-4.5 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white/15 rounded-xl backdrop-blur-md">
                <FileSpreadsheet size={20} className="text-teal-200" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">Pengurusan Pukal Amil (Excel)</h3>
                <p className="text-[11px] text-teal-100 font-medium">Lantik & kemaskini sehingga 180+ amil serentak</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1 relative z-10">
            {/* Butang 1: Muat Turun Template */}
            <button
              type="button"
              onClick={downloadTemplate}
              className="bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 text-white rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-xs"
            >
              <Download size={15} className="text-teal-300" />
              <span>Download Template</span>
            </button>

            {/* Butang 2: Buka Modal Bulk Assign */}
            <button
              type="button"
              onClick={() => {
                setShowBulkModal(true);
                setUploadResult(null);
                setParsedAmils([]);
                setFileName('');
              }}
              className="bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 rounded-2xl py-2.5 px-3 flex items-center justify-center gap-2 text-xs font-black transition-all shadow-md shadow-teal-950/20"
            >
              <Upload size={15} />
              <span>Bulk Assign (XLSX)</span>
            </button>
          </div>
        </div>

        {/* Controls: Search & Filter */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 sticky top-[72px] z-10">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <select 
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm font-semibold text-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {zones.map((z) => (
                  <option key={z as string} value={z as string}>{z}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => setShowFullInfo(!showFullInfo)}
              className={`p-2 rounded-xl flex items-center justify-center border transition-colors ${showFullInfo ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
              title={showFullInfo ? "Sembunyikan Maklumat" : "Papar Maklumat Penuh"}
            >
              {showFullInfo ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Amil List */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 animate-pulse">
                  <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
              <AlertCircle size={32} className="text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-amber-800">{error}</p>
              <button
                type="button"
                onClick={fetchAmils}
                className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 active:scale-95 transition-all shadow-sm"
              >
                Cuba Semula
              </button>
            </div>
          ) : filteredAmils.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-8 shadow-xs">
              <Users size={40} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-600 font-bold text-sm">Tiada Amil ditemui.</p>
              <p className="text-slate-400 text-xs mt-1">Gunakan butang Bulk Assign untuk melantik amil baru.</p>
            </div>
          ) : (
            filteredAmils.map(amil => (
              <div key={amil.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                <div className="p-4 border-b border-slate-50 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 flex items-start gap-4">
                  <div className="bg-teal-100 p-3 rounded-full text-teal-600 mt-1 shrink-0">
                    <UserCircle2 size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-[15px] truncate">{amil.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">{amil.position || 'Amil Lantikan'}</span>
                      <span className="text-slate-400 text-xs font-medium font-mono">ID: {amil.loginId}</span>
                    </div>
                  </div>
                </div>
                
                {showFullInfo && (
                  <div className="p-4 space-y-3 bg-white animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-slate-400 mt-0.5 shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-bold text-slate-700">{amil.mosque?.name || 'Tiada Masjid Ditetapkan'}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{amil.mosque?.zone?.name || 'Tiada Zon'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-2">
                        <Phone className="text-teal-500 shrink-0" size={14} />
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tel Amil</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{amil.phoneNumber || '-'}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-2">
                        <Phone className="text-slate-400 shrink-0" size={14} />
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tel Masjid</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{amil.mosque?.phoneNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kutipan Amil Ini</p>
                      <div className="text-right">
                        <p className="text-sm font-black text-teal-600">${(amil.receipts || []).reduce((sum, r) => sum + (r.totalAmount || 0), 0).toFixed(2)}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{(amil.receipts || []).length} Resit</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL INTERAKTIF: BULK ASSIGN AMIL DENGAN PREVIEW DARI FAIL    */}
      {/* ============================================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Bulk Assign Amils</h3>
                  <p className="text-xs text-slate-400 font-medium">Muat naik fail Excel (.xlsx) atau .csv</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBulkModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 active:scale-90 transition-all"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="my-4 overflow-y-auto flex-1 space-y-4 pr-1">
              {/* Petak Muat Naik Fail */}
              <input 
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/40 hover:bg-teal-50/80 rounded-2xl p-6 text-center cursor-pointer transition-all active:scale-[0.99] flex flex-col items-center justify-center group"
              >
                <div className="p-3 bg-white rounded-2xl shadow-sm text-teal-600 mb-2 group-hover:scale-110 transition-transform">
                  <Upload size={24} />
                </div>
                <p className="text-xs font-bold text-teal-900">
                  {fileName ? fileName : 'Pilih fail Excel / CSV dari peranti'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format disokong: .xlsx, .xls, .csv
                </p>
              </div>

              {/* Status & Hasil Pemprosesan */}
              {uploadResult && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 text-xs ${
                  uploadResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                    : 'bg-red-50 text-red-900 border border-red-200'
                }`}>
                  {uploadResult.success ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{uploadResult.success ? 'Berjaya!' : 'Ralat!'}</p>
                    <p className="mt-0.5 opacity-90">{uploadResult.message}</p>
                  </div>
                </div>
              )}

              {/* Pratonton Data Amil yang Dikesan */}
              {parsedAmils.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-bold text-slate-700">
                      Pratonton ({parsedAmils.length} Amil Dikesan)
                    </span>
                    <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-bold">
                      Format Tepat ✓
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 max-h-48 overflow-y-auto border border-slate-200 space-y-2 divide-y divide-slate-200/60 text-xs">
                    {parsedAmils.slice(0, 8).map((a, idx) => (
                      <div key={idx} className={idx > 0 ? "pt-2" : ""}>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{a.name}</span>
                          <span className="font-mono font-bold text-teal-700 text-[11px]">{a.loginId}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {a.mosqueName || 'Masjid'} • {a.position || 'Amil Lantikan'}
                        </p>
                      </div>
                    ))}
                    {parsedAmils.length > 8 && (
                      <p className="text-[11px] text-slate-400 text-center pt-2 italic">
                        + {parsedAmils.length - 8} amil lagi...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Panduan Ringkas */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-[11px] text-slate-500 space-y-1">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <Sparkles size={13} className="text-teal-600" />
                  Petua Admin:
                </p>
                <p>1. Muat turun template untuk memastikan susunan lajur betul.</p>
                <p>2. Kata laluan awal amil akan ditetapkan secara automatik (default: 123456).</p>
                <p>3. Amil sedia ada dengan ID yang sama akan dikemaskini tanpa menduplikasi data.</p>
              </div>
            </div>

            {/* Butang Tindakan */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs active:scale-95 transition-all"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={submitBulkAssign}
                disabled={isUploading || parsedAmils.length === 0}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sedang Memproses...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Lantik {parsedAmils.length > 0 ? `${parsedAmils.length} Amil` : ''}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
