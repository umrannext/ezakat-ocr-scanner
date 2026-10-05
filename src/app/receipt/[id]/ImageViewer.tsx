'use client';

import { useState } from 'react';
import { Eye, EyeOff, ExternalLink } from 'lucide-react';

export default function ImageViewer({ 
  mainImage, 
  dependentImages, 
  receiptNumber, 
  dependentReceipts 
}: { 
  mainImage: string | null, 
  dependentImages: string[], 
  receiptNumber: string,
  dependentReceipts: string[]
}) {
  const [isOpen, setIsOpen] = useState(false);

  const renderContent = (src: string, title: string) => {
    if (src.startsWith('http')) {
      return (
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors group"
        >
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ExternalLink size={24} />
          </div>
          <span className="font-bold text-slate-700 text-sm">Buka Fail di SharePoint</span>
          <span className="text-xs text-slate-400 mt-1">{title}</span>
        </a>
      );
    }
    
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 inline-block shadow-xs">
        <img src={src} alt={title} className="w-full max-w-md h-auto object-contain mx-auto" loading="lazy" />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="mx-auto flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full text-xs font-bold transition-colors print:hidden"
      >
        {isOpen ? <EyeOff size={14} /> : <Eye size={14} />}
        {isOpen ? 'Sembunyikan Lampiran Resit' : 'Papar Lampiran Resit Penuh'}
      </button>

      {isOpen && (
        <div className="space-y-6 mt-4 animate-in fade-in duration-300">
          {/* Main Receipt Image */}
          {mainImage && (
            <div className="relative">
              {(dependentImages.length > 0) && (
                <div className="text-[10px] font-black text-slate-400 mb-1">Resit Utama ({receiptNumber})</div>
              )}
              {renderContent(mainImage, "Resit Utama")}
            </div>
          )}
          
          {/* Dependent Receipt Images */}
          {dependentImages.map((img, idx) => (
            <div key={`dep-${idx}`} className="relative">
              <div className="text-[10px] font-black text-slate-400 mb-1 mt-4">
                Resit Tanggungan {idx + 1} {dependentReceipts[idx] ? `(${dependentReceipts[idx]})` : ''}
              </div>
              {renderContent(img, `Resit Tanggungan ${idx + 1}`)}
            </div>
          ))}
        </div>
      )}
      
      <div className="hidden print:block space-y-6 mt-4">
        {mainImage && (
            <div className="relative">
            {(dependentImages.length > 0) && (
                <div className="text-[10px] font-black text-slate-400 mb-1">Resit Utama ({receiptNumber})</div>
            )}
            {renderContent(mainImage, "Resit Utama")}
            </div>
        )}
        
        {dependentImages.map((img, idx) => (
          <div key={`dep-print-${idx}`} className="relative">
            <div className="text-[10px] font-black text-slate-400 mb-1 mt-4">
              Resit Tanggungan {idx + 1} {dependentReceipts[idx] ? `(${dependentReceipts[idx]})` : ''}
            </div>
            {renderContent(img, `Resit Tanggungan ${idx + 1}`)}
          </div>
        ))}
      </div>
    </div>
  );
}
