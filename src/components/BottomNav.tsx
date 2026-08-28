"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScanLine, List, Users, UserCircle2, Info as InfoIcon, Settings } from 'lucide-react';

export default function BottomNav({ userRole }: { userRole?: string | null }) {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/scan' || pathname === '/review') return null;

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white/80 backdrop-blur-lg border-t border-slate-200/50 flex justify-around py-2 px-2 z-50 rounded-t-3xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] transition-all duration-300">
      <Link href="/" className={`flex flex-col items-center p-2 transition-all duration-300 ${pathname === '/' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
        <Home size={24} strokeWidth={pathname === '/' ? 2.5 : 2} className="drop-shadow-sm" />
        <span className="text-[10px] mt-1 font-bold tracking-wide">Utama</span>
      </Link>

      {userRole === 'ADMIN' ? (
        <Link href="/kadar" className={`flex flex-col items-center p-2 transition-all duration-300 ${pathname === '/kadar' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
          <Settings size={24} strokeWidth={pathname === '/kadar' ? 2.5 : 2} className="drop-shadow-sm" />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Kadar</span>
        </Link>
      ) : (
        <Link href="/info" className={`flex flex-col items-center p-2 transition-all duration-300 ${pathname === '/info' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
          <InfoIcon size={24} strokeWidth={pathname === '/info' ? 2.5 : 2} className="drop-shadow-sm" />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Info</span>
        </Link>
      )}
      
      <Link href="/scan" className="flex flex-col items-center group relative mx-1">
        <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl scale-150 -mt-6 group-hover:bg-teal-500/30 transition-all duration-500"></div>
        <div className={`p-4 rounded-full -mt-8 shadow-2xl border-4 border-white transition-all duration-300 active:scale-90 relative z-10 ${pathname === '/scan' ? 'bg-teal-700 shadow-teal-700/40' : 'bg-gradient-to-tr from-teal-600 to-emerald-400 group-hover:shadow-teal-500/50'}`}>
          <ScanLine size={28} className="text-white drop-shadow-md" />
        </div>
        <span className={`text-[10px] mt-1.5 font-bold tracking-wide transition-colors text-teal-600`}>Imbas</span>
      </Link>

      <Link href="/history" className={`flex flex-col items-center p-2 transition-all duration-300 ${pathname === '/history' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
        <List size={24} strokeWidth={pathname === '/history' ? 2.5 : 2} className="drop-shadow-sm" />
        <span className="text-[10px] mt-1 font-bold tracking-wide">Rekod</span>
      </Link>

      {userRole === 'ADMIN' ? (
        <Link href="/amils" className={`flex flex-col items-center p-2 transition-all duration-300 ${pathname === '/amils' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
          <Users size={24} strokeWidth={pathname === '/amils' ? 2.5 : 2} className="drop-shadow-sm" />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Senarai Amil</span>
        </Link>
      ) : (
        <Link href="/profile" className={`flex flex-col items-center p-2 transition-all duration-300 ${pathname === '/profile' ? 'text-teal-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
          <UserCircle2 size={24} strokeWidth={pathname === '/profile' ? 2.5 : 2} className="drop-shadow-sm" />
          <span className="text-[10px] mt-1 font-bold tracking-wide">Profil Saya</span>
        </Link>
      )}
    </div>
  );
}
