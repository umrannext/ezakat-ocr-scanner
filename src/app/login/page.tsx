"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanLoginId = loginId.trim();
    const cleanPassword = password.trim();

    if (!cleanLoginId || !cleanPassword) {
      setError('Sila masukkan ID Pengguna dan Kata Laluan');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: cleanLoginId, password: cleanPassword })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.warn('Non-JSON response:', jsonErr);
      }

      if (res.ok && data?.success) {
        // Navigasi penuh terus dengan kuki baru yang sah
        window.location.href = '/';
        return;
      } else {
        setError(data?.error || data?.details || (res.status === 401 ? 'ID Pengguna atau Kata Laluan tidak sah' : `Ralat pelayan (${res.status})`));
        setLoading(false);
      }
    } catch(err: any) {
      console.error('Fetch error:', err);
      setError(err?.message ? `Ralat sambungan: ${err.message}` : 'Ralat sambungan rangkaian. Sila semak sambungan internet anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 w-full max-w-md mx-auto relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500 opacity-20 rounded-full blur-3xl transform translate-x-20 -translate-y-20"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 opacity-10 rounded-full blur-3xl transform -translate-x-20 translate-y-20"></div>
      
      <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl relative z-10">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white tracking-tight">E-Zakat <span className="text-teal-400">OCR</span></h1>
          <p className="text-sm text-slate-300 font-medium mt-2">Log Masuk Amil / Admin</p>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm font-bold text-center mb-6">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">ID Pengguna</label>
            <div className="relative mt-1.5">
              <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="Contoh: admin atau AMIL-Z01-001"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-slate-500 font-semibold focus:ring-2 focus:ring-teal-400 outline-none transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-widest ml-1">Kata Laluan</label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan kata laluan"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white font-semibold focus:ring-2 focus:ring-teal-400 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/30 hover:opacity-90 active:scale-95 transition-all mt-4"
          >
            {loading ? 'Mengizinkan...' : 'Log Masuk'}
          </button>
        </form>

        <div className="mt-5 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <span className="text-teal-300 font-semibold">Admin:</span> <code className="text-white font-mono">admin</code> | <span className="text-teal-300 font-semibold">Amil:</span> <code className="text-white font-mono">AMIL-Z01-001</code>
          </p>
        </div>
        
        <div className="mt-5 text-center border-t border-white/10 pt-5">
          <button onClick={() => router.push('/info')} className="text-teal-400 hover:text-teal-300 text-sm font-bold tracking-wide transition-colors">
            Panduan & Info Sistem →
          </button>
        </div>
      </div>
    </div>
  );
}
