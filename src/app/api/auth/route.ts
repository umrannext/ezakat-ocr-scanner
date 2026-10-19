import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getUserByLoginId } from '@/lib/sharepoint-db';

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const cleanLoginId = String(body.loginId || '').trim();
    const cleanPassword = String(body.password || '').trim();

    if (!cleanLoginId || !cleanPassword) {
      return NextResponse.json({ error: 'Sila masukkan ID Pengguna dan Kata Laluan' }, { status: 400 });
    }

    const user = await getUserByLoginId(cleanLoginId);

    if (!user || user.passwordHash !== hashPassword(cleanPassword)) {
      return NextResponse.json({ error: 'ID Pengguna atau Kata Laluan tidak sah' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        role: user.role, 
        name: user.name,
        loginId: user.loginId 
      } 
    });
    
    const cookieOptions = {
      httpOnly: true,
      path: '/',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    };

    response.cookies.set('auth_token', user.id, cookieOptions);
    response.cookies.set('auth_role', user.role, cookieOptions);
    response.cookies.set('auth_name', encodeURIComponent(user.name), cookieOptions);
    response.cookies.set('auth_login_id', user.loginId, cookieOptions);

    try {
      const cookieStore = await cookies();
      cookieStore.set('auth_token', user.id, cookieOptions);
      cookieStore.set('auth_role', user.role, cookieOptions);
      cookieStore.set('auth_name', encodeURIComponent(user.name), cookieOptions);
      cookieStore.set('auth_login_id', user.loginId, cookieOptions);
    } catch (_) {}

    return response;
  } catch (error: any) {
    console.error('Auth server error:', error);
    return NextResponse.json({ 
      error: 'Ralat pelayan semasa log masuk. Sila cuba sebentar lagi.',
      details: error?.message
    }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  response.cookies.delete('auth_role');
  response.cookies.delete('auth_name');
  response.cookies.delete('auth_login_id');
  return response;
}
