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
            <h1 className="font-bold text-slate-800 tracking-tight text-lg">Info &amp; Dalil Sistem</h1>
            <p className="text-[11px] text-teal-600 font-semibold">Sistem OCR Resit Zakat Fitrah &amp; Harta</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* ============================================================== */}
        {/* 1. DALIL KEWAJIPAN ZAKAT (AL-QURAN & HADIS SAHIH DENGAN NOMBOR)*/}
        {/* ============================================================== */}
        <section className="bg-gradient-to-br from-teal-800 via-teal-900 to-emerald-950 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
          <div className="absolute -top-6 -right-6 opacity-10 pointer-events-none">
            <BookOpen size={160} />
          </div>

          <div className="flex items-center gap-2.5 mb-4">
            <span className="bg-teal-500/20 text-teal-300 p-2 rounded-xl border border-teal-400/30">
              <BookOpen size={20} />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300 block">Kalamullah &amp; As-Sunnah</span>
              <h2 className="text-lg font-black tracking-tight">Dalil Kewajipan Zakat</h2>
            </div>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            
            {/* Ayat Surah At-Taubah */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-xs space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-teal-200 border-b border-white/10 pb-1.5">
                <span>Surah At-Taubah : Ayat 103</span>
                <span className="text-[10px] bg-teal-500/30 px-2 py-0.5 rounded-full font-semibold">Kewajipan Memungut &amp; Mendoakan</span>
              </div>
              <p className="text-right font-serif text-lg leading-loose tracking-wide pt-1 text-teal-50">
                خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا وَصَلِّ عَلَيْهِمْ ۖ إِنَّ صَلَاتَكَ سَكَنٌ لَّهُمْ ۗ وَاللَّهُ سَمِيعٌ عَلِيمٌ
              </p>
              <p className="text-slate-200 text-[11px] italic font-medium pt-1">
                &ldquo;Ambillah zakat daripada sebahagian harta mereka, dengan zakat itu kamu membersihkan dan mensucikan mereka dan doakanlah untuk mereka. Sesungguhnya doa kamu itu (menjadi) ketenteraman jiwa bagi mereka. Dan Allah Maha Mendengar lagi Maha Mengetahui.&rdquo;
              </p>
            </div>

            {/* Hadis Sahih Zakat Fitrah */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-xs space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-teal-200 border-b border-white/10 pb-1.5 flex-wrap gap-1">
                <span>Hadis Sahih Zakat Fitrah</span>
                <span className="text-[10px] bg-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded-full font-bold">
                  Bukhari No. 1503 • Muslim No. 984
                </span>
              </div>
              <p className="text-right font-serif text-base leading-loose text-teal-50 pt-1">
                عَنْ ابْنِ عُمَرَ رَضِيَ اللَّهُ عَنْهُمَا قَالَ: «فَرَضَ رَسُولُ اللَّهِ ﷺ زَكَاةَ الْفِطْرِ صَاعًا مِنْ تَمْرٍ أَوْ صَاعًا مِنْ شَعِيرٍ عَلَى الْعَبْدِ وَالْحُرِّ وَالذَّكَرِ وَالأُنْثَى وَالصَّغِيرِ وَالْكَبِيرِ مِنْ الْمُسْلِمِينَ، وَأَمَرَ بِهَا أَنْ تُؤَدَّى قَبْلَ خُرُوجِ النَّاسِ إِلَى الصَّلَاةِ»
              </p>
              <p className="text-slate-200 text-[11px] italic font-medium pt-1">
                Dari Sayyidina Ibnu Umar r.a. berkata: &ldquo;Rasulullah ﷺ telah memfardhukan zakat fitrah sebanyak satu sha&apos; kurma atau satu sha&apos; gandum ke atas setiap hamba dan orang merdeka, lelaki dan perempuan, kanak-kanak dan dewasa daripada kalangan orang Islam; dan Baginda memerintahkan agar ia ditunaikan sebelum orang ramai keluar menunaikan solat (Hari Raya).&rdquo;
              </p>
              <p className="text-[10px] text-teal-200 pt-0.5">
                *Ketetapan MUIB: 1 sha&apos; disukat bersamaan <strong>2.268 kilogram beras</strong> makanan asasi penduduk Negara Brunei Darussalam.
              </p>
            </div>

            {/* Hadis Sahih Zakat Harta */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-xs space-y-2">
              <div className="flex justify-between items-center text-[11px] font-bold text-teal-200 border-b border-white/10 pb-1.5 flex-wrap gap-1">
                <span>Hadis Sahih Zakat Harta</span>
                <span className="text-[10px] bg-amber-500/40 text-amber-100 px-2 py-0.5 rounded-full font-bold">
                  Bukhari No. 1395 • Muslim No. 19
                </span>
              </div>
              <p className="text-right font-serif text-base leading-loose text-teal-50 pt-1">
                عَنِ ابْنِ عَبَّاسٍ رَضِيَ اللَّهُ عَنْهُمَا أَنَّ رَسُولَ اللَّهِ ﷺ بَعَثَ مُعَاذًا إِلَى الْيَمَنِ فَقَالَ: «...فَأَعْلِمْهُمْ أَنَّ اللَّهَ افْتَرَضَ عَلَيْهِمْ صَدَقَةً فِي أَمْوَالِهِمْ تُؤْخَذُ مِنْ أَغْنِيَائِهِمْ وَتُرَدُّ عَلَى فُقَرَائِهِمْ...»
              </p>
              <p className="text-slate-200 text-[11px] italic font-medium pt-1">
                Dari Sayyidina Ibnu Abbas r.a. bahawasanya Rasulullah ﷺ ketika mengutus Mu&apos;adz r.a. ke Yaman berpesan: &ldquo;...Maka beritahukanlah kepada mereka bahawa Allah telah memfardhukan zakat ke atas harta mereka, yang diambil daripada orang-orang kaya dalam kalangan mereka dan diagihkan kepada orang-orang fakir miskin dalam kalangan mereka.&rdquo;
              </p>
            </div>

          </div>
        </section>

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
                <span className="font-bold text-amber-950 text-sm">🪙 Resit Zakat Harta (Borang A)</span>
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
        {/* 3. PANDUAN KHAS: MOD PANTAS ARKIB (QUICK SCAN)                 */}
        {/* ============================================================== */}
        <section className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-50 rounded-3xl p-6 shadow-sm border-2 border-amber-400/60 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-500 text-slate-950 p-2.5 rounded-2xl shadow-md shadow-amber-500/20">
                <Zap size={22} className="fill-current" />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">Khas Pengarkiban Sahaja</span>
                <h2 className="text-base font-black text-slate-800">⚡ Mod Pantas Arkib (Quick Scan)</h2>
              </div>
            </div>
            <span className="text-[10px] font-black bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full border border-amber-500/30">
              Khas Resit Lama
            </span>
          </div>

          {/* Kotak Amaran Penting */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-amber-950">
            <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="block font-bold text-amber-900 text-sm">
                PERINGATAN PENTING: Jika Perlu Sahaja (Bukan Untuk Kegunaan Harian Biasa)
              </strong>
              <p className="leading-relaxed text-amber-800">
                Semasa kutipan zakat harian biasa bersama para pembayar, amil <strong>wajib</strong> merekodkan nama penuh dan nombor kad pintar sebagai amanah dan rujukan audit rasmi. 
              </p>
              <p className="leading-relaxed text-amber-800">
                Mod ini dicipta <strong>hanya jika perlu</strong> bagi tujuan mendigitalkan lambakan resit-resit Zakat Fitrah arkib tahun-tahun terdahulu secara pukal (<em>bulk historical archive</em>), di mana butiran nama/IC tidak lagi diperlukan atau telah pudar.
              </p>
            </div>
          </div>

          {/* Cara Kerja Mod Pantas Arkib */}
          <div className="space-y-2.5 text-xs text-slate-600">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Archive size={16} className="text-amber-600" />
              <span>Tingkah Laku Sistem Dalam Mod Pantas:</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="font-bold text-slate-700 block text-xs">Medan Dilumpuhkan (Greyed Out):</span>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li><strong>Nombor Kad Pintar:</strong> Ditutup (Tak Perlu Diisi).</li>
                  <li><strong>Nama Pembayar:</strong> Ditutup (Arkib Zakat Fitrah).</li>
                  <li><strong>Tarikh Bayaran:</strong> Ditutup (Tak Perlu Diisi).</li>
                  <li><strong>Checkbox Wakalah:</strong> Disembunyikan.</li>
                </ul>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs space-y-1">
                <span className="font-bold text-emerald-800 block text-xs">Medan Wajib Disahkan:</span>
                <ul className="list-disc list-inside space-y-1 text-emerald-700">
                  <li><strong>Nombor Resit:</strong> DW / CS + 6 angka.</li>
                  <li><strong>Tahun Zakat:</strong> Tahun Hijrah arkib (cth: 1445H).</li>
                  <li><strong>Jenis Beras:</strong> Wangi ($2.84) / Siam ($1.93).</li>
                  <li><strong>Bilangan Muzakki:</strong> Jumlah tanggungan.</li>
                </ul>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              💡 <strong>Aliran Berterusan:</strong> Sebaik sahaja menekan <em>&ldquo;Simpan &amp; Imbas Seterusnya ⚡&rdquo;</em>, sistem akan menyimpan rekod arkib dan segera membuka kembali kamera tanpa keluar dari mod pantas, membolehkan puluhan resit lama diimbas berturut-turut.
            </p>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. PANDUAN PENGGUNAAN SISTEM OLEH AMIL                          */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="bg-purple-50 text-purple-600 p-2.5 rounded-2xl">
              <ListOrdered size={22} />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 block">SOP Pengimbasan</span>
              <h2 className="text-base font-black text-slate-800">Panduan Operasi Amil</h2>
            </div>
          </div>
          
          <div className="space-y-4">
            
            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Pilih Jenis Resit Melalui Pop-up</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Pilih sama ada <strong>🌾 Zakat Fitrah</strong> (Beras DW/CS), <strong>🪙 Zakat Harta</strong> (5-angka merah memanjang), atau <strong>⚡ Mod Pantas Arkib</strong> (jika mengarkibkan resit lama).
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                <Camera size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Imbas Resit Fizikal (Kamera atau Galeri)</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Togol antara <strong>Imbas Terus Kamera</strong> untuk tangkapan pantas satu ketikan, atau <strong>Dari Galeri</strong> dengan alatan zum dan putaran bagi melaraskan resit.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Semak Pengekstrakan AI &amp; Sahkan</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  AI secara automatik menukar angka bertulis Jawi ke nombor Roman dan mengisi medan berkenaan. Jika bayaran dibuat melalui wakil, tandakan kotak <strong>Wakalah</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Save size={16} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800">Penyimpanan &amp; Eksport Laporan</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Rekod disimpan ke pangkalan data beserta imej yang dimampatkan secara cekap. Pentadbir boleh memuat turun laporan kutipan dalam format Excel/CSV atau menguruskan amil secara pukal.
                </p>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
