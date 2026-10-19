'use client';

import React from 'react';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function ImageViewer({ 
  mainImage, 
  dependentImages = [], 
  receiptNumber, 
  dependentReceipts = [],
  userRole = 'AMIL'
}: { 
  mainImage?: string | null, 
  dependentImages?: string[], 
  receiptNumber: string,
  dependentReceipts?: string[],
  userRole?: string
}) {

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (userRole !== 'ADMIN') {
      e.preventDefault();
      alert('Hanya ADMIN pusat sahaja yang mempunyai akses untuk membuka dan melihat salinan resit asal ini di SharePoint.');
    }
  };

  const renderContent = (src: string, title: string) => {
    if (src.startsWith('http')) {
      const proxyUrl = `/api/thumbnail?url=${encodeURIComponent(src)}`;
      return (
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleLinkClick}
          className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-teal-300 hover:bg-teal-50 transition-all group print:hidden"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg group-hover:bg-teal-100 group-hover:text-teal-700 transition-colors shrink-0">
              <ExternalLink size={18} />
            </div>
            <div className="text-left overflow-hidden">
              <span className="text-xs font-bold text-slate-700 block truncate group-hover:text-teal-800">
                Buka Fail di SharePoint
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {title}
              </span>
            </div>
          </div>
          
          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200/80 overflow-hidden flex items-center justify-center shrink-0 ml-3 shadow-inner">
            <img 
              src={proxyUrl} 
              alt="Thumbnail" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </div>
        </a>
      );
    }

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
        <span className="text-[10px] font-bold text-slate-400 block mb-1 text-left px-1">{title}</span>
        <div className="relative rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center min-h-[140px]">
          <img 
            src={src} 
            alt={title} 
            className="w-full h-auto max-h-[300px] object-contain rounded-lg"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {mainImage && renderContent(mainImage, `Resit Utama (${receiptNumber})`)}

      {dependentImages.map((src, idx) => {
        const depNum = dependentReceipts[idx] ? `Resit Tanggungan (${dependentReceipts[idx]})` : `Resit Tanggungan #${idx + 1}`;
        return (
          <div key={idx}>
            {renderContent(src, depNum)}
          </div>
        );
      })}
    </div>
  );
}
