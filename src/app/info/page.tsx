import React from 'react';
import { 
  BookOpen, Smartphone, Zap, ShieldCheck, ListOrdered, 
  Camera, Save, ArrowLeft, FileText, CheckCircle2, AlertTriangle, Archive
} from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function InfoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  const isLoggedIn = !!token;

  return (
    <div className={`min-h-screen bg-[#F8FAFC] ${isLoggedIn ? 'pb-[100px]' : 'pb-8'}`}>
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          {!isLoggedIn && (
            <Link href="/login" className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
              <ArrowLeft size={20} />
            </Link>
          )}
          <div>
            <h1 className="font-bold text-slate-800 tracking-tight text-lg">Info &amp; Panduan</h1>
            <p className="text-[11px] text-teal-600 font-semibold">Sistem OCR Resit Zakat Fitrah &amp; Harta</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        


        {/* ============================================================== */}
        {/* 2. CIRI FORMAT RESIT: FITRAH (SEGI EMPAT) VS HARTA (LANSKAP)    */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="bg-teal-50 text-teal-600 p-2.5 rounded-2xl">
              <FileText size={22} />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 block">Panduan Pengecaman OCR</span>
              <h2 className="text-base font-black text-slate-800">Format Fizikal Resit</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Kad Ciri Resit Zakat Fitrah */}
            <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-900 text-sm">🌾 Resit Zakat Fitrah</span>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-teal-200">
                  Segi Empat (1:1)
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-600 text-[11px] pt-1">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={14} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Kertas Khas:</strong> Hijau (DW) atau Kuning (CS).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={14} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Nombor Resit:</strong> Kod awalan <strong>DW / CS</strong> berserta 6 angka.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={14} className="text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Kadar:</strong> Wangi ($2.84) / Siam ($1.93) &times; bilangan muzakki.</span>
                </li>
              </ul>
            </div>

            {/* Kad Ciri Resit Zakat Harta */}
            <div className="p-4 rounded-2xl border border-amber-300 bg-amber-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-sm">🪙 Resit Zakat Harta</span>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
                  Lanskap (16:9)
                </span>
              </div>
              <ul className="space-y-1.5 text-slate-600 text-[11px] pt-1">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Kertas Khas:</strong> Kertas Putih bersaiz memanjang lanskap.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Nombor Resit:</strong> <strong>5 Angka MERAH di atas kanan</strong> (Tiada kod resit).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <span><strong>Kolum:</strong> Amaun terus ($), Wang Simpanan/Emas, Tunai/Cek.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>



        {/* ============================================================== */}
        {/* ============================================================== */}
        {/* SOP PENGIMBASAN STAF                                           */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="bg-purple-50 text-purple-600 p-2.5 rounded-2xl">
              <ListOrdered size={22} />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 block">SOP Pengimbasan</span>
              <h2 className="text-base font-black text-slate-800">Panduan Operasi Staf</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            
            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Pilih Zakat</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Pilih antara Zakat Fitrah atau Zakat Harta.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Imbas Resit</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Gunakan kamera atau muat naik dari galeri. AI akan baca automatik.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Sahkan & Simpan</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Pastikan nombor resit dan maklumat lain tepat, kemudian tekan simpan. Selesai!
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
