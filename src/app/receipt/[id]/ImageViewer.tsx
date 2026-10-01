'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 inline-block shadow-xs">
                <img src={mainImage} alt="Resit Utama" className="w-full max-w-md h-auto object-contain mx-auto" loading="lazy" />
              </div>
            </div>
          )}
          
          {/* Dependent Receipt Images */}
          {dependentImages.map((img, idx) => (
            <div key={`dep-${idx}`} className="relative">
              <div className="text-[10px] font-black text-slate-400 mb-1 mt-4">
                Resit Tanggungan {idx + 1} {dependentReceipts[idx] ? `(${dependentReceipts[idx]})` : ''}
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 inline-block shadow-xs">
                <img src={img} alt={`Resit Tanggungan ${idx + 1}`} className="w-full max-w-md h-auto object-contain mx-auto" loading="lazy" />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="hidden print:block space-y-6 mt-4">
        {/* Main Receipt Image */}
        {mainImage && (
            <div className="relative">
            {(dependentImages.length > 0) && (
                <div className="text-[10px] font-black text-slate-400 mb-1">Resit Utama ({receiptNumber})</div>
            )}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 inline-block shadow-xs">
                <img src={mainImage} alt="Resit Utama" className="w-full max-w-md h-auto object-contain mx-auto" />
            </div>
            </div>
        )}
        
        {/* Dependent Receipt Images */}
        {dependentImages.map((img, idx) => (
          <div key={`dep-print-${idx}`} className="relative">
            <div className="text-[10px] font-black text-slate-400 mb-1 mt-4">
              Resit Tanggungan {idx + 1} {dependentReceipts[idx] ? `(${dependentReceipts[idx]})` : ''}
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 inline-block shadow-xs">
              <img src={img} alt={`Resit Tanggungan ${idx + 1}`} className="w-full max-w-md h-auto object-contain mx-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
