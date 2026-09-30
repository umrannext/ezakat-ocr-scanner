import prisma from '@/lib/prisma';
import { uploadToOneDrive, createSharingLink } from './ms-graph';
import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Memproses fail secara Asynchronous ke OneDrive dan membina PDF
 */
export async function processOneDriveSync(
  receiptId: string, 
  receiptNumber: string, 
  base64MainImage: string | null, 
  base64DepImages: string[]
) {
  try {
    // 1. Muat naik Imej Utama
    let mainShareLink = null;
    if (base64MainImage && base64MainImage.startsWith('data:image')) {
      const buffer = base64ToBuffer(base64MainImage);
      const ext = getExtension(base64MainImage);
      const path = `Zakat-Images/${receiptNumber}/Utama-${receiptNumber}.${ext}`;
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
        const path = `Zakat-Images/${receiptNumber}/Tanggungan-${i+1}.${ext}`;
        const uploadRes = await uploadToOneDrive(path, buffer, getMimeType(ext));
        const link = await createSharingLink(uploadRes.id);
        depShareLinks.push(link);
      }
    }

    // 3. Jana & Muat naik PDF (Simulasi asas susun atur E-Resit menggunakan pdf-lib)
    let pdfShareLink = null;
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      
      // Tambah Teks Resit ke PDF
      page.drawText(`E-RESIT PEMBAYARAN ZAKAT`, { x: 50, y: 750, size: 24, color: rgb(0, 0.4, 0.4) });
      page.drawText(`No. Resit: ${receiptNumber}`, { x: 50, y: 720, size: 14 });
      
      // Muat Gambar Utama jika ada
      if (base64MainImage) {
        const imgBuffer = base64ToBuffer(base64MainImage);
        let embeddedImage;
        if (base64MainImage.includes('image/png')) {
          embeddedImage = await pdfDoc.embedPng(imgBuffer);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imgBuffer);
        }
        
        const dims = embeddedImage.scale(0.5);
        page.drawImage(embeddedImage, {
          x: 50,
          y: 680 - dims.height,
          width: dims.width,
          height: dims.height
        });
      }

      const pdfBytes = await pdfDoc.save();
      const pdfPath = `Zakat-PDF/${receiptNumber}/${receiptNumber}-EResit.pdf`;
      const pdfUploadRes = await uploadToOneDrive(pdfPath, pdfBytes.buffer, 'application/pdf');
      pdfShareLink = await createSharingLink(pdfUploadRes.id);
    } catch (pdfErr) {
      console.warn("Gagal menjana PDF", pdfErr);
    }

    // 4. Kemas kini Supabase Database
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        syncStatus: 'COMPLETED',
        imageShareLink: mainShareLink,
        dependentShareLinks: depShareLinks,
        pdfShareLink: pdfShareLink,
        // Boleh padam data base64 lama untuk jimat ruang DB
        imageUrl: null,
        dependentImages: []
      }
    });

  } catch (error) {
    console.error("Gagal menyegerak ke OneDrive:", error);
    await prisma.receipt.update({
      where: { id: receiptId },
      data: { syncStatus: 'FAILED' }
    });
  }
}

// Helpers
function base64ToBuffer(base64: string): ArrayBuffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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
