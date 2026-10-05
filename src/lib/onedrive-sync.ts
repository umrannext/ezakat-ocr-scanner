import prisma from '@/lib/prisma';
import { uploadToOneDrive, createSharingLink } from './ms-graph';

/**
 * Memproses fail secara Asynchronous ke OneDrive dan membina PDF
 * Fungsi ini dirancang untuk jalan di latar belakang tanpa menyebabkan timeout pada request.
 */
export async function processOneDriveSync(
  receiptId: string, 
  receiptNumber: string, 
  base64MainImage: string | null, 
  base64DepImages: string[],
  dependentReceipts: string[] = []
) {
  // Jika tiada imej sama sekali, kemaskini DB status ke COMPLETED
  if (!base64MainImage || !base64MainImage.startsWith('data:image')) {
    if (!base64DepImages.some(img => img?.startsWith('data:image'))) {
      try {
        await prisma.receipt.update({
          where: { id: receiptId },
          data: { syncStatus: 'COMPLETED' }
        });
      } catch (err) {
        console.error("Gagal kemaskini status untuk resit tanpa imej:", receiptId, err);
      }
      return;
    }
  }

  try {
    // Tentukan nama folder
    let folderName = receiptNumber;
    if (dependentReceipts.length > 0) {
      const lastDep = dependentReceipts[dependentReceipts.length - 1];
      folderName = `${receiptNumber} - ${lastDep}`;
    }

    // 1. Muat naik Imej Utama (dengan retry)
    let mainShareLink = null;
    if (base64MainImage && base64MainImage.startsWith('data:image')) {
      try {
        const buffer = base64ToBuffer(base64MainImage);
        const ext = getExtension(base64MainImage);
        const path = `Zakat-Images/${folderName}/Utama-${receiptNumber}.${ext}`;
        const uploadRes = await uploadToOneDriveWithRetry(path, buffer, getMimeType(ext), 3);
        mainShareLink = await createSharingLinkWithRetry(uploadRes.id, 2);
      } catch (err) {
        console.error("Gagal muat naik imej utama untuk resit:", receiptNumber, err);
      }
    }

    // 2. Muat naik Imej Tanggungan (dengan retry)
    const depShareLinks: string[] = [];
    for (let i = 0; i < base64DepImages.length; i++) {
      const b64 = base64DepImages[i];
      if (b64 && b64.startsWith('data:image')) {
        const depNum = dependentReceipts[i] || `T${i+1}`;
        try {
          const buffer = base64ToBuffer(b64);
          const ext = getExtension(b64);
          const path = `Zakat-Images/${folderName}/Tanggungan-${depNum}.${ext}`;
          const uploadRes = await uploadToOneDriveWithRetry(path, buffer, getMimeType(ext), 3);
          const link = await createSharingLinkWithRetry(uploadRes.id, 2);
          depShareLinks.push(link);
        } catch (err) {
          console.error("Gagal muat naik imej tanggungan untuk resit:", receiptNumber, depNum, err);
        }
      }
    }

    // 3. Kemas kini Supabase Database
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        syncStatus: 'COMPLETED',
        imageShareLink: mainShareLink,
        dependentShareLinks: depShareLinks,
        pdfShareLink: null
      }
    });

  } catch (error) {
    console.error("Gagal segerak ke OneDrive untuk resit:", receiptNumber, error);
    try {
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { syncStatus: 'FAILED' }
      });
    } catch (updateErr) {
      console.error("Gagal kemaskini status FAILED:", updateErr);
    }
  }
}

// Helper untuk retry upload dengan exponential backoff
async function uploadToOneDriveWithRetry(
  path: string, 
  buffer: Buffer | ArrayBuffer, 
  contentType: string, 
  maxAttempts: number = 3
): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadToOneDrive(path, buffer, contentType);
    } catch (err: any) {
      if (attempt === maxAttempts) throw err;
      const backoffMs = attempt * 1000; // 1s, 2s, 3s...
      console.warn(`Percubaan upload gagal (${attempt}/${maxAttempts}). Retry dalam ${backoffMs}ms:`, err?.message);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
}

// Helper untuk retry membuat sharing link
async function createSharingLinkWithRetry(
  itemId: string, 
  maxAttempts: number = 2
): Promise<string> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await createSharingLink(itemId);
    } catch (err: any) {
      lastError = err;
      if (attempt === maxAttempts) break;
      const backoffMs = attempt * 500;
      console.warn(`Percubaan link gagal (${attempt}/${maxAttempts}). Retry dalam ${backoffMs}ms:`, err?.message);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }
  throw lastError;
}

// Helpers
function base64ToBuffer(base64: string): ArrayBuffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  // Guna Buffer yang lebih pantas dan stabil berbanding atob() untuk string gergasi
  const buffer = Buffer.from(base64Data, 'base64');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

function getExtension(base64: string): string {
  if (base64.includes('image/png')) return 'png';
  if (base64.includes('image/webp')) return 'webp';
  return 'jpg';
}

function getMimeType(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}
