'use client';

import { BarChart3, Download, PackageOpen, Coins, Wallet } from 'lucide-react';

export default function AdminDashboard({ data }: { data: any }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 relative z-10">
      <div className="flex flex-col mb-6">
        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-teal-500" />
          Dashboard Kutipan (Admin)
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">Ringkasan rekod keseluruhan sistem.</p>
      </div>

      <div className="space-y-3 mb-6">
        {/* Row 1: Beras Wangi */}
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700">
              <PackageOpen size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Zakat Fitrah (Beras Wangi)</p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">{data.wangi?.count || 0} Resit Diarkib</p>
            </div>
          </div>
          <p className="text-xl font-black text-emerald-700">${(data.wangi?.amount || 0).toFixed(2)}</p>
        </div>

        {/* Row 2: Beras Siam */}
        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200/50 flex items-center justify-center text-amber-700">
              <PackageOpen size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Zakat Fitrah (Beras Siam)</p>
              <p className="text-[11px] font-bold text-amber-600 mt-0.5">{data.siam?.count || 0} Resit Diarkib</p>
            </div>
          </div>
          <p className="text-xl font-black text-amber-700">${(data.siam?.amount || 0).toFixed(2)}</p>
        </div>

        {/* Row 3: Zakat Harta */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-200/50 flex items-center justify-center text-blue-700">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Zakat Harta</p>
              <p className="text-[11px] font-bold text-blue-600 mt-0.5">{data.harta?.count || 0} Resit Diarkib</p>
            </div>
          </div>
          <p className="text-xl font-black text-blue-700">${(data.harta?.amount || 0).toFixed(2)}</p>
        </div>
      </div>
      
      <div className="mt-2 pt-6 border-t border-slate-100">
        <a href={`/api/export/receipts`} className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98]">
          <Download size={18} />
          Muat Turun Database Penuh (CSV)
        </a>
        <p className="text-center text-[10px] text-slate-400 mt-2">Termasuk perincian timestamp & wakalah</p>
      </div>
    </div>
  );
}
