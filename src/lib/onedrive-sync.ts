import prisma from '@/lib/prisma';
import { uploadToOneDrive, createSharingLink } from './ms-graph';

/**
 * Memproses fail secara Asynchronous ke OneDrive dan membina PDF
 */
export async function processOneDriveSync(
  receiptId: string, 
  receiptNumber: string, 
  base64MainImage: string | null, 
  base64DepImages: string[],
  dependentReceipts: string[] = []
) {
  try {
    // Tentukan nama folder
    // Jika ada tanggungan, format folder: CS 014008 - CS 014010
    let folderName = receiptNumber;
    if (dependentReceipts.length > 0) {
      const lastDep = dependentReceipts[dependentReceipts.length - 1];
      folderName = `${receiptNumber} - ${lastDep}`;
    }

    // 1. Muat naik Imej Utama
    let mainShareLink = null;
    if (base64MainImage && base64MainImage.startsWith('data:image')) {
      const buffer = base64ToBuffer(base64MainImage);
      const ext = getExtension(base64MainImage);
      const path = `Zakat-Images/${folderName}/Utama-${receiptNumber}.${ext}`;
      const uploadRes = await uploadToOneDrive(path, buffer, getMimeType(ext));
      mainShareLink = await createSharingLink(uploadRes.id);
    }

    // 2. Muat naik Imej Tanggungan
    const depShareLinks: string[] = [];
    for (let i = 0; i < base64DepImages.length; i++) {
      const b64 = base64DepImages[i];
      if (b64 && b64.startsWith('data:image')) {
        const buffer = base64ToBuffer(b64);
        const ext = getExtension(b64);
        const depNum = dependentReceipts[i] || `T${i+1}`;
        const path = `Zakat-Images/${folderName}/Tanggungan-${depNum}.${ext}`;
        const uploadRes = await uploadToOneDrive(path, buffer, getMimeType(ext));
        const link = await createSharingLink(uploadRes.id);
        depShareLinks.push(link);
      }
    }

    // 4. Kemas kini Supabase Database
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        syncStatus: 'COMPLETED',
        imageShareLink: mainShareLink,
        dependentShareLinks: depShareLinks,
        pdfShareLink: null
        // Base64 dikekalkan dalam DB supaya E-Resit boleh paparkan gambar
      }
    });

  } catch (error) {
    console.error("Gagal menyegerak ke OneDrive:", error);
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { syncStatus: 'FAILED' }
    });
    throw error;
  }
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
