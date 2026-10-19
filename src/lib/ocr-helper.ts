/**
 * Helper modul untuk memproses imej resit dan mengekstrak:
 * 1. Warna Kertas Resit (Hijau = DW / Kuning = CS / Putih = Harta)
 * 2. Kod Beras (DW / CS) & 6-Angka Nombor Resit
 * 3. 5-Angka Zakat Harta (Borang A)
 * 4. Jumlah Muzakki / Tanggungan (Roman & Jawi/Arab)
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
export const ARABIC_DIGIT_MAP: Record<string, string> = {
  '٠': '0', '۰': '0',
  '١': '1', '۱': '1',
  '٢': '2', '۲': '2',
  '٣': '3', '۳': '3',
  '٤': '4', '۴': '4',
  '٥': '5', '۵': '5',
  '٦': '6', '۶': '6',
  '٧': '7', '۷': '7',
  '٨': '8', '۸': '8',
  '٩': '9', '۹': '9',
};

// Pemetaan Perkataan Jawi / Melayu untuk Bilangan Muzakki & Tanggungan
export const JAWI_WORD_MAP: Record<string, number> = {
  'ساتو': 1, 'سأورڠ': 1, 'سورڠ': 1, 'ساورڠ': 1,
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

export function convertArabicIndicToRomanDigits(text: string): string {
  if (!text) return '';
  return text.replace(/[٠-٩۰-۹]/g, ch => ARABIC_DIGIT_MAP[ch] || ch);
}

export function extractStandardizedPaymentDate(text: string): string {
  const normalized = convertArabicIndicToRomanDigits(text);

  // 1. Format DD/MM/YYYY atau DD-MM-YYYY
  const dmyMatch = normalized.match(/\b(\d{1,2})[\/\-\.\s]+(\d{1,2})[\/\-\.\s]+(\d{2,4})\b/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    let y = parseInt(dmyMatch[3], 10);
    if (y < 100) y = 2000 + y;

    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= 2040) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // 2. Format YYYY-MM-DD
  const ymdMatch = normalized.match(/\b(20\d{2})[\/\-\.\s]+(\d{1,2})[\/\-\.\s]+(\d{1,2})\b/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(parseInt(ymdMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(ymdMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return new Date().toISOString().split('T')[0];
}

export function parseArabicIndicDigits(str: string): number {
  const converted = convertArabicIndicToRomanDigits(str);
  const parsed = parseInt(converted, 10);
  return isNaN(parsed) ? 0 : parsed;
}

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
          if (l < 25) continue;

          totalSamples++;

          if (h >= 75 && h <= 165 && g > b) {
            greenVotes++;
          } else if (h >= 35 && h <= 72 && (r > b + 20)) {
            yellowVotes++;
          } else if (s < 18 && l > 60) {
            whiteVotes++;
          }
        }

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
    } catch {
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

export function cleanDigitString(str: string): string {
  return str
    .replace(/[OoDQ]/g, '0')
    .replace(/[Il|!]/g, '1')
    .replace(/[Zz]/g, '2')
    .replace(/[Ss]/g, '5')
    .replace(/[B]/g, '8')
    .replace(/\D/g, '');
}

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
  const normalizedText = convertArabicIndicToRomanDigits(text);
  const upper = normalizedText.toUpperCase();
  const reasons: string[] = [];

  const hartaKeywordsRegex = /(?:borang\s*a|بور[ان]?غ\s*a|resit\s*rasmi\s*zakat|zakat\s*harta|wang\s*simpanan|emas\s*&\s*perak|perniagaan|چيک|nombor\s*cek|no\s*cek|علامة|باپق)/i;
  const hasHartaKeywords = hartaKeywordsRegex.test(normalizedText);
  if (hasHartaKeywords) reasons.push('Mengandungi teks khusus Borang A / Zakat Harta');

  const fitrahKeywordsRegex = /(?:borang\s*[bj]|بور[ان]?غ\s*[bj]|resit\s*rasmi\s*fitrah|زكاة\s*دان\s*فطره|زكاة\s*فطره|zakat\s*dan\s*fitrah)/i;
  const hasFitrahKeywords = fitrahKeywordsRegex.test(normalizedText);
  if (hasFitrahKeywords) reasons.push('Mengandungi teks khusus Borang B/J (Fitrah)');

  const hasDWorCSInText = /\b(DW|CS|EW)\b/.test(upper) || /(?:DW|CS|EW)\s*[:.-]?\s*\d/i.test(upper);
  const isGreenOrYellowPaper = paperColor?.color === 'GREEN' || paperColor?.color === 'YELLOW';

  let isHarta = false;
  if (targetTypeHint === 'HARTA') {
    isHarta = true;
    reasons.push('Mod Zakat Harta dipilih secara manual');
  } else if (targetTypeHint === 'FITRAH') {
    isHarta = false;
  } else {
    if (paperColor?.orientation === 'LANDSCAPE') {
      isHarta = true;
      reasons.push('Saiz resit memanjang (Landscape)');
    } else if (hasFitrahKeywords) {
      isHarta = false;
    } else if (hasHartaKeywords) {
      isHarta = true;
    } else if (paperColor?.hasRedTopRightNumber) {
      isHarta = true;
      reasons.push('Nombor siri merah dikesan di sudut atas kanan');
    } else if (paperColor?.color === 'WHITE' && !hasDWorCSInText && !hasFitrahKeywords) {
      isHarta = true;
      reasons.push('Kertas putih tanpa ciri-ciri Fitrah');
    }
  }

  if (hasDWorCSInText || (isGreenOrYellowPaper && !hasHartaKeywords)) {
    if (targetTypeHint !== 'HARTA') {
      isHarta = false;
    }
  }

  // ZAKAT HARTA (5 Digit, tiada kod huruf)
  if (isHarta) {
    let detected5Digits = '';

    const bilMatch = normalizedText.match(/(?:بيلاغن|bilangan|bil|no|or)\s*[:.-]?\s*([0-9OISB]{5})\b/i);
    if (bilMatch) {
      detected5Digits = cleanDigitString(bilMatch[1]);
      reasons.push(`Nombor 5-angka dikesan: ${detected5Digits}`);
    }

    if (!detected5Digits || detected5Digits.length !== 5) {
      const lines = normalizedText.split('\n').slice(0, 5);
      for (const line of lines) {
        const top5Match = line.match(/\b([0-9OISB]{5})\b/);
        if (top5Match) {
          const cleaned = cleanDigitString(top5Match[1]);
          if (cleaned.length === 5) {
            detected5Digits = cleaned;
            reasons.push(`Nombor 5-angka di bahagian atas resit: ${detected5Digits}`);
            break;
          }
        }
      }
    }

    if (!detected5Digits || detected5Digits.length !== 5) {
      const all5 = normalizedText.match(/\b\d{5}\b/g);
      if (all5 && all5.length > 0) {
        detected5Digits = all5[0];
      }
    }

    if (!detected5Digits || detected5Digits.length !== 5) {
      detected5Digits = String(Math.floor(10000 + Math.random() * 89999));
    }

    return {
      fullNumber: detected5Digits,
      code: '',
      digits: detected5Digits,
      zakatType: 'HARTA',
      detectionReasons: reasons
    };
  }

  // ZAKAT FITRAH (6 Digit dengan kod DW / CS)
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

  const codePrefixMatch = normalizedText.match(/(?:DW|CS|EW)\s*[:.-]?\s*([0-9OISB]{5,7})/i);
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

  if (!detected6Digits) {
    const lines = normalizedText.split('\n');
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

  if (!detected6Digits) {
    const allMatches = normalizedText.match(/\b\d{6}\b/g);
    if (allMatches && allMatches.length > 0) {
      const preferZero = allMatches.find(m => m.startsWith('0'));
      detected6Digits = preferZero || allMatches[0];
    }
  }

  if (!detected6Digits) {
    const rawMatches = normalizedText.match(/\b[0-9OISB]{6}\b/gi);
    if (rawMatches && rawMatches.length > 0) {
      const cleaned = cleanDigitString(rawMatches[0]);
      if (cleaned.length === 6) {
        detected6Digits = cleaned;
      }
    }
  }

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

export function extractZakatHartaDetails(text: string): {
  payerName: string;
  payerIcNumber: string;
  amount: string;
  zakatSubtype: string;
  bankName: string;
  chequeNumber: string;
} {
  const normalized = convertArabicIndicToRomanDigits(text);
  let payerName = '';
  let payerIcNumber = '';
  let amount = '0.00';
  let zakatSubtype = 'Wang Simpanan';
  let bankName = '';
  let chequeNumber = '';

  const icMatch = normalized.match(/\b(\d{2}[-\s]?\d{6})\b/);
  if (icMatch) {
    payerIcNumber = icMatch[1].replace(/\s+/g, '-');
    if (!payerIcNumber.includes('-') && payerIcNumber.length === 8) {
      payerIcNumber = payerIcNumber.slice(0, 2) + '-' + payerIcNumber.slice(2);
    }
  }

  const nameLineMatch = text.match(/(?:نام|nama|diterima\s*drpd|diterima\s*daripada)[\s\:\._]*([A-Za-z\s@]{3,40})/i);
  if (nameLineMatch && nameLineMatch[1]) {
    const raw = nameLineMatch[1].trim();
    if (!raw.toLowerCase().includes('borang') && !raw.toLowerCase().includes('kad') && raw.length > 2) {
      payerName = raw;
    }
  }

  const amountMatch = normalized.match(/(?:\$|B\$|banyak|jumlah)[\s\:\._]*([0-9]+)[\s\|\.,]*([0-9]{2})?/i);
  if (amountMatch && amountMatch[1]) {
    const dollars = amountMatch[1];
    const cents = amountMatch[2] || '00';
    amount = `${dollars}.${cents}`;
  } else {
    const genericAmountMatch = normalized.match(/\b([0-9]+)\s+([0-9]{2})\b/);
    if (genericAmountMatch) {
      amount = `${genericAmountMatch[1]}.${genericAmountMatch[2]}`;
    }
  }

  if (/emas|perak|امس|ڤيرق/i.test(text)) {
    zakatSubtype = 'Emas & Perak';
  } else if (/perniagaan|kedai|syarikat|ڤرنياݢاءن/i.test(text)) {
    zakatSubtype = 'Perniagaan';
  } else if (/pendapatan|gaji|ڤنداڤتن/i.test(text)) {
    zakatSubtype = 'Pendapatan';
  } else if (/saham|pelaburan|سهم/i.test(text)) {
    zakatSubtype = 'Saham & Pelaburan';
  } else if (/simpanan|tabung|سيمڤنن|هـرتـا|harta/i.test(text)) {
    zakatSubtype = 'Wang Simpanan';
  }

  const bankMatch = text.match(/(?:bank|بڠك)[\s\:\._]*([A-Za-z\s]{3,20})/i);
  if (bankMatch && bankMatch[1]) {
    bankName = bankMatch[1].trim();
  }

  const chequeMatch = normalized.match(/(?:nombor\s*cek|no\s*cek|چيک)[\s\:\._]*([0-9]{4,10})/i);
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

export function extractMuzakkiInfo(text: string): { totalMuzakki: number; dependents: number; source: string } {
  const normalized = convertArabicIndicToRomanDigits(text);

  const tanggunganMatch = normalized.match(/(?:tanggungan|تڠݢوڠن|تڠڬوڠن)[\s\:\._]*(\d{1,2})/i);
  if (tanggunganMatch && tanggunganMatch[1]) {
    const dep = parseInt(tanggunganMatch[1], 10);
    if (!isNaN(dep) && dep >= 0 && dep <= 50) {
      return { 
        totalMuzakki: dep + 1, 
        dependents: dep, 
        source: `Tanggungan (${dep} Orang)` 
      };
    }
  }

  for (const [word, val] of Object.entries(JAWI_WORD_MAP)) {
    if (text.includes(word)) {
      return { 
        totalMuzakki: val, 
        dependents: Math.max(0, val - 1), 
        source: `Perkataan Jawi ('${word}' ➔ ${val} Orang)` 
      };
    }
  }

  const muzakkiRomanMatch = normalized.match(/(?:جمله مزكي|مزكي|muzakki|jumlah)[\s\:\._]*(\d{1,2})/i);
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

  return { totalMuzakki: 1, dependents: 0, source: 'Lalai (1 Orang Muzakki)' };
}

export async function compressReceiptImage(
  base64Image: string,
  maxDimension = 800,
  quality = 0.75
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
