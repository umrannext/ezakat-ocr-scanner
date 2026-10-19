'use client';

import React, { useState } from 'react';
import { Download, Printer, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReceiptActionButtons({ 
  receiptNumber 
}: { 
  receiptNumber: string 
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('receipt-ticket');
      if (!element) {
        window.print();
        setIsGeneratingPdf(false);
        return;
      }

      // Import dinamik di sisi klien
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const canvas = await html2canvas(element, {
        scale: 2.5, // Resolusi tinggi supaya teks jelas dan tajam
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const imgWidth = 210; // Lebar standard A4 (mm)
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: imgHeight > pageHeight ? [imgWidth, imgHeight + 10] : 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 5, imgWidth, imgHeight);
      const safeFilename = `E-Resit-${receiptNumber.replace(/[\/\\]/g, '-')}.pdf`;
      pdf.save(safeFilename);
    } catch (err) {
      console.error('Ralat jana PDF, guna print fallback:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex justify-between items-center mb-4 print:hidden gap-2">
      <Link 
        href="/history" 
        className="flex items-center gap-1.5 text-teal-600 font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm hover:bg-teal-50 active:scale-95 transition-all"
      >
        <ArrowLeft size={16} />
        <span>Kembali</span>
      </Link>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-white text-slate-700 font-bold px-3.5 py-2 rounded-full shadow-sm hover:bg-slate-50 border border-slate-200 active:scale-95 transition-all text-xs"
          title="Cetak Resit"
        >
          <Printer size={15} />
          <span>Cetak</span>
        </button>

        <button 
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex items-center gap-1.5 bg-slate-900 text-white font-bold px-4 py-2 rounded-full shadow-sm hover:bg-slate-800 active:scale-95 transition-all text-xs disabled:opacity-70"
          title="Muat Turun PDF"
        >
          {isGeneratingPdf ? (
            <Loader2 size={15} className="animate-spin text-teal-400" />
          ) : (
            <Download size={15} className="text-teal-400" />
          )}
          <span>{isGeneratingPdf ? 'Memproses...' : 'Simpan PDF'}</span>
        </button>
      </div>
    </div>
  );
}
