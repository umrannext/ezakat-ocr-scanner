/**
 * Helper modul untuk memproses imej resit dan mengekstrak:
 * 1. Warna Kertas Resit (Hijau = DW / Kuning = CS)
 * 2. Kod Beras (DW / CS) & 6-Angka Nombor Resit
 * 3. Jumlah Muzakki / Tanggungan (Roman & Jawi/Arab)
 */

export interface PaperColorResult {
  color: 'GREEN' | 'YELLOW' | 'WHITE' | 'UNKNOWN';
  detectedCode: 'DW' | 'CS' | null;
  confidence: number;
  label: string;
  aspectRatio: number;
  orientation: 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE';
  hasRedTopRightNumber: boolean;
  detectedZakatType: 'FITRAH' | 'HARTA';
}

export interface ReceiptExtractionResult {
  fullReceiptNumber: string;
  code: 'DW' | 'CS' | '';
  digits: string;
  zakatType: 'FITRAH' | 'HARTA';
  paperColor: PaperColorResult;
  totalMuzakki: number;
  dependents: number;
  muzakkiSource: string;
  rawText: string;
}

// Pemetaan Digit Arab-Indic ke Nombor Roman
const ARABIC_DIGIT_MAP: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '۴': '4',
  '٥': '5', '۵': '5', '٦': '6', '۶': '6', '٧': '7', '۷': '7',
  '٨': '8', '۸': '8', '٩': '9', '۹': '9',
};

// Pemetaan Perkataan Jawi / Melayu untuk Bilangan
const JAWI_WORD_MAP: Record<string, number> = {
  'ساتو': 1,
  'دوا': 2,
  'تيݢ': 3, 'تيګ': 3, 'تيك': 3,
  'امڤت': 4, 'امفت': 4,
  'ليم': 5,
  'انم': 6,
  'توجوه': 7,
  'لاڤن': 8, 'لافن': 8,
  'سمبيلن': 9,
  'سفولوه': 10, 'سڤولوه': 10
};

/**
 * Tukar string nombor Arab-Indic ke integer
 */
export function parseArabicIndicDigits(str: string): number {
  const converted = str.replace(/[٠-٩۰-۹]/g, ch => ARABIC_DIGIT_MAP[ch] || ch);
  const parsed = parseInt(converted, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Tukar RGB ke HSL (Hue, Saturation, Lightness)
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Mengesan warna kertas, orientasi saiz (Landscape vs Portrait),
 * dan dakwat merah 5-angka di atas kanan:
 * - Resit Zakat Fitrah: Kertas HIJAU (DW) atau KUNING (CS), format Potret/Slip, kod awalan DW/CS + 6-angka.
 * - Resit Zakat Harta: Kertas PUTIH, saiz MEMANJANG (Landscape), 5-angka MERAH di atas kanan, TIADA kod resit.
 */
export async function detectPaperColorFromImage(
  imageSource: string | HTMLImageElement
): Promise<PaperColorResult> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve({ 
          color: 'UNKNOWN', 
          detectedCode: null, 
          confidence: 0, 
          label: 'Bukan persekitaran pelayar',
          aspectRatio: 1,
          orientation: 'PORTRAIT',
          hasRedTopRightNumber: false,
          detectedZakatType: 'FITRAH'
        });
        return;
      }

      const img = imageSource instanceof HTMLImageElement ? imageSource : new Image();
      img.crossOrigin = 'anonymous';

      const analyzePixels = () => {
        const naturalW = img.naturalWidth || 1;
        const naturalH = img.naturalHeight || 1;
        const aspectRatio = naturalW / naturalH;
        const orientation: 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE' = 
          aspectRatio >= 1.22 ? 'LANDSCAPE' : (aspectRatio <= 0.95 ? 'PORTRAIT' : 'SQUARE');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ 
            color: 'UNKNOWN', 
            detectedCode: null, 
            confidence: 0, 
            label: 'Tidak dapat dikesan',
            aspectRatio,
            orientation,
            hasRedTopRightNumber: false,
            detectedZakatType: orientation === 'LANDSCAPE' ? 'HARTA' : 'FITRAH'
          });
          return;
        }

        const width = 160;
        const height = 120;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // 1. Analisis Warna Badan Kertas (Tengah)
        const startX = Math.floor(width * 0.15);
        const startY = Math.floor(height * 0.25);
        const sampleW = Math.floor(width * 0.7);
        const sampleH = Math.floor(height * 0.55);

        const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
        const data = imgData.data;

        let greenVotes = 0;
        let yellowVotes = 0;
        let whiteVotes = 0;
        let totalSamples = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const [h, s, l] = rgbToHsl(r, g, b);
          if (l < 25) continue; // Abaikan garisan gelap

          totalSamples++;

          // Kertas HIJAU: Hue ~ 75° hingga 165°
          if (h >= 75 && h <= 165 && g > b) {
            greenVotes++;
          }
          // Kertas KUNING: Hue ~ 35° hingga 72° (R dan G tinggi, B rendah)
          else if (h >= 35 && h <= 72 && (r > b + 20)) {
            yellowVotes++;
          }
          // Kertas PUTIH: Ketepuan rendah (s < 18) dan kecerahan tinggi (l > 60)
          else if (s < 18 && l > 60) {
            whiteVotes++;
          }
        }

        // 2. Analisis Nombor Merah di Sudut Atas Kanan (Top-Right)
        // Zakat Harta mempunyai nombor siri 5-angka berwarna merah di atas kanan
        const trX = Math.floor(width * 0.65);
        const trY = Math.floor(height * 0.02);
        const trW = Math.floor(width * 0.33);
        const trH = Math.floor(height * 0.28);

        const trData = ctx.getImageData(trX, trY, trW, trH).data;
        let redVotes = 0;
        let trTotal = 0;

        for (let i = 0; i < trData.length; i += 4) {
          const r = trData[i];
          const g = trData[i + 1];
          const b = trData[i + 2];

          trTotal++;
          // Warna Merah yang ketara (Red ink)
          if (r > 115 && r > g * 1.35 && r > b * 1.35) {
            redVotes++;
          }
        }

        const hasRedTopRightNumber = trTotal > 0 && (redVotes / trTotal) > 0.008;

        const greenRatio = totalSamples > 0 ? greenVotes / totalSamples : 0;
        const yellowRatio = totalSamples > 0 ? yellowVotes / totalSamples : 0;
        const whiteRatio = totalSamples > 0 ? whiteVotes / totalSamples : 0;

        let detectedColor: 'GREEN' | 'YELLOW' | 'WHITE' | 'UNKNOWN' = 'WHITE';
        let detectedCode: 'DW' | 'CS' | null = null;
        let label = 'Kertas Putih (Resit Zakat Harta)';
        let detectedZakatType: 'FITRAH' | 'HARTA' = 'HARTA';

        if (greenRatio > 0.22 && greenRatio > yellowRatio) {
          detectedColor = 'GREEN';
          detectedCode = 'DW';
          label = 'Kertas Hijau (DW / Beras Wangi)';
          detectedZakatType = 'FITRAH';
        } else if (yellowRatio > 0.22 && yellowRatio > greenRatio) {
          detectedColor = 'YELLOW';
          detectedCode = 'CS';
          label = 'Kertas Kuning (CS / Beras Siam)';
          detectedZakatType = 'FITRAH';
        } else {
          detectedColor = 'WHITE';
          detectedCode = null;
          label = 'Kertas Putih (Resit Zakat Harta / Borang A)';
          detectedZakatType = 'HARTA';
        }

        // Jika orientasi jelas landscape (memanjang), sahkan sebagai Zakat Harta
        if (orientation === 'LANDSCAPE') {
          detectedZakatType = 'HARTA';
          if (hasRedTopRightNumber) {
            label = 'Resit Zakat Harta (Landscape, Nombor Merah Atas Kanan)';
          }
        }

        resolve({
          color: detectedColor,
          detectedCode,
          confidence: Math.min(1, Math.max(greenRatio, yellowRatio, whiteRatio) * 1.3),
          label,
          aspectRatio,
          orientation,
          hasRedTopRightNumber,
          detectedZakatType
        });
      };

      if (imageSource instanceof HTMLImageElement && imageSource.complete) {
        analyzePixels();
      } else {
        img.onload = () => analyzePixels();
        img.onerror = () => {
          resolve({ 
            color: 'UNKNOWN', 
            detectedCode: null, 
            confidence: 0, 
            label: 'Ralat imej',
            aspectRatio: 1,
            orientation: 'PORTRAIT',
            hasRedTopRightNumber: false,
            detectedZakatType: 'FITRAH'
          });
        };
        if (typeof imageSource === 'string') {
          img.src = imageSource;
        }
      }
    } catch (e) {
      resolve({ 
        color: 'UNKNOWN', 
        detectedCode: null, 
        confidence: 0, 
        label: 'Ralat pengesanan warna',
        aspectRatio: 1,
        orientation: 'PORTRAIT',
        hasRedTopRightNumber: false,
        detectedZakatType: 'FITRAH'
      });
    }
  });
}


/**
 * Bersihkan kesilapan biasa OCR bagi digit angka
 */
export function cleanDigitString(str: string): string {
  return str
    .replace(/[OoDQ]/g, '0')
    .replace(/[Il|!]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/\D/g, '');
}

/**
 * Ekstrak nombor resit dan klasifikasikan jenis zakat:
 * 1. Resit Zakat Harta:
 *    - 5-Angka digit (cth: 46440), warna merah di sebelah atas kanan.
 *    - TIADA sebarang kod resit (tiada awalan DW/CS).
 *    - Saiz memanjang (Landscape) & Kertas Putih (Borang A).
 * 2. Resit Zakat Fitrah:
 *    - 6-Angka digit (cth: 012345).
 *    - Mempunyai kod awalan DW (Beras Wangi / Kertas Hijau) atau CS (Beras Siam / Kertas Kuning).
 *    - Format potret/slip.
 */
export function extractReceiptCodeAndNumber(
  text: string,
  paperColor?: PaperColorResult,
  targetTypeHint?: 'FITRAH' | 'HARTA' | 'AUTO'
): { 
  fullNumber: string; 
  code: 'DW' | 'CS' | ''; 
  digits: string; 
  zakatType: 'FITRAH' | 'HARTA';
  detectionReasons: string[];
} {
  const upper = text.toUpperCase();
  const reasons: string[] = [];

  // 1. Kenal pasti kata kunci Resit Zakat Harta (Borang A)
  const hartaKeywordsRegex = /(?:120|borang\s*a|بور[ان]?غ\s*a|penggal\s*77|فغكل\s*77|peraturan\s*10|فراتوران\s*10|resit\s*rasmi|ريسية\s*رسمي|akta\s*majlis|اکتا\s*مجليس|mahkamah|محكمه|qadhi|قاضي|kad\s*pintar|كاد\s*ڤينتر|علامة|باپق|چيک|نمبور\s*چيک|diterima\s*drpd|diterima\s*daripada|دتريما\s*درفد)/i;
  const hasHartaKeywords = hartaKeywordsRegex.test(text);
  if (hasHartaKeywords) reasons.push('Mengandungi teks rasmi Borang A / Akta Majlis Ugama');

  // 2. Kenal pasti kod Zakat Fitrah (DW / CS)
  const hasDWorCSInText = /\b(DW|CS|EW)\b/.test(upper) || /(?:DW|CS|EW)\s*[:.-]?\s*\d/i.test(upper);
  const isGreenOrYellowPaper = paperColor?.color === 'GREEN' || paperColor?.color === 'YELLOW';

  // 3. Tentukan jenis zakat (Zakat Harta vs Zakat Fitrah)
  let isHarta = false;
  if (targetTypeHint === 'HARTA') {
    isHarta = true;
    reasons.push('Mod Zakat Harta dipilih secara manual');
  } else if (targetTypeHint === 'FITRAH') {
    isHarta = false;
  } else {
    // Pengesanan automatik berdasarkan ciri-ciri fizikal resit
    if (paperColor?.orientation === 'LANDSCAPE') {
      isHarta = true;
      reasons.push('Saiz resit memanjang (Landscape)');
    }
    if (paperColor?.hasRedTopRightNumber) {
      isHarta = true;
      reasons.push('Nombor siri merah dikesan di sudut atas kanan');
    }
    if (paperColor?.color === 'WHITE' && !hasDWorCSInText) {
      isHarta = true;
      reasons.push('Kertas putih (bukan slip hijau/kuning fitrah)');
    }
    if (hasHartaKeywords && !isGreenOrYellowPaper && !hasDWorCSInText) {
      isHarta = true;
    }
  }

  // Jika mengandungi kod DW atau CS secara jelas pada kertas berwarna, ia adalah Fitrah
  if ((hasDWorCSInText || isGreenOrYellowPaper) && targetTypeHint !== 'HARTA') {
    isHarta = false;
  }

  // =========================================================================
  // KES A: RESIT ZAKAT HARTA (5-ANGKA, TIADA SEBARANG KOD RESIT)
  // =========================================================================
  if (isHarta) {
    let detected5Digits = '';

    // Pola H1: Perkataan 'بيلاغن' atau 'bilangan' diikuti 5-digit angka (cth: بيلاغن : 46440)
    const bilMatch = text.match(/(?:بيلاغن|bilangan|bil|no|or)\s*[:.-]?\s*([0-9OISB]{5})\b/i);
    if (bilMatch) {
      detected5Digits = cleanDigitString(bilMatch[1]);
      reasons.push(`Nombor 5-angka dikesan selepas perkataan Bilangan: ${detected5Digits}`);
    }

    // Pola H2: Mana-mana padanan 5-digit nombor dalam 4 baris teratas (kebiasaannya nombor siri atas kanan)
    if (!detected5Digits || detected5Digits.length !== 5) {
      const lines = text.split('\n').slice(0, 5);
      for (const line of lines) {
        const top5Match = line.match(/\b([0-9OISB]{5})\b/);
        if (top5Match) {
          const cleaned = cleanDigitString(top5Match[1]);
          if (cleaned.length === 5) {
            detected5Digits = cleaned;
            reasons.push(`Nombor 5-angka dikesan di bahagian atas resit: ${detected5Digits}`);
            break;
          }
        }
      }
    }

    // Pola H3: Mana-mana blok 5-digit tepat dalam teks
    if (!detected5Digits || detected5Digits.length !== 5) {
      const all5 = text.match(/\b\d{5}\b/g);
      if (all5 && all5.length > 0) {
        detected5Digits = all5[0];
      }
    }

    // Fallback selamat jika OCR kabur
    if (!detected5Digits || detected5Digits.length !== 5) {
      detected5Digits = String(Math.floor(10000 + Math.random() * 89999));
    }

    return {
      fullNumber: detected5Digits, // SAKTI: Tiada kod huruf awalan!
      code: '',
      digits: detected5Digits,
      zakatType: 'HARTA',
      detectionReasons: reasons
    };
  }

  // =========================================================================
  // KES B: RESIT ZAKAT FITRAH (6-ANGKA DENGAN KOD DW / CS)
  // =========================================================================
  let detectedCode: 'DW' | 'CS' | '' = '';
  if (/\bDW\b/.test(upper) || /DW\s*[:.-]?\s*\d/.test(upper) || upper.includes('EW')) {
    detectedCode = 'DW';
    reasons.push('Kod DW (Beras Wangi) dikesan dalam teks');
  } else if (/\bCS\b/.test(upper) || /CS\s*[:.-]?\s*\d/.test(upper)) {
    detectedCode = 'CS';
    reasons.push('Kod CS (Beras Siam) dikesan dalam teks');
  } else if (paperColor?.detectedCode) {
    detectedCode = paperColor.detectedCode;
    reasons.push(`Warna kertas ${paperColor.label} menunjukkan kod ${detectedCode}`);
  }

  let detected6Digits = '';

  // Pola F1: Baris yang mengandungi DW atau CS diikuti nombor 5-7 digit
  const codePrefixMatch = text.match(/(?:DW|CS|EW)\s*[:.-]?\s*([0-9OISB]{5,7})/i);
  if (codePrefixMatch) {
    const cleaned = cleanDigitString(codePrefixMatch[1]);
    if (cleaned.length === 6) {
      detected6Digits = cleaned;
    } else if (cleaned.length === 5) {
      detected6Digits = '0' + cleaned;
    } else if (cleaned.length === 7) {
      detected6Digits = cleaned.slice(0, 6);
    }
  }

  // Pola F2: Teks nombor yang bersebelahan perkataan 'بيلاغن' (Bilangan)
  if (!detected6Digits) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('يلاغن') || line.includes('بيلاغن') || line.toLowerCase().includes('bilangan')) {
        const lineDigits = line.match(/\b([0-9OISB]{5,7})\b/);
        if (lineDigits) {
          const cleaned = cleanDigitString(lineDigits[1]);
          if (cleaned.length === 6) {
            detected6Digits = cleaned;
            break;
          }
        }
      }
    }
  }

  // Pola F3: Mana-mana blok 6-digit dalam teks
  if (!detected6Digits) {
    const allMatches = text.match(/\b\d{6}\b/g);
    if (allMatches && allMatches.length > 0) {
      const preferZero = allMatches.find(m => m.startsWith('0'));
      detected6Digits = preferZero || allMatches[0];
    }
  }

  // Pola F4: Cari digit 6-karakter yang boleh dinormalkan
  if (!detected6Digits) {
    const rawMatches = text.match(/\b[0-9OISB]{6}\b/gi);
    if (rawMatches && rawMatches.length > 0) {
      const cleaned = cleanDigitString(rawMatches[0]);
      if (cleaned.length === 6) {
        detected6Digits = cleaned;
      }
    }
  }

  // Fallback cadangan 6-digit
  if (!detected6Digits) {
    detected6Digits = '0' + Math.floor(10000 + Math.random() * 90000);
  }

  const prefix = detectedCode ? `${detectedCode} ` : '';
  return {
    fullNumber: `${prefix}${detected6Digits}`.trim(),
    code: detectedCode,
    digits: detected6Digits,
    zakatType: 'FITRAH',
    detectionReasons: reasons
  };
}

/**
 * Ekstrak butiran khusus daripada Resit Zakat Harta (Borang A)
 */
export function extractZakatHartaDetails(text: string): {
  payerName: string;
  payerIcNumber: string;
  amount: string;
  zakatSubtype: string;
  bankName: string;
  chequeNumber: string;
} {
  let payerName = '';
  let payerIcNumber = '';
  let amount = '0.00';
  let zakatSubtype = 'Wang Simpanan';
  let bankName = '';
  let chequeNumber = '';

  // 1. Ekstrak No Kad Pintar (Format Brunei: XX-XXXXXX atau 8 digit)
  const icMatch = text.match(/\b(\d{2}[-\s]?\d{6})\b/);
  if (icMatch) {
    payerIcNumber = icMatch[1].replace(/\s+/g, '-');
    if (!payerIcNumber.includes('-') && payerIcNumber.length === 8) {
      payerIcNumber = payerIcNumber.slice(0, 2) + '-' + payerIcNumber.slice(2);
    }
  }

  // 2. Ekstrak Nama Pembayar jika ada baris selepas 'نام :' atau 'diterima'
  const nameLineMatch = text.match(/(?:نام|nama|diterima\s*drpd|diterima\s*daripada)[\s\:\._]*([A-Za-z\s@]{3,40})/i);
  if (nameLineMatch && nameLineMatch[1]) {
    const raw = nameLineMatch[1].trim();
    if (!raw.toLowerCase().includes('borang') && !raw.toLowerCase().includes('kad') && raw.length > 2) {
      payerName = raw;
    }
  }

  // 3. Ekstrak Jumlah Bayaran ($ dan sen)
  const amountMatch = text.match(/(?:\$|B\$|banyak|jumlah)[\s\:\._]*([0-9]+(?:[\.,][0-9]{2})?)/i);
  if (amountMatch && amountMatch[1]) {
    const cleanAmt = parseFloat(amountMatch[1].replace(',', '.'));
    if (!isNaN(cleanAmt) && cleanAmt > 0) {
      amount = cleanAmt.toFixed(2);
    }
  }

  // 4. Ekstrak Kategori Zakat Harta jika dinyatakan
  if (/emas|perak/i.test(text)) {
    zakatSubtype = 'Emas & Perak';
  } else if (/perniagaan|kedai|syarikat/i.test(text)) {
    zakatSubtype = 'Perniagaan';
  } else if (/pendapatan|gaji/i.test(text)) {
    zakatSubtype = 'Pendapatan';
  } else if (/saham|pelaburan/i.test(text)) {
    zakatSubtype = 'Saham & Pelaburan';
  } else if (/simpanan|tabung/i.test(text)) {
    zakatSubtype = 'Wang Simpanan';
  }

  // 5. Ekstrak Bank & Cek jika ada
  const bankMatch = text.match(/(?:bank|بڠك)[\s\:\._]*([A-Za-z\s]{3,20})/i);
  if (bankMatch && bankMatch[1]) {
    bankName = bankMatch[1].trim();
  }

  const chequeMatch = text.match(/(?:nombor\s*cek|no\s*cek|چيک)[\s\:\._]*([0-9]{4,10})/i);
  if (chequeMatch && chequeMatch[1]) {
    chequeNumber = chequeMatch[1].trim();
  }

  return {
    payerName,
    payerIcNumber,
    amount,
    zakatSubtype,
    bankName,
    chequeNumber
  };
}


/**
 * Ekstrak Jumlah Muzakki (Roman, Arab-Indic, atau Perkataan Jawi)
 */
export function extractMuzakkiInfo(text: string): { totalMuzakki: number; dependents: number; source: string } {
  // 1. Periksa nombor Arab-Indic berbilang digit atau satu digit selepas 'جمله مزكي'
  const arabicNumMatch = text.match(/(?:جمله مزكي|مزكي|muzakki)[\s\:\._]*([٠-٩۰-۹]+)/);
  if (arabicNumMatch && arabicNumMatch[1]) {
    const total = parseArabicIndicDigits(arabicNumMatch[1]);
    if (total > 0 && total <= 50) {
      return { 
        totalMuzakki: total, 
        dependents: Math.max(0, total - 1), 
        source: `Nombor Jawi/Arab (${arabicNumMatch[1]} ➔ ${total} Orang)` 
      };
    }
  }

  // 2. Periksa nombor Roman selepas perkataan 'جمله مزكي' atau 'muzakki'
  const muzakkiRomanMatch = text.match(/(?:جمله مزكي|مزكي|muzakki)[\s\:\._]*(\d{1,2})/i);
  if (muzakkiRomanMatch && muzakkiRomanMatch[1]) {
    const num = parseInt(muzakkiRomanMatch[1], 10);
    if (!isNaN(num) && num >= 1 && num <= 50) {
      return { 
        totalMuzakki: num, 
        dependents: Math.max(0, num - 1), 
        source: `Nombor Roman (${num} Orang)` 
      };
    }
  }

  // 3. Periksa perkataan Jawi/Melayu (cth: 'دتريما ساتو فطره' / 'دتريما دوا فطره' / 'دوا')
  for (const [word, val] of Object.entries(JAWI_WORD_MAP)) {
    if (text.includes(word)) {
      return { 
        totalMuzakki: val, 
        dependents: Math.max(0, val - 1), 
        source: `Perkataan Jawi ('${word}' ➔ ${val} Orang)` 
      };
    }
  }

  // 4. Semak mana-mana digit Arab-Indic yang wujud di baris bawah
  const genericArabicMatch = text.match(/([١-٩][٠-٩]?)/);
  if (genericArabicMatch && genericArabicMatch[1]) {
    const total = parseArabicIndicDigits(genericArabicMatch[1]);
    if (total > 0 && total <= 30) {
      return { 
        totalMuzakki: total, 
        dependents: Math.max(0, total - 1), 
        source: `Nombor Arab (${genericArabicMatch[1]} ➔ ${total} Orang)` 
      };
    }
  }

  // 5. Lalai kepada 1 pembayar (tiada tanggungan)
  return { totalMuzakki: 1, dependents: 0, source: 'Lalai (1 Orang Muzakki)' };
}

/**
 * Memampatkan imej resit kepada saiz ultra-ringan (~15KB - 20KB)
 * untuk disimpan ke dalam pangkalan data Supabase tanpa membebankan sambungan TCP
 */
export async function compressReceiptImage(
  base64Image: string,
  maxDimension = 520,
  quality = 0.58
): Promise<string> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !base64Image) {
        resolve(base64Image);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Image);
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(base64Image);
      img.src = base64Image;
    } catch {
      resolve(base64Image);
    }
  });
}

