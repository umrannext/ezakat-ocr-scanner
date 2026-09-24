/**
 * Modul Pengurusan Simpanan Luar Talian (Offline Storage Beta)
 * Membolehkan para amil merekodkan resit zakat sewaktu ketiadaan talian internet.
 * Data disimpan secara selamat di LocalStorage peranti dan diselaraskan secara
 * automatik (auto-sync) ke pangkalan data apabila talian internet dikesan.
 */

export interface OfflineReceiptItem {
  id: string;
  createdAt: string;
  payload: {
    receiptNumber: string;
    payerName?: string;
    icNumber?: string | null;
    riceTypeId?: string | null;
    totalAmount: number;
    zakatType: 'FITRAH' | 'HARTA';
    imageUrl?: string | null;
    dependents?: number;
    paymentDate?: string | Date;
    hartaSubtype?: string;
    hartaPaymentMethod?: string;
    bankName?: string;
    isWakalah?: boolean;
    isQuickMode?: boolean;
    isVerified?: boolean;
  };
}

const STORAGE_KEY = 'ezakat_offline_receipts_queue';

export function getOfflineReceipts(): OfflineReceiptItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Gagal membaca rekod luar talian:', e);
    return [];
  }
}

export function getOfflineCount(): number {
  return getOfflineReceipts().length;
}

export function saveOfflineReceipt(payload: OfflineReceiptItem['payload']): OfflineReceiptItem {
  const receipts = getOfflineReceipts();
  const newItem: OfflineReceiptItem = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    createdAt: new Date().toISOString(),
    payload
  };

  receipts.push(newItem);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
      window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: receipts.length } }));
    } catch (e) {
      console.warn('Ralat menyimpan ke simpanan luar talian:', e);
    }
  }

  return newItem;
}

export function removeOfflineReceipt(id: string): void {
  const receipts = getOfflineReceipts().filter(item => item.id !== id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
      window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: receipts.length } }));
    } catch (e) {
      console.warn('Ralat mengeluarkan rekod luar talian:', e);
    }
  }
}

export function clearOfflineReceipts(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: 0 } }));
    } catch (e) {
      console.warn('Ralat mengosongkan rekod luar talian:', e);
    }
  }
}

/**
 * Selaraskan semua rekod tertunggak dalam mod luar talian ke pangkalan data utama
 */
export async function syncOfflineReceipts(): Promise<{ total: number; synced: number; failed: number }> {
  const queue = getOfflineReceipts();
  if (queue.length === 0) {
    return { total: 0, synced: 0, failed: 0 };
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { total: queue.length, synced: 0, failed: queue.length };
  }

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          removeOfflineReceipt(item.id);
          synced++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
    } catch (err) {
      console.warn('Gagal sync rekod id:', item.id, err);
      failed++;
    }
  }

  return { total: queue.length, synced, failed };
}
