import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AmilDirectoryClient from '@/components/AmilDirectoryClient';

export const dynamic = 'force-dynamic';

export default async function AmilsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('auth_token')?.value;
  const role = cookieStore.get('auth_role')?.value;

  if (!userId) redirect('/login');
  if (role && role !== 'ADMIN') redirect('/');

  return <AmilDirectoryClient />;
}
