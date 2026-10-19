// SharePoint Lists as Enterprise Database for EZakat OCR Scanner
// High-performance, resilient, zero-Prisma, zero-Supabase

import { getGraphToken, getSharePointSiteId } from './ms-graph';

export interface ZakatReceiptRecord {
  id: string;
  receiptNumber: string;
  payerName: string;
  payerIcNumber?: string | null;
  zakatType: 'FITRAH' | 'HARTA';
  hartaSubtype?: string | null;
  riceType?: string | null;
  ricePrice?: number;
  dependents: number;
  totalAmount: number;
  paidAmount: number;
  paymentDate: string; // ISO string
  isVerified: boolean;
  isWakalah: boolean;
  amilId: string;
  amilName: string;
  mosqueName?: string | null;
  zoneName?: string | null;
  groupId?: string | null;
  remarks?: string | null;
  dependentReceipts: string[];
  missingDependents: number;
  imageShareLink?: string | null;
  dependentShareLinks: string[];
  syncStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZakatUserRecord {
  id: string;
  loginId: string;
  name: string;
  passwordHash: string;
  role: 'ADMIN' | 'STAFF' | 'AMIL';
  position?: string | null;
  phoneNumber?: string | null;
  mosqueName?: string | null;
  zoneName?: string | null;
}

export interface ZakatRiceRateRecord {
  id: string;
  code: string;
  name: string;
  price: number;
  activeYear: string;
}

// In-memory cache for fast responsive page transitions
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 6000; // 6 saat (refresh pantas tanpa membebankan SharePoint)

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && (Date.now() - entry.timestamp < CACHE_TTL_MS)) {
    return entry.data;
  }
  return null;
}

function setInCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const k of cache.keys()) {
    if (k.startsWith(prefix)) cache.delete(k);
  }
}

// =========================================================================
// 1. RECEIPT OPERATIONS (ZakatReceipts List)
// =========================================================================

export async function getReceipts(options: { 
  amilId?: string; 
  limit?: number; 
  forceFresh?: boolean 
} = {}): Promise<ZakatReceiptRecord[]> {
  const cacheKey = `receipts_${options.amilId || 'all'}_${options.limit || 100}`;
  if (!options.forceFresh) {
    const cached = getFromCache<ZakatReceiptRecord[]>(cacheKey);
    if (cached) return cached;
  }

  const token = await getGraphToken();
  const siteId = getSharePointSiteId();
  const top = options.limit || 80;

  // Query SharePoint List items with fields expanded
  const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/ZakatReceipts/items?expand=fields&$top=${top}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });

    if (!res.ok) {
      console.warn(`Query ZakatReceipts failed (HTTP ${res.status}), returning empty array`);
      return [];
    }

    const json = await res.json();
    const rawItems = json.value || [];

    const receipts: ZakatReceiptRecord[] = rawItems.map((item: any) => {
      const f = item.fields || {};
      
      let dependentReceipts: string[] = [];
      try {
        if (f.DependentReceipts) {
          dependentReceipts = typeof f.DependentReceipts === 'string' && f.DependentReceipts.startsWith('[')
            ? JSON.parse(f.DependentReceipts)
            : f.DependentReceipts.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      } catch (_) {
        dependentReceipts = [];
      }

      let dependentShareLinks: string[] = [];
      try {
        if (f.DependentShareLinks) {
          dependentShareLinks = typeof f.DependentShareLinks === 'string' && f.DependentShareLinks.startsWith('[')
            ? JSON.parse(f.DependentShareLinks)
            : f.DependentShareLinks.split('\n').map((s: string) => s.trim()).filter(Boolean);
        }
      } catch (_) {
        dependentShareLinks = [];
      }

      return {
        id: String(item.id),
        receiptNumber: f.ReceiptNumber || f.Title || `RZT-${item.id}`,
        payerName: f.PayerName || 'Pembayar Zakat',
        payerIcNumber: f.PayerIcNumber || null,
        zakatType: (f.ZakatType === 'HARTA' ? 'HARTA' : 'FITRAH') as 'FITRAH' | 'HARTA',
        hartaSubtype: f.HartaSubtype || null,
        riceType: f.RiceType || null,
        ricePrice: Number(f.RicePrice) || 0,
        dependents: Number(f.Dependents) || 0,
        totalAmount: Number(f.TotalAmount) || 0,
        paidAmount: Number(f.PaidAmount) || Number(f.TotalAmount) || 0,
        paymentDate: f.PaymentDate || f.Created || new Date().toISOString(),
        isVerified: Boolean(f.IsVerified),
        isWakalah: Boolean(f.IsWakalah),
        amilId: f.AmilId || 'unknown',
        amilName: f.AmilName || 'Amil',
        mosqueName: f.MosqueName || null,
        zoneName: f.ZoneName || null,
        groupId: f.GroupId || null,
        remarks: f.Remarks || null,
        dependentReceipts,
        missingDependents: Number(f.MissingDependents) || 0,
        imageShareLink: f.ImageShareLink || null,
        dependentShareLinks,
        syncStatus: f.SyncStatus || 'COMPLETED',
        createdAt: f.CreatedDate || f.Created || new Date().toISOString(),
        updatedAt: f.Modified || new Date().toISOString(),
      };
    });

    // Susun secara kronologi terkini di atas
    receipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter by amilId if specified
    const filtered = options.amilId 
      ? receipts.filter(r => r.amilId === options.amilId)
      : receipts;

    setInCache(cacheKey, filtered);
    return filtered;
  } catch (err: any) {
    console.error('Error fetching receipts from SharePoint:', err);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getReceiptById(idOrNumber: string): Promise<ZakatReceiptRecord | null> {
  const all = await getReceipts({ limit: 200 });
  const found = all.find(r => r.id === idOrNumber || r.receiptNumber === idOrNumber);
  if (found) return found;

  // Cuba fetch terus mengikut ID item SharePoint jika belum dijumpai
  try {
    const token = await getGraphToken();
    const siteId = getSharePointSiteId();
    const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/ZakatReceipts/items/${idOrNumber}?expand=fields`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const item = await res.json();
      const f = item.fields || {};
      return {
        id: String(item.id),
        receiptNumber: f.ReceiptNumber || f.Title,
        payerName: f.PayerName || 'Pembayar Zakat',
        payerIcNumber: f.PayerIcNumber || null,
        zakatType: f.ZakatType || 'FITRAH',
        hartaSubtype: f.HartaSubtype || null,
        riceType: f.RiceType || null,
        ricePrice: Number(f.RicePrice) || 0,
        dependents: Number(f.Dependents) || 0,
        totalAmount: Number(f.TotalAmount) || 0,
        paidAmount: Number(f.PaidAmount) || Number(f.TotalAmount) || 0,
        paymentDate: f.PaymentDate || f.Created || new Date().toISOString(),
        isVerified: Boolean(f.IsVerified),
        isWakalah: Boolean(f.IsWakalah),
        amilId: f.AmilId || 'unknown',
        amilName: f.AmilName || 'Amil',
        mosqueName: f.MosqueName || null,
        zoneName: f.ZoneName || null,
        groupId: f.GroupId || null,
        remarks: f.Remarks || null,
        dependentReceipts: f.DependentReceipts ? JSON.parse(f.DependentReceipts) : [],
        missingDependents: Number(f.MissingDependents) || 0,
        imageShareLink: f.ImageShareLink || null,
        dependentShareLinks: f.DependentShareLinks ? JSON.parse(f.DependentShareLinks) : [],
        syncStatus: f.SyncStatus || 'COMPLETED',
        createdAt: f.CreatedDate || f.Created || new Date().toISOString(),
        updatedAt: f.Modified || new Date().toISOString(),
      };
    }
  } catch (_) {}

  return null;
}

export async function createReceipt(data: {
  receiptNumber: string;
  payerName: string;
  payerIcNumber?: string | null;
  zakatType: 'FITRAH' | 'HARTA';
  hartaSubtype?: string | null;
  riceType?: string | null;
  ricePrice?: number;
  dependents?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentDate?: string;
  isVerified?: boolean;
  isWakalah?: boolean;
  amilId: string;
  amilName: string;
  mosqueName?: string | null;
  zoneName?: string | null;
  groupId?: string | null;
  remarks?: string | null;
  dependentReceipts?: string[];
  missingDependents?: number;
  imageShareLink?: string | null;
  dependentShareLinks?: string[];
}): Promise<ZakatReceiptRecord> {
  const token = await getGraphToken();
  const siteId = getSharePointSiteId();

  const nowIso = new Date().toISOString();
  const fields = {
    Title: data.receiptNumber,
    ReceiptNumber: data.receiptNumber,
    PayerName: data.payerName,
    PayerIcNumber: data.payerIcNumber || '',
    ZakatType: data.zakatType,
    HartaSubtype: data.hartaSubtype || '',
    RiceType: data.riceType || '',
    RicePrice: data.ricePrice || 0,
    Dependents: data.dependents || 0,
    TotalAmount: data.totalAmount,
    PaidAmount: data.paidAmount ?? data.totalAmount,
    PaymentDate: data.paymentDate || nowIso,
    IsVerified: Boolean(data.isVerified),
    IsWakalah: Boolean(data.isWakalah),
    AmilId: data.amilId,
    AmilName: data.amilName,
    MosqueName: data.mosqueName || '',
    ZoneName: data.zoneName || '',
    GroupId: data.groupId || '',
    Remarks: data.remarks || '',
    DependentReceipts: JSON.stringify(data.dependentReceipts || []),
    MissingDependents: data.missingDependents || 0,
    ImageShareLink: data.imageShareLink || '',
    DependentShareLinks: JSON.stringify(data.dependentShareLinks || []),
    SyncStatus: 'COMPLETED',
    CreatedDate: nowIso
  };

  const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/ZakatReceipts/items`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal menyimpan resit ke SharePoint List: ${errorText}`);
  }

  const item = await res.json();
  invalidateCache('receipts_');

  return {
    id: String(item.id),
    receiptNumber: data.receiptNumber,
    payerName: data.payerName,
    payerIcNumber: data.payerIcNumber,
    zakatType: data.zakatType,
    hartaSubtype: data.hartaSubtype,
    riceType: data.riceType,
    ricePrice: data.ricePrice || 0,
    dependents: data.dependents || 0,
    totalAmount: data.totalAmount,
    paidAmount: data.paidAmount ?? data.totalAmount,
    paymentDate: data.paymentDate || nowIso,
    isVerified: Boolean(data.isVerified),
    isWakalah: Boolean(data.isWakalah),
    amilId: data.amilId,
    amilName: data.amilName,
    mosqueName: data.mosqueName,
    zoneName: data.zoneName,
    groupId: data.groupId,
    remarks: data.remarks,
    dependentReceipts: data.dependentReceipts || [],
    missingDependents: data.missingDependents || 0,
    imageShareLink: data.imageShareLink,
    dependentShareLinks: data.dependentShareLinks || [],
    syncStatus: 'COMPLETED',
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

export async function updateReceipt(id: string, patch: Partial<{
  payerName: string;
  payerIcNumber: string;
  totalAmount: number;
  dependents: number;
  remarks: string;
  imageShareLink: string;
  dependentShareLinks: string[];
}>) {
  const token = await getGraphToken();
  const siteId = getSharePointSiteId();

  const fieldsToUpdate: any = {};
  if (patch.payerName !== undefined) fieldsToUpdate.PayerName = patch.payerName;
  if (patch.payerIcNumber !== undefined) fieldsToUpdate.PayerIcNumber = patch.payerIcNumber;
  if (patch.totalAmount !== undefined) fieldsToUpdate.TotalAmount = patch.totalAmount;
  if (patch.dependents !== undefined) fieldsToUpdate.Dependents = patch.dependents;
  if (patch.remarks !== undefined) fieldsToUpdate.Remarks = patch.remarks;
  if (patch.imageShareLink !== undefined) fieldsToUpdate.ImageShareLink = patch.imageShareLink;
  if (patch.dependentShareLinks !== undefined) fieldsToUpdate.DependentShareLinks = JSON.stringify(patch.dependentShareLinks);

  const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/ZakatReceipts/items/${id}/fields`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(fieldsToUpdate)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mengemaskini resit di SharePoint: ${errorText}`);
  }

  invalidateCache('receipts_');
  return true;
}

export async function deleteReceipt(id: string) {
  const token = await getGraphToken();
  const siteId = getSharePointSiteId();

  const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/ZakatReceipts/items/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal memadam resit di SharePoint: ${errorText}`);
  }

  invalidateCache('receipts_');
  return true;
}

// =========================================================================
// 2. USER OPERATIONS (ZakatUsers List & Resilient Fallback)
// =========================================================================

// Fallback users sentiasa tersedia supaya sistem tidak pernah terkunci
const FALLBACK_USERS: ZakatUserRecord[] = [
  {
    id: 'user-admin',
    loginId: 'admin',
    name: 'Pentadbir Utama',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // admin123
    role: 'ADMIN',
    position: 'Pegawai Zakat',
    phoneNumber: '02-222333',
    mosqueName: 'Jabatan Majlis Ugama Islam Brunei',
    zoneName: 'Bandar Seri Begawan'
  },
  {
    id: 'user-staf',
    loginId: 'staf',
    name: 'Staf Arkib JUZWAB',
    passwordHash: 'f454261882d33454b6732432a514d7b7e54f9a567675de6d900ad43657ff2506', // staf123
    role: 'STAFF',
    position: 'Pegawai Arkib',
    phoneNumber: '02-222444',
    mosqueName: 'Pusat Arkib JUZWAB',
    zoneName: 'Brunei-Muara'
  },
  {
    id: 'user-amil-1',
    loginId: 'AMIL-Z01-001',
    name: 'Ustaz Ahmad Tarmizi',
    passwordHash: '5e0503f8f12cc20a7b6b158028723b49911e86ba2dfd860e6113b52aa9820f18', // amil123
    role: 'AMIL',
    position: 'Imam',
    phoneNumber: '0812-444555',
    mosqueName: "Masjid Jame' Asr Hassanil Bolkiah",
    zoneName: 'Zon 1 (Brunei-Muara)'
  },
  {
    id: 'user-amil-2',
    loginId: 'AMIL-Z02-001',
    name: 'Haji Rosli Bin Hassan',
    passwordHash: '5e0503f8f12cc20a7b6b158028723b49911e86ba2dfd860e6113b52aa9820f18', // amil123
    role: 'AMIL',
    position: 'Bilal',
    phoneNumber: '0813-777888',
    mosqueName: 'Masjid Mohammad Jamalul Alam',
    zoneName: 'Zon 2 (Belait)'
  }
];

export async function getAllUsers(): Promise<ZakatUserRecord[]> {
  const cached = getFromCache<ZakatUserRecord[]>('all_users');
  if (cached) return cached;

  try {
    const token = await getGraphToken();
    const siteId = getSharePointSiteId();
    const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/ZakatUsers/items?expand=fields&$top=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const json = await res.json();
      const items = json.value || [];
      if (items.length > 0) {
        const users: ZakatUserRecord[] = items.map((item: any) => {
          const f = item.fields || {};
          return {
            id: String(item.id),
            loginId: f.LoginId || f.Title,
            name: f.FullName || f.Title,
            passwordHash: f.PasswordHash,
            role: (f.Role || 'AMIL').toUpperCase() as any,
            position: f.Position || null,
            phoneNumber: f.PhoneNumber || null,
            mosqueName: f.MosqueName || null,
            zoneName: f.ZoneName || null,
          };
        });
        setInCache('all_users', users);
        return users;
      }
    }
  } catch (err) {
    console.warn('SharePoint ZakatUsers fetch notice, using default list:', err);
  }

  return FALLBACK_USERS;
}

export async function getUserByLoginId(loginId: string): Promise<ZakatUserRecord | null> {
  const clean = loginId.trim().toLowerCase();
  const users = await getAllUsers();
  return users.find(u => u.loginId.toLowerCase() === clean) || null;
}

export async function getUserById(id: string): Promise<ZakatUserRecord | null> {
  const users = await getAllUsers();
  return users.find(u => u.id === id || u.loginId === id) || null;
}

// =========================================================================
// 3. RATES & SETTINGS (ZakatRates List)
// =========================================================================

const DEFAULT_RICE_RATES: ZakatRiceRateRecord[] = [
  { id: 'rate-siam-1447', code: 'B_SIAM_1447H', name: 'Beras Siam', price: 1.93, activeYear: '1447H' },
  { id: 'rate-wangi-1447', code: 'B_WANGI_1447H', name: 'Beras Wangi', price: 2.84, activeYear: '1447H' },
  { id: 'rate-siam-1446', code: 'B_SIAM_1446H', name: 'Beras Siam', price: 1.90, activeYear: '1446H' },
  { id: 'rate-wangi-1446', code: 'B_WANGI_1446H', name: 'Beras Wangi', price: 2.80, activeYear: '1446H' }
];

export async function getRiceRates(): Promise<ZakatRiceRateRecord[]> {
  const cached = getFromCache<ZakatRiceRateRecord[]>('rice_rates');
  if (cached) return cached;

  try {
    const token = await getGraphToken();
    const siteId = getSharePointSiteId();
    const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/ZakatRates/items?expand=fields`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      const json = await res.json();
      const items = json.value || [];
      if (items.length > 0) {
        const rates: ZakatRiceRateRecord[] = items.map((item: any) => {
          const f = item.fields || {};
          return {
            id: String(item.id),
            code: f.Code || f.Title,
            name: f.RiceName || f.Title,
            price: Number(f.Price) || 0,
            activeYear: f.ActiveYear || '1447H'
          };
        });
        setInCache('rice_rates', rates);
        return rates;
      }
    }
  } catch (err) {
    console.warn('SharePoint ZakatRates fetch notice, using defaults:', err);
  }

  return DEFAULT_RICE_RATES;
}

export async function updateRiceRate(id: string, price: number) {
  const token = await getGraphToken();
  const siteId = getSharePointSiteId();

  const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/ZakatRates/items/${id}/fields`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ Price: price })
  });

  if (!res.ok) {
    throw new Error('Gagal mengemaskini kadar beras di SharePoint');
  }

  invalidateCache('rice_rates');
  return true;
}
