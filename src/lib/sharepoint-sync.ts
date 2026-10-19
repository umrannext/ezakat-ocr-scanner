import { uploadToOneDrive, createSharingLink } from './ms-graph';

export interface SyncImagesResult {
  imageShareLink: string | null;
  dependentShareLinks: string[];
}

export async function uploadReceiptImagesToSharePoint(
  receiptNumber: string,
  base64MainImage: string | null,
  base64DepImages: string[] = [],
  dependentReceipts: string[] = []
): Promise<SyncImagesResult> {
  let imageShareLink: string | null = null;
  const dependentShareLinks: string[] = [];

  // Tentukan nama folder mengikut konvensi pengguna:
  // Jika ada tanggungan: CS xxxxxx - CS xxxxxx
  // Jika tiada: CS xxxxxx
  let folderName = receiptNumber.replace(/[\/\\]/g, '-').trim();
  if (dependentReceipts.length > 0) {
    const lastDep = dependentReceipts[dependentReceipts.length - 1].replace(/[\/\\]/g, '-').trim();
    folderName = `${folderName} - ${lastDep}`;
  }

  // 1. Muat naik Imej Utama
  if (base64MainImage && base64MainImage.startsWith('data:image')) {
    try {
      const buffer = base64ToBuffer(base64MainImage);
      const ext = getExtension(base64MainImage);
      const safeRecNum = receiptNumber.replace(/[\/\\]/g, '-').trim();
      const path = `Zakat-Images/${folderName}/Utama-${safeRecNum}.${ext}`;
      
      const uploadRes = await uploadWithRetry(path, buffer, getMimeType(ext), 2);
      if (uploadRes?.id) {
        imageShareLink = await createLinkWithRetry(uploadRes.id, 2);
      }
    } catch (err: any) {
      console.error(`Gagal memuat naik imej utama (${receiptNumber}) ke SharePoint:`, err?.message);
    }
  }

  // 2. Muat naik Imej Tanggungan
  for (let i = 0; i < base64DepImages.length; i++) {
    const b64 = base64DepImages[i];
    if (b64 && b64.startsWith('data:image')) {
      const depNum = (dependentReceipts[i] || `T${i + 1}`).replace(/[\/\\]/g, '-').trim();
      try {
        const buffer = base64ToBuffer(b64);
        const ext = getExtension(b64);
        const path = `Zakat-Images/${folderName}/Tanggungan-${depNum}.${ext}`;
        
        const uploadRes = await uploadWithRetry(path, buffer, getMimeType(ext), 2);
        if (uploadRes?.id) {
          const link = await createLinkWithRetry(uploadRes.id, 2);
          dependentShareLinks.push(link);
        }
      } catch (err: any) {
        console.error(`Gagal memuat naik imej tanggungan (${depNum}) ke SharePoint:`, err?.message);
      }
    }
  }

  return {
    imageShareLink,
    dependentShareLinks
  };
}

async function uploadWithRetry(
  path: string, 
  buffer: ArrayBuffer, 
  contentType: string, 
  maxAttempts = 2
): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await uploadToOneDrive(path, buffer, contentType);
    } catch (err: any) {
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, 800 * attempt));
    }
  }
}

async function createLinkWithRetry(itemId: string, maxAttempts = 2): Promise<string> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await createSharingLink(itemId);
    } catch (err: any) {
      if (attempt === maxAttempts) throw err;
      await new Promise(r => setTimeout(r, 600 * attempt));
    }
  }
  return '';
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
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
