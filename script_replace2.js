const fs = require('fs');
let c = fs.readFileSync('generate_full_proposal.py', 'utf8');

c = c.replace(/  # 5\.0 IMPLIKASI TEKNIKAL[\s\S]*?kelajuan pemindahan yang drastik\.", align='justify'\)/, 
`# 5.0 IMPLIKASI TEKNIKAL
add_heading("5.0 IMPLIKASI TEKNIKAL DAN INFRASTRUKTUR", level=1)
add_heading("5.1 Kesediaan Mod Luar Talian (Offline Mode)", level=2)
add_paragraph("Dilengkapi infrastruktur 'Progressive Web App' (PWA). Jika isyarat internet terputus (blank spot), sistem akan beralih ke mod tempatan (IndexedDB). Rekod akan disimpan dengan selamat di memori telefon. Sebaik talian dipulihkan, sistem secara rahsia memuat naik data yang tertunggak tersebut kembali ke pelayan.", align='justify')

add_heading("5.2 Akses Rekod Rujukan Berkekalan (Cloud Retention)", level=2)
add_paragraph("Bagi pengurusan rekod di pihak Amil, sistem ini menghubungkan mereka secara langsung dengan pangkalan data awan (Cloud Database). Melalui tab 'Rekod', amil boleh menyemak semula sejarah e-resit yang telah dijana tanpa sebarang had masa. Kekuatan fungsi ini memberi jaminan bahawa amil bebas memadam fail memori gambar (cache) di telefon pintar mereka (bagi menjimatkan ruang storan) tanpa berisiko menghilangkan akses kepada salinan E-Resit mereka sendiri.", align='justify')

add_heading("5.3 Pengoptimuman Data (Client-Side Compression)", level=2)
add_paragraph("Walaupun resit diimbas menggunakan imej kamera beresolusi tinggi, saiznya akan dimampat di dalam telefon terlebih dahulu (kepada bawah 150KB) sebelum dimuat naik. Ini menjamin penjimatan kuota internet amil dan kelajuan pemindahan yang drastik.", align='justify')`);

fs.writeFileSync('generate_full_proposal.py', c);
console.log('done');
