import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Printer, CheckCircle2, Download } from 'lucide-react';
import Link from 'next/link';
import QRDisplay from '@/components/QRDisplay';
import { headers } from 'next/headers';

export default async function ReceiptPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
    include: {
      amil: { select: { name: true, mosque: { include: { zone: true } } } },
      riceType: true,
    }
  });

  if (!receipt) {
    notFound();
  }

  const isHarta = receipt.zakatType === 'HARTA';

  return (
    <main className="min-h-screen bg-slate-100 flex justify-center py-6 px-4 print:p-0 print:bg-white print:min-h-0 print:block">
      <div className="w-full max-w-md mx-auto print:max-w-full">
        {/* ACTION BUTTONS (NO PRINT) */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <Link href="/" className="text-teal-600 font-bold text-sm bg-white px-4 py-2 rounded-full shadow-sm">
            Kembali
          </Link>
          <button 
            id="print-btn"
            className="flex items-center gap-2 bg-slate-900 text-white font-bold px-4 py-2 rounded-full shadow-sm"
          >
            <Download size={16} />
            Simpan PDF
          </button>
        </div>

        {/* E-RECEIPT TICKET */}
        <div id="receipt-content" className={`bg-white rounded-t-3xl shadow-lg overflow-hidden border-2 print:border-none print:shadow-none ${isHarta ? 'border-amber-200' : 'border-teal-200'}`}>
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
                  <span className="font-bold text-slate-800">{receipt.riceType.name}</span>
                </div>
              )}
              
              {!isHarta && receipt.dependents !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">Jumlah Muzakki</span>
                  <span className="font-bold text-slate-800">{receipt.dependents + 1} Orang</span>
                </div>
              )}
            </div>
          </div>
          
          {/* SALINAN ASAL RESIT DIARKIB */}
          {receipt.imageUrl && (
            <div className="p-5 border-t border-dashed border-slate-300 bg-slate-50/50 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">
                Salinan Imej Resit Fizikal Diarkib
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 inline-block shadow-xs max-h-56">
                <img 
                  src={receipt.imageUrl} 
                  alt={`Resit Asal ${receipt.receiptNumber}`} 
                  className="max-h-56 w-auto object-contain mx-auto"
                />
              </div>
            </div>
          )}

          <div className="p-6 flex flex-col items-center justify-center border-t border-dashed border-slate-300">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Imbas untuk versi E-Resit</span>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <QRDisplay url={`https://ezakat-ocr-scanner-v2.umrannext.workers.dev/receipt/${receipt.id}`} />
              </div>
            </div>
            
            <div className="p-6 relative bg-slate-800 text-white rounded-b-2xl print:bg-white print:text-black print:border-t-2 print:border-slate-800 print:rounded-none">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-300 print:text-slate-500 uppercase tracking-widest">Jumlah Bayaran</span>
                <span className="text-3xl font-black">${receipt.totalAmount.toFixed(2)}</span>
              </div>
            </div>
        </div>

        {/* PRINT SCRIPT */}
        <script dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('print-btn')?.addEventListener('click', function() {
              window.print();
            });
          `
        }} />
      </div>
    </main>
  );
}
