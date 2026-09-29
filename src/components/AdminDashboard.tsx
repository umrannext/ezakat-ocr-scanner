'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Wallet, Download, Calendar, MapPin, HandHeart } from 'lucide-react';

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Zakat Fitrah</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-black text-slate-800">${data.totalFitrah.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-lg border border-teal-200/50">{data.countFitrah || 0} Resit</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Zakat Harta</p>
          <div className="flex justify-between items-end">
            <p className="text-2xl font-black text-slate-800">${data.totalHarta.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-lg border border-amber-200/50">{data.countHarta || 0} Resit</p>
          </div>
        </div>

      </div>

      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-slate-400" />
          Zakat Fitrah Mengikut Zon ({currentYear})
        </h3>
        <div className="space-y-3">
          {data.zoneStats.map((z: any) => (
            <div key={z.name} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
              <span className="font-bold text-slate-600 text-sm">{z.name}</span>
              <span className="font-black text-slate-800">${z.amount.toFixed(2)}</span>
            </div>
          ))}
          {data.zoneStats.length === 0 && (
            <div className="text-center p-4 text-slate-400 text-sm font-medium">Tiada rekod untuk tahun ini.</div>
          )}
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-100">
          <a href={`/api/export/receipts?year=${currentYear}`} className="w-full flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98]">
          <Download size={18} />
          Muat Turun Database Penuh (CSV)
        </a>
        <p className="text-center text-[10px] text-slate-400 mt-2">Termasuk perincian timestamp & wakalah</p>
      </div>
    </div>
  );
}
