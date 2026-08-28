"use client";
import React, { useState } from 'react';
import { Users, MapPin, Phone, UserCircle2, Search, Filter, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';

type AmilData = {
  id: string;
  name: string;
  loginId: string;
  position: string | null;
  phoneNumber: string | null;
  mosque: {
    name: string;
    phoneNumber: string | null;
    zone: { name: string } | null;
  } | null;
  receipts: { totalAmount: number }[];
};

export default function AmilDirectoryClient({ initialAmils }: { initialAmils: AmilData[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('Semua Zon');
  const [showFullInfo, setShowFullInfo] = useState(true);

  // Extract unique zones
  const zones = ['Semua Zon', ...Array.from(new Set(initialAmils.map(a => a.mosque?.zone?.name).filter(Boolean)))];

  // Filter amils
  const filteredAmils = initialAmils.filter(amil => {
    const matchesSearch = amil.name.toLowerCase().includes(searchQuery.toLowerCase()) || amil.loginId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'Semua Zon' || amil.mosque?.zone?.name === selectedZone;
    return matchesSearch && matchesZone;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[100px]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 border-b border-slate-200/50">
        <h1 className="font-bold text-slate-800 ml-2 tracking-tight text-lg">Direktori Amil</h1>
        <div className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold mr-2">
          {filteredAmils.length} Amil
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Controls: Search & Filter */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3 sticky top-[72px] z-10">
          
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <select 
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm font-semibold text-slate-600 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {zones.map((z) => (
                  <option key={z as string} value={z as string}>{z}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => setShowFullInfo(!showFullInfo)}
              className={`p-2 rounded-xl flex items-center justify-center border transition-colors ${showFullInfo ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}
              title={showFullInfo ? "Sembunyikan Maklumat" : "Papar Maklumat Penuh"}
            >
              {showFullInfo ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* Amil List */}
        <div className="space-y-3">
          {filteredAmils.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium">Tiada Amil ditemui.</div>
          ) : (
            filteredAmils.map(amil => (
              <div key={amil.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300">
                <div className="p-4 border-b border-slate-50 bg-gradient-to-r from-teal-500/5 to-emerald-500/5 flex items-start gap-4">
                  <div className="bg-teal-100 p-3 rounded-full text-teal-600 mt-1 shrink-0">
                    <UserCircle2 size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-[15px] truncate">{amil.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">{amil.position || 'Amil Lantikan'}</span>
                      <span className="text-slate-400 text-xs font-medium">ID: {amil.loginId}</span>
                    </div>
                  </div>
                </div>
                
                {showFullInfo && (
                  <div className="p-4 space-y-3 bg-white animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-slate-400 mt-0.5 shrink-0" size={16} />
                      <div>
                        <p className="text-sm font-bold text-slate-700">{amil.mosque?.name || 'Tiada Masjid'}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{amil.mosque?.zone?.name || 'Tiada Zon'}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-2">
                        <Phone className="text-teal-500 shrink-0" size={14} />
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tel Amil</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{amil.phoneNumber || '-'}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-2">
                        <Phone className="text-slate-400 shrink-0" size={14} />
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tel Masjid</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">{amil.mosque?.phoneNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kutipan Amil Ini</p>
                      <div className="text-right">
                        <p className="text-sm font-black text-teal-600">${amil.receipts.reduce((sum, r) => sum + r.totalAmount, 0).toFixed(2)}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">{amil.receipts.length} Resit</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
