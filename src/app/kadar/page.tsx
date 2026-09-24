import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminSettings from '@/components/AdminSettings';

export const dynamic = 'force-dynamic';

export default async function KadarPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  const role = cookieStore.get('auth_role')?.value;

  if (!userId) redirect('/login');
  if (role && role !== 'ADMIN') redirect('/');

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[100px]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-sm sticky top-0 z-10 border-b border-slate-200/50">
        <h1 className="font-bold text-slate-800 ml-2 tracking-tight text-lg">Kadar & Tetapan</h1>
      </div>

      <div className="p-5">
        <div className="-mt-8">
          <AdminSettings />
        </div>
      </div>
    </div>
  );
}
