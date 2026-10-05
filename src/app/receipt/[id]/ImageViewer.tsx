import { ExternalLink } from 'lucide-react';

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

  const renderContent = (src: string, title: string) => {
    if (src.startsWith('http')) {
      return (
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-teal-300 hover:bg-teal-50 transition-all group print:hidden"
        >
          <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-md flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <ExternalLink size={16} />
          </div>
          <div className="flex flex-col text-left overflow-hidden">
            <span className="font-bold text-slate-700 text-xs leading-tight truncate">Buka Fail di SharePoint</span>
            <span className="text-[10px] text-slate-400 font-medium truncate">{title}</span>
          </div>
        </a>
      );
    }
    
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 inline-block shadow-xs mt-2 w-full">
        <img src={src} alt={title} className="w-full h-auto object-contain" loading="lazy" />
      </div>
    );
  };

  return (
    <div className="space-y-3 mt-4 text-left">
      {/* Main Receipt Image */}
      {mainImage && (
        <div className="relative">
          {(dependentImages.length > 0) && (
            <div className="text-[10px] font-black text-slate-400 mb-1 ml-1">Resit Utama ({receiptNumber})</div>
          )}
          {renderContent(mainImage, "Resit Utama")}
        </div>
      )}
      
      {/* Dependent Receipt Images */}
      {dependentImages.map((img, idx) => (
        <div key={`dep-${idx}`} className="relative mt-2">
          <div className="text-[10px] font-black text-slate-400 mb-1 ml-1">
            Resit Tanggungan {idx + 1} {dependentReceipts[idx] ? `(${dependentReceipts[idx]})` : ''}
          </div>
          {renderContent(img, `Resit Tanggungan ${idx + 1}`)}
        </div>
      ))}
    </div>
  );
}
