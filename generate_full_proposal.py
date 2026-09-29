import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

doc = docx.Document()

# Styles
style = doc.styles['Normal']
font = style.font
font.name = 'Arial'
font.size = Pt(11)

def add_heading(text, level=1):
    h = doc.add_heading(text, level=level)
    h.runs[0].font.name = 'Arial'
    h.runs[0].font.color.rgb = RGBColor(0, 51, 102)

def add_paragraph(text, align='left', bold=False):
    p = doc.add_paragraph()
    if align == 'center':
        p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    elif align == 'justify':
        p.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
    
    run = p.add_run(text)
    run.bold = bold
    return p

# PAGE 1: COVER PAGE
doc.add_paragraph("\n\n\n\n\n")
title = doc.add_paragraph()
title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
run = title.add_run("KERTAS CADANGAN & DOKUMENTASI SISTEM:\nSISTEM PENGIMBAS RESIT ZAKAT PINTAR (AI OCR)\nKE ARAH DIGITALISASI DAN PENGURUSAN DATA YANG KOMPREHENSIF")
run.font.size = Pt(18)
run.bold = True
run.font.color.rgb = RGBColor(0, 51, 102)

doc.add_paragraph("\n\n\n")
sub = doc.add_paragraph()
sub.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
run2 = sub.add_run("Disediakan untuk:\nPengarah\nJabatan Urusan Zakat Wakaf & Baitulmal (JUZWAB)")
run2.font.size = Pt(14)
run2.bold = True

doc.add_paragraph("\n\n")
date = doc.add_paragraph()
date.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
run3 = date.add_run("Tarikh Pembentangan: [Tarikh Pembentangan]\nKlasifikasi: SULIT & TERHAD")
run3.font.size = Pt(12)
run3.italic = True

doc.add_page_break()

# PAGE 2: RINGKASAN EKSEKUTIF
add_heading("RINGKASAN EKSEKUTIF", level=1)
add_paragraph("Kertas cadangan ini dibentangkan bertujuan untuk memohon kelulusan dan sokongan daripada pihak Pengurusan Tertinggi Jabatan Urusan Zakat Wakaf & Baitulmal (JUZWAB) bagi membangunkan, memproduksi, dan menggunakan Sistem Pengimbas Resit Zakat Pintar yang berasaskan teknologi Kecerdasan Buatan (AI) Optical Character Recognition (OCR). Sistem ini direka bentuk sebagai penyelesaian 'Back and Forth' berimpak tinggi yang berfungsi secara serampang dua mata: (1) Mengarkibkan resit-resit lama secara pukal (Back), dan (2) Memproses pengeluaran resit baharu secara masa nyata (Forth).", align='justify')
add_paragraph("Dengan kekuatan infrastruktur berbasis web (Web-Based Application), sistem ini berkeupayaan untuk diakses secara lancar menerusi pelayar internet (web browser) pada kedua-dua peranti pintar Android dan iOS tanpa memerlukan sebarang proses muat turun dari Google Play Store mahupun Apple App Store. Ini merendahkan halangan penggunaan (barrier to entry) bagi para amil di lapangan.", align='justify')
add_paragraph("Selain itu, inisiatif digitalisasi ini akan memacu JUZWAB ke arah kelestarian alam sekitar (Go Green) dan penjimatan kos percetakan operasi yang drastik. Jika sebelum ini JUZWAB bergantung kepada penggunaan 3 helaian salinan resit, sistem ini mampu mengurangkan pergantungan tersebut kepada 1 resit fizikal sahaja, dengan sasaran 100% peralihan kepada E-Resit.", align='justify')
add_paragraph("Aplikasi ini juga dilengkapi dengan perancangan pintar (smart features) seperti pengiraan wang lebihan untuk tabung 'Sedekah Am', Papan Pemuka Analitik (Dashboard) bagi pemantauan ibu pejabat JUZWAB, serta ekosistem pengeksportan pangkalan data penuh berserta pengesanan masa (timestamp) secara terus kepada format laporan berstruktur (CSV).", align='justify')

# PAGE 3: 1.0 PENGENALAN
add_heading("1.0 PENGENALAN DAN LATAR BELAKANG", level=1)
add_paragraph("JUZWAB memainkan peranan yang sangat kritikal dalam memangkin sosioekonomi umat Islam melalui sistem kutipan dan agihan zakat yang sistematik, cekap, dan berlandaskan Syariat. Selari dengan aspirasi kerajaan ke arah kerangka Ekonomi Digital, setiap agensi kutipan hasil dituntut untuk memperkasa proses kerja harian dengan mengadaptasi teknologi baharu yang berupaya meminimumkan kesilapan manusia (human error), mengoptimumkan kos pengurusan, dan memantapkan integriti data kutipan.", align='justify')
add_paragraph("Secara tradisinya, kutipan zakat fitrah mahupun zakat harta oleh amil-amil di seluruh negara bergantung kepada buku resit manual. Buku resit berkarbon ini memerlukan tenaga kerja fizikal yang intensif. Ia bukan sahaja memakan masa untuk ditulis tangan secara berulang kali, tetapi juga mendedahkan jabatan kepada risiko kehilangan dokumen dan lambakan arkib fizikal.", align='justify')

# 2.0 PERNYATAAN MASALAH
add_heading("2.0 PERNYATAAN MASALAH", level=1)
p = doc.add_paragraph(style='List Bullet')
p.add_run("Kos Percetakan dan Isu '3 Salinan' (Carbon Copies): ").bold = True
p.add_run("Penggunaan 3 salinan kertas resit melibatkan kos tinggi dan kualiti tulisan tembus karbon kerap kali tidak jelas (illegible).")
p = doc.add_paragraph(style='List Bullet')
p.add_run("Kelewatan Pemulangan Buku Resit dan 'Data Backlog': ").bold = True
p.add_run("Amil adakalanya lewat menyerahkan buku fizikal ke ibu pejabat, menyebabkan kerja-kerja kemasukan data tergendala.")
p = doc.add_paragraph(style='List Bullet')
p.add_run("Kapasiti dan Keselamatan Ruang Arkib: ").bold = True
p.add_run("Ruang simpanan berskala besar yang selamat dan berhawa dingin diperlukan bagi mengelakkan kerosakan fail kertas bertahun lamanya.")
p = doc.add_paragraph(style='List Bullet')
p.add_run("Ralat Manusia (Human Error) dalam Kiraan Tunai: ").bold = True
p.add_run("Khususnya waktu puncak Malam Raya, isu memulangkan baki mata wang sen mencetuskan kekeliruan, kelewatan, dan barisan panjang.")

doc.add_page_break()

# 3.0 OBJEKTIF PROJEK
add_heading("3.0 OBJEKTIF PROJEK", level=1)
doc.add_paragraph("1. Mendigitalkan proses perekodan resit zakat secara serta-merta sejurus transaksi berlaku melalui teknologi AI OCR.", style='List Number')
doc.add_paragraph("2. Mewujudkan keserasian merentas platform (cross-platform compatibility) berasaskan PWA bagi ekosistem Android dan iOS.", style='List Number')
doc.add_paragraph("3. Melaksanakan pendekatan 'Back and Forth': menterjemah maklumat bertulis dari timbunan resit lama (Arkib) menjadi data berstruktur, dan merekod resit baharu secara masa nyata.", style='List Number')
doc.add_paragraph("4. Mengurangkan jejak karbon JUZWAB menuju dasar pengurusan Sifar Kertas (Paperless / E-Resit).", style='List Number')
doc.add_paragraph("5. Meningkatkan ketelusan dan pemantauan aliran tunai di peringkat ibu pejabat menerusi papan pemuka analitik pusat (Admin Dashboard).", style='List Number')

# 4.0 PENYELESAIAN
add_heading("4.0 PENYELESAIAN YANG DICADANGKAN", level=1)
add_heading("4.1 Pendekatan Serampang Dua Mata ('Back and Forth')", level=2)
add_paragraph("Mod 'Forth' (Mod Terkini): Digunakan semasa kutipan aktif. Menyaring nama pembayar, IC, jumlah tanggungan, dan menjana E-Resit Kod QR serentak secara langsung (live).", align='justify')
add_paragraph("Mod 'Back' (Arkib Pukal ⚡): Mod ultra pantas yang memintas bacaan nama bagi mempercepatkan terjemahan arkib bertahun-tahun lamanya ke dalam format data berangka (Nombor, Kategori Beras).", align='justify')

add_heading("4.2 Modul Pengiraan Pintar Lebihan Wang (Sedekah/Infaq)", level=2)
add_paragraph("Bagi menyelesaikan konflik baki wang sen, modul ini telah dibangunkan secara integrasi. Sekiranya pembayar menyerahkan wang RM10.00 untuk kadar zakat RM6.50, Amil hanya perlu menanda butang 'Wang Baki Sebagai Sedekah' dan memasukkan angka 10.00. Sistem akan memecah rekod tersebut secara automatik:", align='justify')
doc.add_paragraph("Item 1: Zakat Fitrah (RM6.50)", style='List Bullet')
doc.add_paragraph("Item 2: Sedekah Am (RM3.50)", style='List Bullet')
add_paragraph("Ciri inovatif ini bukan sahaja menjimatkan masa tetapi membuka dana aliran masuk secara automatik ke akaun Baitulmal menerusi derma terkumpul.", align='justify')

# 5.0 IMPLIKASI TEKNIKAL
add_heading("5.0 IMPLIKASI TEKNIKAL DAN INFRASTRUKTUR", level=1)
add_heading("5.1 Kesediaan Mod Luar Talian (Offline Mode)", level=2)
add_paragraph("Dilengkapi infrastruktur 'Progressive Web App' (PWA). Jika isyarat internet terputus (blank spot), sistem akan beralih ke mod tempatan (IndexedDB). Rekod akan disimpan dengan selamat di memori telefon. Sebaik talian dipulihkan, sistem secara rahsia memuat naik data yang tertunggak tersebut kembali ke pelayan.", align='justify')

add_heading("5.2 Akses Rekod Rujukan Berkekalan (Cloud Retention)", level=2)
add_paragraph("Bagi pengurusan rekod di pihak Amil, sistem ini menghubungkan mereka secara langsung dengan pangkalan data awan (Cloud Database). Melalui tab 'Rekod', amil boleh menyemak semula sejarah e-resit yang telah dijana tanpa sebarang had masa. Kekuatan fungsi ini memberi jaminan bahawa amil bebas memadam fail memori gambar (cache) di telefon pintar mereka (bagi menjimatkan ruang storan) tanpa berisiko menghilangkan akses kepada salinan E-Resit mereka sendiri.", align='justify')

add_heading("5.3 Pengoptimuman Data (Client-Side Compression)", level=2)
add_paragraph("Walaupun resit diimbas menggunakan imej kamera beresolusi tinggi, saiznya akan dimampat di dalam telefon terlebih dahulu (kepada bawah 150KB) sebelum dimuat naik. Ini menjamin penjimatan kuota internet amil dan kelajuan pemindahan yang drastik.", align='justify')

doc.add_page_break()

# 6.0 DOKUMENTASI SISTEM & MANUAL PENGGUNA
add_heading("6.0 DOKUMENTASI SISTEM DAN MANUAL PENGGUNA", level=1)

add_heading("6.1 Carta Kes Penggunaan (System Interoperability)", level=2)
add_paragraph("Sistem diklasifikasikan kepada tiga entiti utama: Pangkalan Data Pusat, Pengguna Lapangan (Amil), dan Pemantau (Admin).", align='justify')
doc.add_paragraph("AMIL: Bertanggungjawab untuk Log Masuk, Mengimbas Resit (OCR), Menyemak Maklumat (menyuntik Sedekah & Wakalah), Menjana Kod QR E-Resit, serta Mengosongkan Cache sekiranya perlu.", style='List Bullet')
doc.add_paragraph("ADMIN: Bertanggungjawab untuk memantau aliran trafik dan kewangan dari seluruh masjid/zon menerusi Dashboard Analitik, serta mengekstrak laporan Pangkalan Data penuh (CSV Download).", style='List Bullet')
doc.add_paragraph("PANGKALAN DATA: Memproses kemasukan (POST) dan pembacaan (GET) dengan mekanisme Auto-Sync secara sinkroni apabila internet disambungkan.", style='List Bullet')

add_heading("6.2 Manual Pengguna: AMIL (Operasi Lapangan)", level=2)
doc.add_paragraph("1. Log Masuk: Masukkan KOD ID AMIL (Cth: AMIL-Z01) berserta kata laluan yang didaftarkan.", style='List Number')
doc.add_paragraph("2. Pengimbasan: Di halaman utama, klik 'Imbas Resit Zakat Baru'. Pilih mod imbasan (Biasa, Arkib Pukal, atau Zakat Harta). Halakan ke resit, sejajarkan dengan garisan sasaran, dan tekan Ambil Gambar.", style='List Number')
doc.add_paragraph("3. Semakan Maklumat: Semak kotak yang dikesan AI. Anda boleh mengubah nombor resit, jumlah tanggungan, atau menandakan kotak Wakalah sekiranya pembayar mewakilkan pembayarannya.", style='List Number')
doc.add_paragraph("4. Sisipan Sedekah (Beta): Tekan kotak ungu 'Wang Baki sebagai Sedekah' dan masukkan jumlah wang kertas yang diterima dari Muzakki (Contoh: $10.00 untuk Zakat bernilai $2.84). Sistem mencatat lebihannya sebagai sumbangan.", style='List Number')
doc.add_paragraph("5. Penjanaan E-Resit: Tekan butang 'Hantar & Sahkan'. Mesej pengesahan akan memaparkan ✅ Status Synced. Sebuah Kod QR bakal dipaparkan untuk diimbas oleh pembayar.", style='List Number')
doc.add_paragraph("6. Pengurusan Memori (Empty Cache): Buka tab 'Lihat Semua (Rekod)'. Sekiranya prestasi telefon merosot selepas ratusan imbasan, tekan butang ikon Tong Sampah Merah. Ini membersihkan memori sementara cache telefon, tetapi data pelayan tidak akan terjejas.", style='List Number')

add_heading("6.3 Manual Pengguna: ADMIN (Pusat Kawalan)", level=2)
doc.add_paragraph("1. Papan Pemuka Berpusat (Dashboard): Sebaik admin log masuk, paparan kad hijau zamrud bakal mempamerkan pecahan kumulatif untuk Jumlah Zakat Fitrah, Zakat Harta, dan Sedekah Am.", style='List Number')
doc.add_paragraph("2. Analisis Geografi (Zon): Terdapat susunan senarai di bawah kad dashboard yang meranking jumlah pungutan Fitrah mengikut Zon untuk perbandingan pemantauan.", style='List Number')
doc.add_paragraph("3. Tapisan Tahun (Filter): Di sudut atas kanan, menu pilihan Tahun Hijrah disediakan (Contoh: 1447H, 1446H). Graf keseluruhan akan berubah secara organik mengikut pilihan kalendar yang dibuat.", style='List Number')
doc.add_paragraph("4. Pengeksportan Audit (CSV): Tekan butang hitam 'Muat Turun Database Penuh (CSV)'. Format raw (mentah) ini mengandungi lajur komprehensif termasuk Timestamp transaksi waktu sebenar, status wakalah, dan agihan sedekah untuk diimport ke sistem perakaunan JUZWAB.", style='List Number')

# 7.0 KESIMPULAN
add_heading("7.0 KESIMPULAN", level=1)
add_paragraph("Sistem Pengimbas Resit Zakat Pintar bertindak sebagai pemangkin (catalyst) yang berpotensi tinggi memulihkan dan merancakkan keseluruhan ekosistem pengurusan zakat JUZWAB. Ia bersifat intuitif, selamat, dan berupaya melunaskan tuntutan kerja yang sebelum ini mengambil masa berminggu-minggu kepada pusingan yang berlaku dalam hitungan detik. Oleh hal yang demikian, pertimbangan wajar dan persetujuan pengurusan tertinggi amat diharapkan agar inovasi ini diangkat ke fasa implementasi komersial bertepatan dengan wawasan kemajuan jabatan.", align='justify')

doc.add_paragraph("\n\n\n\n")
sign = doc.add_paragraph("Disediakan oleh,\n\n\n....................................................\n(Nama Pegawai / Pasukan Projek)\nJabatan Urusan Zakat Wakaf & Baitulmal (JUZWAB)")
sign.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER

doc.save("Dokumentasi_Dan_Kertas_Cadangan_Lengkap_JUZWAB.docx")
