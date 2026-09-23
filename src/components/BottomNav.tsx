"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScanLine, List, Users, UserCircle2, Info as InfoIcon, Settings } from 'lucide-react';

export default function BottomNav({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/scan' || pathname === '/review') return null;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/90 backdrop-blur-lg border-t border-slate-200/60 grid grid-cols-5 items-end px-2 pt-2 pb-2.5 z-50 rounded-t-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] transition-all duration-300">
      
      {/* 1. UTAMA */}
      <Link 
        href="/" 
        className={`flex flex-col items-center justify-end h-13 pb-0.5 transition-all duration-300 ${
          pathname === '/' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Home size={22} strokeWidth={pathname === '/' ? 2.5 : 2} className="drop-shadow-sm mb-1" />
        <span className="text-[10px] font-bold tracking-tight">Utama</span>
      </Link>

      {/* 2. KADAR / INFO */}
      {userRole === 'ADMIN' ? (
        <Link 
          href="/kadar" 
          className={`flex flex-col items-center justify-end h-13 pb-0.5 transition-all duration-300 ${
            pathname === '/kadar' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings size={22} strokeWidth={pathname === '/kadar' ? 2.5 : 2} className="drop-shadow-sm mb-1" />
          <span className="text-[10px] font-bold tracking-tight">Kadar</span>
        </Link>
      ) : (
        <Link 
          href="/info" 
          className={`flex flex-col items-center justify-end h-13 pb-0.5 transition-all duration-300 ${
            pathname === '/info' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <InfoIcon size={22} strokeWidth={pathname === '/info' ? 2.5 : 2} className="drop-shadow-sm mb-1" />
          <span className="text-[10px] font-bold tracking-tight">Info</span>
        </Link>
      )}

      {/* 3. IMBAS (CENTER FLOATING BUTTON - SIMETRI & SEIMBANG) */}
      <Link 
        href="/scan" 
        className="flex flex-col items-center justify-end h-13 pb-0.5 group relative"
      >
        {/* Butang Bulat Terapung Tepat di Tengah */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          {/* Efek Glow Lembut */}
          <div className="absolute inset-0 bg-teal-500/25 rounded-full blur-xl scale-125 group-hover:bg-teal-500/40 transition-all duration-300"></div>

          {/* Bulatan Ikon Berpusat Sempurna */}
          <div 
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 border-white transition-all duration-300 active:scale-90 relative z-10 pointer-events-auto ${
              pathname === '/scan' 
                ? 'bg-teal-700 shadow-teal-700/40 scale-105' 
                : 'bg-gradient-to-tr from-teal-600 to-emerald-400 group-hover:shadow-teal-500/50 group-hover:scale-105'
            }`}
          >
            <ScanLine size={26} strokeWidth={2.4} className="text-white drop-shadow-sm" />
          </div>
        </div>

        {/* Label Imbas - Selari sebaris dengan 4 label lain */}
        <span className={`text-[10px] font-bold tracking-tight transition-colors ${
          pathname === '/scan' ? 'text-teal-700' : 'text-teal-600 group-hover:text-teal-700'
        }`}>
          Imbas
        </span>
      </Link>

      {/* 4. REKOD */}
      <Link 
        href="/history" 
        className={`flex flex-col items-center justify-end h-13 pb-0.5 transition-all duration-300 ${
          pathname === '/history' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <List size={22} strokeWidth={pathname === '/history' ? 2.5 : 2} className="drop-shadow-sm mb-1" />
        <span className="text-[10px] font-bold tracking-tight">Rekod</span>
      </Link>

      {/* 5. SENARAI AMIL / PROFIL SAYA */}
      {userRole === 'ADMIN' ? (
        <Link 
          href="/amils" 
          className={`flex flex-col items-center justify-end h-13 pb-0.5 transition-all duration-300 ${
            pathname === '/amils' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users size={22} strokeWidth={pathname === '/amils' ? 2.5 : 2} className="drop-shadow-sm mb-1" />
          <span className="text-[10px] font-bold tracking-tight truncate max-w-full px-0.5">Senarai Amil</span>
        </Link>
      ) : (
        <Link 
          href="/profile" 
          className={`flex flex-col items-center justify-end h-13 pb-0.5 transition-all duration-300 ${
            pathname === '/profile' ? 'text-teal-600 scale-105' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCircle2 size={22} strokeWidth={pathname === '/profile' ? 2.5 : 2} className="drop-shadow-sm mb-1" />
          <span className="text-[10px] font-bold tracking-tight truncate max-w-full px-0.5">Profil Saya</span>
        </Link>
      )}

    </div>
  );
}
