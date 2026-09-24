import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export async function POST(req: Request) {
  try {
    const { loginId, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { loginId } });

    if (!user || user.password !== hashPassword(password)) {
      return NextResponse.json({ error: 'Maklumat log masuk tidak sah' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, role: user.role, name: user.name } 
    });
    
    // Set cookies for fast, zero-DB access in layout and client
    const cookieStore = await cookies();
    cookieStore.set('auth_token', user.id, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    cookieStore.set('auth_role', user.role, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    cookieStore.set('auth_name', encodeURIComponent(user.name), {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: any) {
    console.error('Auth error:', error);
    return NextResponse.json({ 
      error: 'Ralat pelayan', 
      details: error?.message || 'Sila cuba sebentar lagi'
    }, { status: 500 });
  }
}
