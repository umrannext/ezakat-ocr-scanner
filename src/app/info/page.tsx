import React from 'react';
import { 
  BookOpen, HeartHandshake, Clock, Sparkles, CheckCircle2, 
  Smartphone, Zap, ShieldCheck, ListOrdered, Camera, Save, ArrowLeft, Coins, Scale 
} from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function InfoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');
  const isLoggedIn = !!token;

  return (
    <div className={`min-h-screen bg-[#F8FAFC] ${isLoggedIn ? 'pb-[110px]' : 'pb-8'}`}>
      {/* Header Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          {!isLoggedIn && (
            <Link href="/login" className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors">
              <ArrowLeft size={20} />
            </Link>
          )}
          <div>
            <h1 className="font-bold text-slate-800 tracking-tight text-lg">Panduan & Amalan Zakat</h1>
            <p className="text-[11px] text-teal-600 font-semibold">Konteks Amalan Negara Brunei Darussalam</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {/* ============================================================== */}
        {/* 1. DALIL KEWAJIPAN ZAKAT (AL-QURAN & HADIS SAHIH)              */}
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-300 block">Kalamullah & Sunnah</span>
              <h2 className="text-lg font-black tracking-tight">Dalil Kewajipan Zakat</h2>
            </div>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            {/* Ayat Surah At-Taubah */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-xs space-y-2.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-teal-200 border-b border-white/10 pb-1.5">
                <span>Surah At-Taubah : Ayat 103</span>
                <span className="text-[10px] bg-teal-500/30 px-2 py-0.5 rounded-full">Perintah Memungut & Mendoakan</span>
              </div>
              <p className="text-right font-serif text-lg leading-loose tracking-wide pt-1 text-teal-50">
                خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً تُطَهِّرُهُمْ وَتُزَكِّيهِم بِهَا وَصَلِّ عَلَيْهِمْ ۖ إِنَّ صَلَاتَكَ سَكَنٌ لَّهُمْ ۗ وَاللَّهُ سَمِيعٌ عَلِيمٌ
              </p>
              <p className="text-slate-200 text-[11px] italic font-medium pt-1">
                &ldquo;Ambillah zakat daripada sebahagian harta mereka, dengan zakat itu kamu membersihkan dan mensucikan mereka dan doakanlah untuk mereka. Sesungguhnya doa kamu itu (menjadi) ketenteraman jiwa bagi mereka. Dan Allah Maha Mendengar lagi Maha Mengetahui.&rdquo;
              </p>
            </div>

            {/* Hadis Rasmi Zakat Fitrah */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-xs space-y-2.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-teal-200 border-b border-white/10 pb-1.5">
                <span>Hadis Sahih Zakat Fitrah</span>
                <span className="text-[10px] bg-teal-500/30 px-2 py-0.5 rounded-full">Riwayat Al-Bukhari & Muslim</span>
              </div>
              <p className="text-right font-serif text-base leading-loose text-teal-50">
                عَنْ ابْنِ عُمَرَ رَضِيَ اللَّهُ عَنْهُمَا قَالَ: «فَرَضَ رَسُولُ اللَّهِ ﷺ زَكَاةَ الْفِطْرِ صَاعًا مِنْ تَمْرٍ أَوْ صَاعًا مِنْ شَعِيرٍ عَلَى الْعَبْدِ وَالْحُرِّ وَالذَّكَرِ وَالأُنْثَى وَالصَّغِيرِ وَالْكَبِيرِ مِنْ الْمُسْلِمِينَ»
              </p>
              <p className="text-slate-200 text-[11px] italic font-medium pt-1">
                Dari Sayyidina Ibnu Umar r.a. berkata: &ldquo;Rasulullah ﷺ telah memfardhukan zakat fitrah sebanyak satu sha&apos; kurma atau satu sha&apos; gandum ke atas setiap hamba dan orang merdeka, lelaki dan perempuan, kanak-kanak dan dewasa daripada kalangan orang Islam.&rdquo;
              </p>
              <p className="text-[10px] text-teal-200 pt-1">
                *Mengikut ketetapan Majlis Ugama Islam Brunei (MUIB), 1 sha&apos; disukat bersamaan <strong>2.268 kilogram beras</strong> makanan asasi penduduk Negara Brunei Darussalam.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. LAFAZ NIAT BERZAKAT (AMALAN MAZHAB SYAFI'I DI BRUNEI)      */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl">
              <HeartHandshake size={22} />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 block">Konteks Amalan Rasmi</span>
              <h2 className="text-base font-black text-slate-800">Lafaz Niat Berzakat</h2>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Berikut adalah panduan lafaz niat bagi pembayar zakat mengikut amalan rasmi di Negara Brunei Darussalam (Mazhab Syafi&apos;i):
          </p>

          <div className="space-y-3.5">
            {/* Niat 1: Diri Sendiri */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wide">1. Zakat Fitrah Untuk Diri Sendiri</span>
                <span className="text-[9px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">Individu</span>
              </div>
              <p className="text-right font-serif text-lg leading-loose text-emerald-950 pt-1">
                نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ الْفِطْرِ عَنْ نَفْسِي فَرْضًا لِلَّهِ تَعَالَى
              </p>
              <p className="text-xs font-semibold text-emerald-900 italic">
                &ldquo;Nawaitu an ukhrija zakātal fithri &apos;an nafsī fardhan lillāhi ta&apos;ālā&rdquo;
              </p>
              <p className="text-xs text-slate-700">
                <strong>Maksud:</strong> &ldquo;Sahaja aku mengeluarkan zakat fitrah bagi diriku sendiri, fardhu kerana Allah Ta&apos;ala.&rdquo;
              </p>
            </div>

            {/* Niat 2: Diri Sendiri & Tanggungan */}
            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-teal-800 uppercase tracking-wide">2. Diri Sendiri & Sekalian Tanggungan</span>
                <span className="text-[9px] bg-teal-600 text-white font-bold px-2 py-0.5 rounded-full">Keluarga</span>
              </div>
              <p className="text-right font-serif text-base leading-loose text-teal-950 pt-1">
                نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ الْفِطْرِ عَنِّي وَعَنْ جَمِيعِ مَنْ يَلْزَمُنِي نَفَقَتُهُمْ شَرْعًا فَرْضًا لِلَّهِ تَعَالَى
              </p>
              <p className="text-xs font-semibold text-teal-900 italic">
                &ldquo;Nawaitu an ukhrija zakātal fithri &apos;annī wa &apos;an jamī&apos;i man yalzamunī nafaqatuhum syar&apos;an fardhan lillāhi ta&apos;ālā&rdquo;
              </p>
              <p className="text-xs text-slate-700">
                <strong>Maksud:</strong> &ldquo;Sahaja aku mengeluarkan zakat fitrah bagi diriku dan bagi sekalian orang yang di bawah nafkah tanggunganku, fardhu kerana Allah Ta&apos;ala.&rdquo;
              </p>
            </div>

            {/* Niat 3: Untuk Isteri */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">3. Zakat Fitrah Untuk Isteri</span>
                <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">Isteri</span>
              </div>
              <p className="text-right font-serif text-base leading-loose text-slate-900 pt-1">
                نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ الْفِطْرِ عَنْ زَوْجَتِي فَرْضًا لِلَّهِ تَعَالَى
              </p>
              <p className="text-xs text-slate-700">
                <strong>Maksud:</strong> &ldquo;Sahaja aku mengeluarkan zakat fitrah bagi isteriku, fardhu kerana Allah Ta&apos;ala.&rdquo;
              </p>
            </div>

            {/* Niat 4: Mewakili Orang Lain */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">4. Mewakili Orang Lain (Wakalah)</span>
                <span className="text-[9px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">Wakil</span>
              </div>
              <p className="text-right font-serif text-base leading-loose text-slate-900 pt-1">
                نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ الْفِطْرِ عَنْ (...) فَرْضًا لِلَّهِ تَعَالَى
              </p>
              <p className="text-xs text-slate-700">
                <strong>Maksud:</strong> &ldquo;Sahaja aku mengeluarkan zakat fitrah bagi mewakili [sebut nama orang], fardhu kerana Allah Ta&apos;ala.&rdquo;
              </p>
            </div>

            {/* Niat 5: Zakat Harta */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-900 uppercase tracking-wide">5. Niat Zakat Harta (Borang A)</span>
                <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">Zakat Harta</span>
              </div>
              <p className="text-right font-serif text-lg leading-loose text-amber-950 pt-1">
                نَوَيْتُ أَنْ أُخْرِجَ زَكَاةَ مَالِي فَرْضًا لِلَّهِ تَعَالَى
              </p>
              <p className="text-xs font-semibold text-amber-900 italic">
                &ldquo;Nawaitu an ukhrija zakāta mālī fardhan lillāhi ta&apos;ālā&rdquo;
              </p>
              <p className="text-xs text-slate-700">
                <strong>Maksud:</strong> &ldquo;Sahaja aku mengeluarkan zakat hartaku, fardhu kerana Allah Ta&apos;ala.&rdquo;
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 3. DOA AMIL KETIKA MENERIMA ZAKAT                              */}
        {/* ============================================================== */}
        <section className="bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-white rounded-3xl p-6 shadow-sm border border-amber-300 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-amber-200 pb-3">
            <span className="bg-amber-100 text-amber-800 p-2.5 rounded-2xl">
              <Sparkles size={22} />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">Doa & Keberkatan</span>
              <h2 className="text-base font-black text-slate-900">Doa Amil Semasa Menerima Zakat</h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Sunnah bagi Amil yang dilantik oleh Kerajaan Kebawah Duli Yang Maha Mulia Paduka Seri Baginda Sultan dan Yang Di-Pertuan Negara Brunei Darussalam untuk membacakan doa ini sebaik menerima bayaran zakat:
          </p>

          {/* Doa Utama */}
          <div className="bg-white rounded-2xl p-4 border border-amber-300 shadow-xs space-y-2">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">Doa Penerimaan Rasmi:</span>
            <p className="text-right font-serif text-xl leading-loose text-slate-900 pt-1">
              آجَرَكَ اللَّهُ فِيمَا أَعْطَيْتَ، وَبَارَكَ لَكَ فِيمَا أَبْقَيْتَ، وَجَعَلَهُ لَكَ طَهُورًا
            </p>
            <p className="text-xs font-semibold text-amber-900 italic pt-1">
              &ldquo;Ājarakallāhu fīmā a&apos;thaita, wa bāraka laka fīmā abqaita, wa ja&apos;alahu laka thahūrā&rdquo;
            </p>
            <p className="text-xs text-slate-700 leading-relaxed pt-1">
              <strong>Maksudnya:</strong> &ldquo;Semoga Allah memberi pahala dan ganjaran ke atas apa yang telah engkau berikan, dan memberkati apa yang masih tinggal pada hartamu, serta menjadikannya sebagai pembersih bagimu (daripada dosa).&rdquo;
            </p>
          </div>

          {/* Doa Tambahan Penutup */}
          <div className="bg-white/80 rounded-2xl p-3.5 border border-amber-200 text-xs space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Doa Tambahan Penerimaan Amalan:</span>
            <p className="text-right font-serif text-base leading-relaxed text-slate-800">
              تَقَبَّلَ اللَّهُ مِنَّا وَمِنْكُم، رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ
            </p>
            <p className="text-[11px] text-slate-600">
              &ldquo;Semoga Allah menerima amalan daripada kami dan daripada kamu. Wahai Tuhan kami, terimalah daripada kami sesungguhnya Engkaulah Yang Maha Mendengar lagi Maha Mengetahui.&rdquo;
            </p>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 4. WAKTU-WAKTU MENGELUARKAN ZAKAT FITRAH (FEQAH BRUNEI)        */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <span className="bg-blue-50 text-blue-600 p-2.5 rounded-2xl">
              <Clock size={22} />
            </span>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 block">Hukum Feqah Mazhab Syafi&apos;i</span>
              <h2 className="text-base font-black text-slate-800">Waktu Pembayaran Zakat Fitrah</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 text-xs">
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-emerald-900">Waktu Wajib</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Apabila terbenam matahari akhir Ramadan (malam Hari Raya Aidilfitri).</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-teal-900">Waktu Afdhal (Paling Utama)</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Pagi 1 Syawal sebelum mendirikan Sembahyang Sunat Hari Raya Aidilfitri.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-blue-900">Waktu Harus (Mubah)</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Bermula dari hari pertama bulan Ramadan sehingga akhir Ramadan.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-amber-900">Waktu Makruh</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Selepas Sembahyang Sunat Hari Raya Aidilfitri sehingga sebelum terbenam matahari 1 Syawal.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 flex gap-3 items-start">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
              <div>
                <p className="font-bold text-red-900">Waktu Haram</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Selepas terbenam matahari 1 Syawal tanpa sebarang keuzuran syar&apos;ie (wajib diqada&apos;).</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 5. PANDUAN PENGGUNAAN SISTEM OCR OLEH AMIL                     */}
        {/* ============================================================== */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600">
              <ListOrdered size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 block">SOP Amil Zakat</span>
              <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-wide">Panduan Sistem OCR</h2>
            </div>
          </div>
          
          <div className="space-y-4 relative z-10">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0 mt-1">1</div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Pilih Jenis Resit di Skrin Imbas</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Togol antara <strong>🌾 Fitrah (Segi Empat)</strong> untuk resit kertas hijau/kuning DW/CS, atau <strong>🪙 Harta (Lanskap)</strong> untuk resit putih Borang A (5 angka merah atas kanan).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0 mt-1"><Camera size={16} /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Imbas Kamera Terus atau Dari Galeri</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Pastikan keseluruhan resit dan nombor bilangan berada di dalam petak panduan neon secara terang dan tidak kabur.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0 mt-1">3</div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Semak Pengekstrakan AI & Sahkan</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  AI akan mengekstrak nombor resit, nama pembayar, dan harga. Amil boleh membuat pembetulan manual sekiranya terdapat sebarang ralat sebelum menekan butang <strong>Hantar &amp; Sah</strong>.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black shrink-0 mt-1"><Save size={16} /></div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Penyimpanan &amp; Eksport Laporan</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Rekod disimpan secara automatik dalam pangkalan data dan salinan imej dimampatkan untuk rujukan pantas di tab Rekod.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
