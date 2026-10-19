import { notFound } from 'next/navigation';
import { CheckCircle2, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import ImageViewer from './ImageViewer';
import { getReceiptById } from '@/lib/sharepoint-db';

import ReceiptActionButtons from './ReceiptActionButtons';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const userRole = cookieStore.get('auth_role')?.value || 'AMIL';

  const receipt = await getReceiptById(params.id);

  if (!receipt) {
    notFound();
  }

  const isHarta = receipt.zakatType === 'HARTA';

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center py-6 px-4 print:p-0 print:bg-white print:min-h-0 print:block">
      <div className="w-full max-w-md mx-auto print:max-w-full">
        {/* ACTION BUTTONS (NO PRINT) */}
        <ReceiptActionButtons receiptNumber={receipt.receiptNumber} />

        {/* E-RECEIPT TICKET */}
        <div id="receipt-ticket" className={`bg-white rounded-t-3xl shadow-lg overflow-hidden border-2 print:border-none print:shadow-none ${isHarta ? 'border-amber-200' : 'border-teal-200'}`}>
          <div className={`p-6 text-center ${isHarta ? 'bg-amber-50' : 'bg-teal-50'}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner ${isHarta ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'}`}>
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-xl font-black text-slate-800">E-Resit Pembayaran Zakat</h2>
            <p className="text-sm text-slate-500 font-medium">Majlis Ugama Islam Brunei</p>
          </div>
          
          <div className="p-6 border-b border-dashed border-slate-300 relative">
            <div className="absolute -left-3 -top-3 w-6 h-6 bg-slate-100 rounded-full print:hidden"></div>
            <div className="absolute -right-3 -top-3 w-6 h-6 bg-slate-100 rounded-full print:hidden"></div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No. Resit</span>
                  <span className={`font-mono font-black text-lg ${isHarta ? 'text-red-600' : 'text-slate-800'}`}>
                    {receipt.receiptNumber}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Pembayar</span>
                <span className="font-bold text-slate-800 text-base">{receipt.payerName}</span>
                {receipt.isWakalah && (
                  <span className="inline-block mt-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded w-fit">
                    Wakalah
                  </span>
                )}
              </div>
              
              {receipt.payerIcNumber && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">No. Kad Pintar</span>
                  <span className="font-bold text-slate-800 text-base">{receipt.payerIcNumber}</span>
                </div>
              )}
              
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tarikh Bayaran</span>
                <span className="font-bold text-slate-800 text-base">
                  {new Date(receipt.paymentDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          
          <div className={`p-6 border-b border-dashed border-slate-300 relative ${isHarta ? 'bg-amber-50/30' : 'bg-teal-50/30'}`}>
            <div className="absolute -left-3 -top-3 w-6 h-6 bg-slate-100 rounded-full print:hidden"></div>
            <div className="absolute -right-3 -top-3 w-6 h-6 bg-slate-100 rounded-full print:hidden"></div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500">Jenis Zakat</span>
                <span className="font-black text-slate-800 uppercase">{isHarta ? 'Harta' : 'Fitrah'}</span>
              </div>
              
              {!isHarta && receipt.riceType && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Jenis Beras</span>
                  <span className="font-bold text-slate-800">{receipt.riceType}</span>
                </div>
              )}
              
              {!isHarta && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Jumlah Muzakki</span>
                  <span className="font-bold text-slate-800">{receipt.dependents + 1} Orang</span>
                </div>
              )}
              
              {!isHarta && (receipt.dependents > 0 || receipt.dependentReceipts.length > 0) && (
                <div className="pt-2 border-t border-slate-100 border-dashed">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-bold text-slate-500 whitespace-nowrap">No. Resit Tanggungan</span>
                    <div className="text-right pl-2">
                      {receipt.dependentReceipts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono font-bold text-xs text-slate-800 text-right">
                          {receipt.dependentReceipts.map((depNum, idx) => (
                            <span key={idx} className="whitespace-nowrap">{depNum}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 italic">
                          {receipt.dependents} tanggungan diimbas
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100 border-dashed">
                <span className="text-sm font-bold text-slate-500">Jumlah Bayaran</span>
                <span className="text-xl font-black text-slate-800">${receipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* SALINAN ASAL RESIT DIARKIB DI SHAREPOINT */}
          {(receipt.imageShareLink || receipt.dependentShareLinks.length > 0 || receipt.missingDependents > 0) && (
            <div className="p-5 border-t border-dashed border-slate-300 bg-slate-50/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                Salinan Imej Resit Fizikal Diarkib
              </span>
              <ImageViewer 
                mainImage={receipt.imageShareLink} 
                dependentImages={receipt.dependentShareLinks} 
                receiptNumber={receipt.receiptNumber} 
                dependentReceipts={receipt.dependentReceipts} 
                userRole={userRole}
              />
              
              {receipt.missingDependents > 0 && (
                <div className="rounded-xl border border-dashed border-red-300 bg-red-50 p-4 text-red-600 text-xs font-bold mt-2">
                  {receipt.missingDependents} resit tanggungan ditandakan hilang (Resit fizikal tidak dijumpai).
                </div>
              )}
            </div>
          )}
          
        </div>
      </div>
    </main>
  );
}
