'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, Download, PackageOpen, Wallet, Calendar, Coins } from 'lucide-react';

export default function AdminDashboard({ data, currentYear }: { data: any, currentYear: string }) {
  const router = useRouter();
  const years = ['1446H', '1447H', '1448H'];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-8 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-teal-500" />
            Dashboard Kutipan (Admin)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Ringkasan keseluruhan mengikut Tahun Hijrah.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <Calendar size={16} className="text-slate-400 ml-2" />
          <select 
            value={currentYear}
            onChange={(e) => router.push(`/?year=${e.target.value}`)}
            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* BIG TOTAL BOX */}
      <div className="bg-gradient-to-br from-teal-900 to-emerald-800 rounded-3xl p-6 mb-6 text-white text-center shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <p className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-1 relative z-10">Kutipan Keseluruhan ({currentYear})</p>
        <div className="flex items-baseline justify-center gap-1 relative z-10">
          <span className="text-2xl font-bold text-teal-300/80">$</span>
          <p className="text-5xl font-black tracking-tighter">{(data.overallTotal || 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {/* Row 1: Beras Wangi */}
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700">
              <PackageOpen size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Fitrah (Beras Wangi)</p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">{data.totalWangi?.count || 0} Resit</p>
            </div>
          </div>
          <p className="text-lg font-black text-emerald-700">${(data.totalWangi?.amount || 0).toFixed(2)}</p>
        </div>

        {/* Row 2: Beras Siam */}
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-200/50 flex items-center justify-center text-emerald-700">
              <PackageOpen size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Fitrah (Beras Siam)</p>
              <p className="text-[11px] font-bold text-emerald-600 mt-0.5">{data.totalSiam?.count || 0} Resit</p>
            </div>
          </div>
          <p className="text-lg font-black text-emerald-700">${(data.totalSiam?.amount || 0).toFixed(2)}</p>
        </div>

        {/* Row 3: Harta (Wang Simpanan) */}
        <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-200/50 flex items-center justify-center text-amber-700">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Harta (Wang Simpanan)</p>
              <p className="text-[11px] font-bold text-amber-600 mt-0.5">{data.hartaSimpanan?.count || 0} Resit</p>
            </div>
          </div>
          <p className="text-lg font-black text-amber-700">${(data.hartaSimpanan?.amount || 0).toFixed(2)}</p>
        </div>

        {/* Row 4: Harta (Perniagaan) */}
        <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-200/50 flex items-center justify-center text-amber-700">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Harta (Perniagaan)</p>
              <p className="text-[11px] font-bold text-amber-600 mt-0.5">{data.hartaPerniagaan?.count || 0} Resit</p>
            </div>
          </div>
          <p className="text-lg font-black text-amber-700">${(data.hartaPerniagaan?.amount || 0).toFixed(2)}</p>
        </div>
        
        {/* Row 5: Harta (Emas/Perak) */}
        <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-200/50 flex items-center justify-center text-amber-700">
              <Coins size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Harta (Emas & Perak)</p>
              <p className="text-[11px] font-bold text-amber-600 mt-0.5">{data.hartaEmas?.count || 0} Resit</p>
            </div>
          </div>
          <p className="text-lg font-black text-amber-700">${(data.hartaEmas?.amount || 0).toFixed(2)}</p>
        </div>
      </div>
      
      <div className="mt-2 pt-6 border-t border-slate-100">
        <a href={`/api/export/receipts?year=${currentYear}`} className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98]">
          <Download size={18} />
          Muat Turun Database Penuh (CSV)
        </a>
        <p className="text-center text-[10px] text-slate-400 mt-2">Termasuk perincian timestamp & wakalah</p>
      </div>
    </div>
  );
}
