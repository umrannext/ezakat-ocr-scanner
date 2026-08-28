"use client";
import React, { useState, useEffect } from 'react';
import { UserCircle2, MapPin, Phone, Briefcase, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    position: '',
    phoneNumber: ''
  });

  useEffect(() => {
    // Fetch current profile info via an API or just use a Server Component. 
    // Wait, to keep it simple and robust, let's fetch it via a new API GET /api/profile
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setFormData({
            position: data.position || '',
            phoneNumber: data.phoneNumber || ''
          });
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setMessage({ text: 'Profil berjaya dikemaskini!', type: 'success' });
        router.refresh();
      } else {
        setMessage({ text: 'Gagal mengemaskini profil.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Ralat sistem.', type: 'error' });
    }
    setIsSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-teal-500" /></div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center">Sila log masuk.</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[100px]">
      <div className="bg-white/80 backdrop-blur-md p-4 flex items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <h1 className="font-bold text-slate-800 ml-2 tracking-tight text-lg">Profil Saya</h1>
      </div>

      <div className="p-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center mb-6 relative overflow-hidden">
          <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-20"></div>
          <div className="bg-white p-2 rounded-full shadow-md z-10 mt-4">
            <div className="bg-teal-50 p-4 rounded-full text-teal-600">
              <UserCircle2 size={48} strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-800 mt-4">{user.name}</h2>
          <p className="text-sm font-bold text-slate-400 mt-1 tracking-wide">{user.loginId}</p>
          
          <div className="w-full bg-slate-50 rounded-2xl p-4 mt-6 text-left flex items-start gap-3 border border-slate-100">
            <MapPin className="text-teal-500 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pusat Kutipan</p>
              <p className="text-sm font-bold text-slate-700 mt-0.5">{user.mosque?.name}</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">{user.mosque?.zone?.name}</p>
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-bold text-center ${message.type === 'success' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-5">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3">Kemaskini Maklumat Tambahan</h3>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Jawatan</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={formData.position}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                  placeholder="Contoh: Imam, Bilal, AJK"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">No. Telefon Bimbit</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="tel" 
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  placeholder="Contoh: 012-3456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-teal-500/30 flex justify-center items-center gap-2 active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSaving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      </div>
    </div>
  );
}
