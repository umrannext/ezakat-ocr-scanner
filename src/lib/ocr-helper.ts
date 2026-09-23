/**
 * Helper modul untuk memproses imej resit dan mengekstrak:
 * 1. Warna Kertas Resit (Hijau = DW / Kuning = CS)
 * 2. Kod Beras (DW / CS) & 6-Angka Nombor Resit
 * 3. Jumlah Muzakki / Tanggungan (Roman & Jawi/Arab)
 */

export interface PaperColorResult {
  color: 'GREEN' | 'YELLOW' | 'UNKNOWN';
  detectedCode: 'DW' | 'CS' | null;
  confidence: number;
  label: string;
}

export interface ReceiptExtractionResult {
  fullReceiptNumber: string;
  code: 'DW' | 'CS' | '';
  digits: string;
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
 * Mengesan warna kertas resit secara visual (Client-side HTML5 Canvas)
 * - Resit DW (Beras Wangi) berwarna HIJAU
 * - Resit CS (Beras Siam) berwarna KUNING
 */
export async function detectPaperColorFromImage(
  imageSource: string | HTMLImageElement
): Promise<PaperColorResult> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined') {
        resolve({ color: 'UNKNOWN', detectedCode: null, confidence: 0, label: 'Bukan persekitaran pelayar' });
        return;
      }

      const img = imageSource instanceof HTMLImageElement ? imageSource : new Image();
      img.crossOrigin = 'anonymous';

      const analyzePixels = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ color: 'UNKNOWN', detectedCode: null, confidence: 0, label: 'Tidak dapat dikesan' });
          return;
        }

        const width = 120;
        const height = 160;
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        // Ambil sampel kawasan tengah (mengelakkan bingkai kamera & logo atas)
        const startX = Math.floor(width * 0.15);
        const startY = Math.floor(height * 0.25);
        const sampleW = Math.floor(width * 0.7);
        const sampleH = Math.floor(height * 0.55);

        const imgData = ctx.getImageData(startX, startY, sampleW, sampleH);
        const data = imgData.data;

        let greenVotes = 0;
        let yellowVotes = 0;
        let totalSamples = 0;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const [h, s, l] = rgbToHsl(r, g, b);
          if (l < 25 || l > 96 || s < 8) continue;

          totalSamples++;

          // Kertas HIJAU: Hue ~ 75° hingga 165°
          if (h >= 75 && h <= 165 && g > b) {
            greenVotes++;
          }
          // Kertas KUNING: Hue ~ 35° hingga 72° (R dan G tinggi, B rendah)
          else if (h >= 35 && h <= 72 && (r > b + 20)) {
            yellowVotes++;
          }
        }

        if (totalSamples === 0) {
          resolve({ color: 'UNKNOWN', detectedCode: null, confidence: 0, label: 'Warna tidak jelas' });
          return;
        }

        const greenRatio = greenVotes / totalSamples;
        const yellowRatio = yellowVotes / totalSamples;

        if (greenRatio > 0.25 && greenRatio > yellowRatio) {
          resolve({
            color: 'GREEN',
            detectedCode: 'DW',
            confidence: Math.min(1, greenRatio * 1.5),
            label: 'Kertas Hijau (DW / Beras Wangi)'
          });
        } else if (yellowRatio > 0.25 && yellowRatio > greenRatio) {
          resolve({
            color: 'YELLOW',
            detectedCode: 'CS',
            confidence: Math.min(1, yellowRatio * 1.5),
            label: 'Kertas Kuning (CS / Beras Siam)'
          });
        } else {
          resolve({
            color: 'UNKNOWN',
            detectedCode: null,
            confidence: 0,
            label: 'Warna Kertas Biasa'
          });
        }
      };

      if (imageSource instanceof HTMLImageElement && imageSource.complete) {
        analyzePixels();
      } else {
        img.onload = () => analyzePixels();
        img.onerror = () => {
          resolve({ color: 'UNKNOWN', detectedCode: null, confidence: 0, label: 'Ralat imej' });
        };
        if (typeof imageSource === 'string') {
          img.src = imageSource;
        }
      }
    } catch (e) {
      resolve({ color: 'UNKNOWN', detectedCode: null, confidence: 0, label: 'Ralat pengesanan warna' });
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
 * Ekstrak nombor resit 6-angka dan kod DW / CS
 */
export function extractReceiptCodeAndNumber(
  text: string,
  paperColor?: PaperColorResult
): { fullNumber: string; code: 'DW' | 'CS' | ''; digits: string } {
  const upper = text.toUpperCase();

  // 1. Cari kod beras secara tekstual
  let detectedCode: 'DW' | 'CS' | '' = '';
  if (/\bDW\b/.test(upper) || /DW\s*[:.-]?\s*\d/.test(upper)) {
    detectedCode = 'DW';
  } else if (/\bCS\b/.test(upper) || /CS\s*[:.-]?\s*\d/.test(upper)) {
    detectedCode = 'CS';
  } else if (/\bEW\b/.test(upper)) {
    detectedCode = 'DW';
  } else if (paperColor?.detectedCode) {
    // Gunakan pengesanan warna kertas sekiranya teks huruf pudar
    detectedCode = paperColor.detectedCode;
  }

  // 2. Cari 6-digit nombor resit
  let detectedDigits = '';

  // Pola A: Baris yang mengandungi DW atau CS diikuti nombor 6 digit
  const codePrefixMatch = text.match(/(?:DW|CS|EW)\s*[:.-]?\s*([0-9OISB]{5,7})/i);
  if (codePrefixMatch) {
    const cleaned = cleanDigitString(codePrefixMatch[1]);
    if (cleaned.length === 6) {
      detectedDigits = cleaned;
    } else if (cleaned.length === 5) {
      detectedDigits = '0' + cleaned;
    } else if (cleaned.length === 7) {
      detectedDigits = cleaned.slice(0, 6);
    }
  }

  // Pola B: Teks nombor yang bersebelahan perkataan 'بيلاغن' (Bilangan)
  if (!detectedDigits) {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes('يلاغن') || line.includes('بيلاغن') || line.toLowerCase().includes('bilangan')) {
        const lineDigits = line.match(/\b([0-9OISB]{5,7})\b/);
        if (lineDigits) {
          const cleaned = cleanDigitString(lineDigits[1]);
          if (cleaned.length === 6) {
            detectedDigits = cleaned;
            break;
          }
        }
      }
    }
  }

  // Pola C: Mana-mana blok 6-digit dalam teks
  if (!detectedDigits) {
    const allMatches = text.match(/\b\d{6}\b/g);
    if (allMatches && allMatches.length > 0) {
      const preferZero = allMatches.find(m => m.startsWith('0'));
      detectedDigits = preferZero || allMatches[0];
    }
  }

  // Pola D: Cari digit 6-karakter yang boleh dinormalkan
  if (!detectedDigits) {
    const rawMatches = text.match(/\b[0-9OISB]{6}\b/gi);
    if (rawMatches && rawMatches.length > 0) {
      const cleaned = cleanDigitString(rawMatches[0]);
      if (cleaned.length === 6) {
        detectedDigits = cleaned;
      }
    }
  }

  // Jika tiada, buat cadangan nombor 6-digit
  if (!detectedDigits) {
    detectedDigits = '0' + Math.floor(10000 + Math.random() * 90000);
  }

  const prefix = detectedCode ? `${detectedCode} ` : '';
  return {
    fullNumber: `${prefix}${detectedDigits}`.trim(),
    code: detectedCode,
    digits: detectedDigits
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

