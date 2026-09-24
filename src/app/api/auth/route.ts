import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

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

    let user: any = null;
    try {
      // 1. Cari pengguna secara case-insensitive
      user = await prisma.user.findFirst({
        where: {
          loginId: {
            equals: cleanLoginId,
            mode: 'insensitive'
          }
        }
      });
    } catch (dbErr: any) {
      console.warn('DB lookup notice during auth:', dbErr?.message);
      // Fallback kecemasan untuk akaun admin jika DB Supabase tergendala sementara
      if (cleanLoginId.toLowerCase() === 'admin' && cleanPassword === 'admin123') {
        user = {
          id: '63cbcbaa-f75b-4c3b-ad4b-559394d8c3e5',
          loginId: 'admin',
          name: 'Pentadbir Utama',
          password: hashPassword('admin123'),
          role: 'ADMIN'
        };
      } else {
        throw dbErr;
      }
    }

    if (!user || user.password !== hashPassword(cleanPassword)) {
      return NextResponse.json({ error: 'ID Pengguna atau Kata Laluan tidak sah' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, role: user.role, name: user.name } 
    });
    
    const cookieOptions = {
      httpOnly: true,
      path: '/',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7 // 7 hari
    };

    // Tetapkan kuki terus pada response
    response.cookies.set('auth_token', user.id, cookieOptions);
    response.cookies.set('auth_role', user.role, cookieOptions);
    response.cookies.set('auth_name', encodeURIComponent(user.name), cookieOptions);

    // Tetapkan juga pada cookieStore untuk keserasian dwiarah
    try {
      const cookieStore = await cookies();
      cookieStore.set('auth_token', user.id, cookieOptions);
      cookieStore.set('auth_role', user.role, cookieOptions);
      cookieStore.set('auth_name', encodeURIComponent(user.name), cookieOptions);
    } catch (_) {}

    return response;
  } catch (error: any) {
    console.error('Auth server error:', error);
    return NextResponse.json({ 
      error: 'Ralat sambungan pangkalan data', 
      details: error?.message || 'Sila cuba sebentar lagi'
    }, { status: 500 });
  }
}
