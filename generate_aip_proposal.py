from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

doc = Document()
doc.styles['Normal'].font.name = 'Arial'
doc.styles['Normal'].font.size = Pt(11)

def add_heading(text, level=1):
    h = doc.add_heading(text, level=level)
    h.style.font.name = 'Arial'
    h.style.font.bold = True
    if level == 1:
        h.style.font.size = Pt(14)
    elif level == 2:
        h.style.font.size = Pt(12)
    return h

def add_paragraph(text, align=None):
    p = doc.add_paragraph(text)
    if align == 'justify':
        p.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
    return p

# TITLE
title = doc.add_heading("KERTAS CADANGAN INOVASI PERKHIDMATAN AWAM\nSISTEM PENGIMBAS RESIT ZAKAT PINTAR (E-ZAKAT OCR)", 0)
title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

add_heading("RINGKASAN EKSEKUTIF", level=1)
add_paragraph("Sistem Pengimbas Resit Zakat Pintar (E-Zakat OCR) ialah inovasi pengurusan digital berasaskan teknologi Kecerdasan Buatan (AI) Optical Character Recognition (OCR) yang direka untuk Jabatan Urusan Zakat Wakaf & Baitulmal (JUZWAB). Sistem ini berfungsi secara serampang dua mata: (1) Mengarkibkan resit-resit lama secara pukal (Back), dan (2) Memproses pengeluaran E-Resit baharu secara masa nyata (Forth).", align='justify')
add_paragraph("Sistem ini memperkenalkan pendekatan tanpa kertas (paperless) melalui penyediaan aplikasi web (Web-Based Application) yang boleh diakses menerusi pelayar internet di peranti Android dan iOS. Ia memaparkan analitik kutipan masa nyata (real-time dashboard), menyepadukan pengiraan lebihan wang kepada tabung sedekah, serta memastikan pengekalan rekod rujukan awan (Cloud Retention). JUZWAB dapat meminimumkan kesilapan kemasukan data (human error), mempercepat pemprosesan resit, serta mengatasi cabaran ruang penyimpanan arkib fizikal.", align='justify')

add_heading("ABSTRAK", level=1)
add_paragraph("Transformasi digital menuntut perkhidmatan awam yang lebih strategik, responsif dan pantas. Namun pada peringkat kutipan zakat, proses penulisan resit 3 salinan oleh amil lazimnya masih manual dan berulang, menyebabkan kelambatan penyerahan (data backlog), kesilapan manusia, serta masalah pengurusan ruang arkib. Sehubungan itu, E-Zakat OCR dibangunkan sebagai platform pintar yang menggabungkan automasi bacaan AI, janaan Kod QR E-Resit, serta fungsi hibrid mod luar talian (Offline PWA). Pelaksanaan inovasi ini mentransformasikan proses kutipan, menyediakan Papan Pemuka Analitik (Dashboard) bagi pemantauan zon, dan membolehkan pengekstrakan data berstruktur secara langsung. Ia berpotensi besar diperluas ke semua zon dan cawangan amil sebagai model inovasi pengurusan kutipan digital yang mampan.", align='justify')

add_heading("1. PENDAHULUAN", level=1)
add_paragraph("JUZWAB memainkan peranan yang sangat kritikal dalam memangkin sosioekonomi umat Islam melalui sistem kutipan dan agihan zakat. Proses kutipan secara tradisinya bergantung kepada buku resit fizikal berkarbon yang memakan masa, mahal dari segi percetakan, dan berisiko tinggi terhadap kehilangan dan kerosakan dokumen.", align='justify')

add_heading("1.1 TUJUAN", level=2)
add_paragraph("Kertas cadangan ini bertujuan mengemukakan E-Zakat OCR sebagai inovasi perkhidmatan awam untuk penyertaan Anugerah Inovasi Perdana (AIP) 2025. Ia menawarkan penyelesaian praktikal, efisien, dan berimpak tinggi bagi menyelesaikan isu kelewatan perekodan dan percetakan dokumen kewangan JUZWAB.", align='justify')

add_heading("1.2 OBJEKTIF PROJEK", level=2)
doc.add_paragraph("Mendigitalkan proses perekodan resit zakat secara serta-merta sejurus transaksi berlaku melalui teknologi AI OCR.", style='List Bullet')
doc.add_paragraph("Mewujudkan platform yang serasi merentas peranti (Android/iOS) berasaskan Progressive Web App (PWA) tanpa perlu dimuat turun.", style='List Bullet')
doc.add_paragraph("Menghapuskan penggunaan 3 salinan kertas resit karbon menerusi peralihan kepada E-Resit Kod QR bersepadu.", style='List Bullet')
doc.add_paragraph("Meningkatkan ketelusan pemantauan (Dashboard) serta integriti pengurusan data melalui pengeksportan automatik (CSV).", style='List Bullet')

add_heading("1.3 KETERCAPAIAN PROJEK", level=2)
add_paragraph("E-Zakat OCR direalisasikan menerusi teknologi inovatif dan seni bina moden (kos rendah dan terskala):", align='justify')
doc.add_paragraph("Infrastruktur awan (Edge Cloud) membolehkan pemprosesan tanpa pelayan fizikal berat.", style='List Bullet')
doc.add_paragraph("Pangkalan Data bersepadu (Supabase PostgreSQL) mengurus rekod masa nyata yang terjamin.", style='List Bullet')
doc.add_paragraph("Reka bentuk antara muka (UI/UX) berasaskan Tailwind CSS yang sangat responsif, kemas dan dinamik.", style='List Bullet')
doc.add_paragraph("Integrasi AI OCR bagi menterjemahkan data gambar ke teks bertaip secara automatik.", style='List Bullet')

add_heading("1.4 RASIONAL PROJEK", level=2)
add_paragraph("Membuat penambahbaikan proses pengurusan resit zakat agar lebih lengkap, teratur serta mempercepatkan urusan tadbir urus (Ease of Doing Business). Ia menyediakan platform paperless kos-efektif untuk JUZWAB memantau kutipan, mengurus lebihan sedekah, dan meningkatkan efisiensi amil secara keseluruhan.", align='justify')

add_heading("2. LATAR BELAKANG & ANALISIS MASALAH", level=1)
add_heading("2.1 ISU SEMASA", level=2)
doc.add_paragraph("Kos Percetakan: Penggunaan 3 salinan kertas resit melibatkan bajet yang tinggi. Kualiti tulisan tembus karbon juga kerap tidak jelas (illegible).", style='List Bullet')
doc.add_paragraph("Data Backlog: Amil adakalanya lewat menyerahkan buku fizikal ke ibu pejabat, menyebabkan kerja kemasukan data tergendala berhari-hari.", style='List Bullet')
doc.add_paragraph("Arkib Keselamatan: Ruang simpanan berskala besar dan berhawa dingin diperlukan bagi mengelakkan kerosakan kotak-kotak fail kertas bertahun lamanya.", style='List Bullet')
doc.add_paragraph("Kesukaran Menjana Analitik: Penjumlahan kutipan secara manual membantutkan keupayaan pengesanan trend mengikut zon atau cawangan dengan tepat.", style='List Bullet')

add_heading("2.2 ANALISIS MASALAH", level=2)
add_paragraph("Punca utama kelewatan dan isu operasi berpunca daripada ketiadaan sistem bersepadu yang membolehkan amil membuat catatan langsung (direct-entry) sewaktu bersemuka dengan muzakki. Kebergantungan sepenuhnya kepada salinan fizikal menafikan kelebihan pendigitalan moden seperti pelaporan masa nyata dan pemantauan aliran tunai berpusat.", align='justify')

add_heading("3. SPESIFIKASI & INOVASI SISTEM", level=1)
add_heading("3.1 KOMPONEN UTAMA SISTEM (INOVASI TEKNIKAL)", level=2)
add_paragraph("A. Mekanisme 'Back and Forth':", align='justify')
doc.add_paragraph("Mod Terkini (Forth): Digunakan semasa operasi aktif, menyaring nama pembayar dan menjana E-Resit Kod QR serentak (live).", style='List Bullet')
doc.add_paragraph("Mod Arkib (Back): Mod pantas memintas bacaan sekunder bagi menterjemah timbunan resit tahun-tahun lalu kepada format data berangka secara pukal.", style='List Bullet')
add_paragraph("B. Kesediaan Mod Luar Talian (Offline Mode PWA):", align='justify')
add_paragraph("Menyedari kekangan rangkaian (blank spot), sistem akan menyimpan rekod secara sementara (IndexedDB) di peranti tempatan (localstorage). Sebaik sahaja peranti mendapat sambungan isyarat semula, sistem secara automatik memuat naik (auto-sync) lambakan resit yang tertunggak itu secara di belakang tabir.", align='justify')
add_paragraph("C. Modul Pengiraan Sedekah Am Automatik (Integriti Kewangan):", align='justify')
add_paragraph("Menyelesaikan konflik baki wang sen; jika Muzakki membayar baki lebih dan diinfaqkan, ciri inovatif 'Wang Baki Sebagai Sedekah' memecahkan data kepada [Zakat Wajib] dan [Sedekah Am] dengan nilai tepat secara maya.", align='justify')
add_paragraph("D. Akses Rujukan Berkekalan (Cloud Retention):", align='justify')
add_paragraph("Biarpun memori fizikal peranti amil telah penuh, sistem menghubungkan mereka secara langsung dengan pangkalan data awan. Amil bebas menekan butang 'Padam Cache' (membersihkan gambar di telefon bimbit) namun sejarah E-Resit sentiasa kekal tersimpan dan boleh diakses menerusi Papan Pemuka Amil tanpa sebarang had waktu mahupun isu kehilangan.", align='justify')
add_paragraph("E. Sekatan Pendua Pintar (Duplicate Blocker):", align='justify')
add_paragraph("Jika amil secara tidak sengaja mengimbas resit yang pernah direkodkan, sistem segera mengesan Nombor Resit yang sama dan menyekat pendaftaran tersebut serta mengeluarkan Amaran 500/400 Error di skrin bagi mengelakkan data bertindih (human error prevention).", align='justify')

add_heading("3.2 PROSES OPERASI", level=2)
doc.add_paragraph("1. Log Masuk amil/admin melalui ID unik peribadi berserta kata laluan yang disulitkan (encrypted).", style='List Number')
doc.add_paragraph("2. Amil menangkap gambar resit dan AI mengekstrak butirannya.", style='List Number')
doc.add_paragraph("3. Amil membuat semakan maklumat, menanda tetapan Wakalah (jika wakil), dan menyuntik lebihan wang ke Sedekah sekiranya ada.", style='List Number')
doc.add_paragraph("4. Amil menghantar data ke Pangkalan Data. Muzakki menerima E-Resit berserta Kod QR bukti sah.", style='List Number')
doc.add_paragraph("5. Pihak Jabatan/Admin melihat kutipan masa nyata di Dashboard dan memuat turun jadual penuh format .CSV untuk tujuan audit kewangan yang selari (synchronized).", style='List Number')

add_heading("4. HASIL & IMPAK", level=1)
add_heading("4.1 PENCAPAIAN OBJEKTIF", level=2)
doc.add_paragraph("Automasi & Kepantasan: Perekodan dan penghantaran laporan menjadi masa nyata (Real-time).", style='List Bullet')
doc.add_paragraph("Penjimatan Kos Material: Pengguguran cetakan buku resit berkarbon secara drastik yang diterjemah kepada penjimatan dana operasi organisasi.", style='List Bullet')
doc.add_paragraph("Peningkatan Ketepatan Data: Mengurangkan ralat manual (human error) seperti kecuaian kiraan baki, resit pendua (duplicate), atau maklumat pembayar yang sukar dibaca (illegible).", style='List Bullet')

add_heading("4.2 IMPAK PELANGGAN (DALAMAN & LUARAN)", level=2)
doc.add_paragraph("Muzakki (Luaran): Meningkatkan kepercayaan kepada institusi apabila menerima E-Resit digital segera (seamless) yang tahan selamanya berbanding resit kertas karbon yang luntur dakwatnya.", style='List Bullet')
doc.add_paragraph("Amil Lapangan (Dalaman): Memberikan kemudahan kepantasan kerja. Tidak perlu risau kehabisan buku resit fizikal, ruang simpanan telefon memadai, dan pemantauan rekod rujukan (Cloud Retention) yang sentiasa terjamin biarpun cache dikosongkan.", style='List Bullet')
doc.add_paragraph("Pengurusan Ibu Pejabat JUZWAB (Dalaman): Pihak Eksekutif Admin memperoleh visibiliti menyeluruh; dengan paparan pecahan Kutipan Fitrah, Harta, dan Sedekah secara tepat mengikut penapisan Zon dan Tahun Hijrah.", style='List Bullet')

add_heading("5. CABARAN & MITIGASI", level=1)
add_paragraph("CABARAN:", align='justify')
doc.add_paragraph("Kesesakan trafik pangkalan data (Database Connection Bottleneck) sekiranya ratusan amil log masuk dan memuat naik resit secara serentak (concurrent hits), menyebabkan masa lengah atau server tergendala.", style='List Bullet')
doc.add_paragraph("Kekangan kestabilan capaian Internet di kawasan pedalaman atau masjid tertentu.", style='List Bullet')
doc.add_paragraph("Kemungkinan ralat bacaan OCR ke atas nombor siri resit fizikal akibat kualiti cetakan yang pudar.", style='List Bullet')
add_paragraph("MITIGASI:", align='justify')
doc.add_paragraph("Pemasangan Traffic Controller (Connection Limits) bagi mengawal kelajuan masuk tanpa kejatuhan (crash). Penambahbaikan disyorkan: Langganan pangkalan data berbayar (contoh: Supabase Pro) dengan PgBouncer bagi menampung ribuan Connection Pool kelak.", style='List Bullet')
doc.add_paragraph("Pembangunan seni bina Luar Talian (Offline Mode) dan mekanisme penyegerakan auto (Auto-Sync) membolehkan amil bekerja secara berterusan (uninterrupted) ketika ketiadaan internet.", style='List Bullet')
doc.add_paragraph("Fungsi 'Edit' disediakan pada papan pemuka Amil bagi membenarkan mereka membuat pembetulan manual (data cleansing) dengan pantas tanpa bantuan admin.", style='List Bullet')

add_heading("6. RANCANGAN LANJUT", level=1)
add_heading("6.1 PELAN TINDAKAN", level=2)
doc.add_paragraph("Integrasi Infrastruktur Skala Besar: Peralihan kepada pangkalan data berbayar skala enterprise menjelang musim puncak Ramadan bagi menampung kesesakan luar biasa tanpa had.", style='List Bullet')
doc.add_paragraph("Peluasan Analitik Masa Depan (Predictive AI): Mengintegrasikan analitik AI lanjutan untuk meramal trend unjuran kutipan (Predictive Output) mengikut zon di masa hadapan.", style='List Bullet')

add_heading("6.2 KEMAMPANAN / BERDAYA TAHAN", level=2)
add_paragraph("Inisiatif pendigitalan perkhidmatan E-Zakat OCR membuktikan aspek skalabiliti teknologi yang tinggi menerusi pemanfaatan teknologi Web Terbuka dan Edge Computing berbanding pelayan gergasi tradisional. Penyelenggaraan yang mampan menjamin objektif EODB (Ease of Doing Business) terus memacu keberkesanan dan kredibiliti perkhidmatan awam JUZWAB secara holistik.", align='justify')

add_heading("7. PENUTUP", level=1)
add_paragraph("Sistem Pengimbas Resit Zakat Pintar bertindak sebagai inovasi dan pemangkin (catalyst) berprestasi tinggi dalam merancakkan keseluruhan ekosistem pengurusan zakat awam. Dengan gabungan automasi bacaan AI dan keselamatan pengurusan pangkalan data terpusat, E-Zakat OCR berpotensi diangkat sebagai model penanda aras perkhidmatan. Sokongan padu serta penganugerahan melalui Anugerah Inovasi Perdana (AIP) pastinya menjadi suntikan galakan yang bermakna buat pasukan projek untuk melonjakkan lagi sumbangan inovasi mampan di masa akan datang.", align='justify')

doc.add_paragraph("\n\n\n\n")
sign = doc.add_paragraph("Disediakan oleh,\n\n\n....................................................\n(Nama Pegawai / Pasukan Projek)\nJabatan Urusan Zakat Wakaf & Baitulmal (JUZWAB)")
sign.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

doc.save("Laporan_AIP_JUZWAB.docx")
