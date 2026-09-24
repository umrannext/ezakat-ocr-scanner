import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import HistoryClient from '@/components/HistoryClient';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  const userRole = cookieStore.get('auth_role')?.value || 'AMIL';

  if (!userId) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-[100px]">
      <HistoryClient userRole={userRole} />
    </div>
  );
}
