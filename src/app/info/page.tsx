import React from 'react';
import { Smartphone, Zap, ShieldCheck, ListOrdered, Camera, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function InfoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  const isLoggedIn = !!token;

  return (
    <div className={`min-h-screen bg-[#F8FAFC] ${isLoggedIn ? 'pb-[100px]' : 'pb-6'}`}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          {!isLoggedIn && (
            <Link href="/login" className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
              <ArrowLeft size={20} />
            </Link>
          )}
          <h1 className="font-bold text-slate-800 tracking-tight text-lg">Info & Panduan Sistem</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* Info Sistem */}
        <section className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-3xl p-6 shadow-md text-white relative overflow-hidden">
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <Smartphone size={120} />
          </div>
          <h2 className="text-[15px] font-black uppercase tracking-wide mb-3 relative z-10">E-Zakat OCR Scanner</h2>
          <div className="relative z-10 space-y-3">
            <p className="text-sm font-medium leading-relaxed opacity-95">
              Aplikasi ini dibangunkan khusus untuk memudahkan tugas Amil menguruskan rekod kutipan Zakat Fitrah secara digital sepenuhnya.
            </p>
            <p className="text-sm font-medium leading-relaxed opacity-95">
              Dengan menggunakan teknologi <span className="font-bold text-teal-100">OCR (Optical Character Recognition)</span> berasaskan AI, sistem ini mampu membaca resit fizikal dan mengekstrak maklumat secara automatik ke dalam pangkalan data.
            </p>
          </div>
        </section>

        {/* Objektif */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
           <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
              <Zap size={22} />
            </div>
            <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-wide">Objektif Utama</h2>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="bg-teal-100 text-teal-600 p-3 rounded-2xl"><Zap size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Pantas & Cekap</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tiada lagi kemasukan data secara manual yang memakan masa.</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl"><ShieldCheck size={20} /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Tepat & Selamat</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mengurangkan ralat manusia (human error) semasa merekod.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Panduan Amil */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600">
              <ListOrdered size={22} />
            </div>
            <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-wide">Panduan Amil</h2>
          </div>
          
          <div className="space-y-5 relative z-10">
            
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0 mt-1">1</div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Log Masuk</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">Gunakan ID dan Kata Laluan rasmi yang diberikan oleh pihak pentadbir (Admin).</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0 mt-1"><Camera size={16} /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Imbas Resit</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">Tekan butang <span className="font-bold text-teal-600">Imbas</span> di tengah menu. Tangkap gambar resit zakat fizikal yang jelas. Pastikan teks boleh dibaca.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0 mt-1">3</div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Semak Data AI</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">AI akan membaca resit tersebut. <span className="font-bold text-red-500">Penting:</span> Semak semula data (Nama, Nombor Kad Pengenalan, Harga) yang diekstrak. Buat pembetulan secara manual jika AI tersalah baca.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0 mt-1"><Save size={16} /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Simpan & Semak Rekod</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">Tekan Simpan. Anda boleh melihat sejarah kutipan anda di tab <span className="font-bold text-teal-600">Rekod</span> dan jumlah keseluruhan di tab <span className="font-bold text-teal-600">Utama</span>.</p>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
