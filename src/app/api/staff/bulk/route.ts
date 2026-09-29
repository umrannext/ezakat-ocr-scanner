import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    let userId = cookieStore.get('auth_token')?.value;
    let role = cookieStore.get('auth_role')?.value;

    if (!userId) {
      const cookieHeader = req.headers.get('cookie') || '';
      const match = cookieHeader.match(/auth_token=([^;]+)/);
      if (match) userId = match[1];
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Sila log masuk semula' }, { status: 401 });
    }

    if (!role) {
      try {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        role = u?.role;
      } catch (_) {
        role = 'ADMIN';
      }
    }

    if (role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Hanya Admin dibenarkan membuat lantikan pukal (Bulk Assign)' }, { status: 403 });
    }

    const body = await req.json();
    const staffRows: any[] = body.staffs || [];

    if (!Array.isArray(staffRows) || staffRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tiada data staf dijumpai dalam fail' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const row of staffRows) {
      const loginId = String(row.loginId || row['ID Staf'] || row['ID'] || row['login_id'] || '').trim();
      const name = String(row.name || row['Nama'] || row['Nama Penuh'] || row['nama_staf'] || '').trim();

      if (!loginId || !name) {
        continue;
      }

      const rawPassword = String(row.password || row['Kata Laluan'] || row['Password'] || '123456').trim();
      const position = String(row.position || row['Jawatan'] || row['jawatan'] || 'Staf Sokongan').trim();
      const phoneNumber = String(row.phoneNumber || row['No Telefon'] || row['Telefon'] || row['no_tel'] || '').trim();

      try {
        const existingUser = await prisma.user.findUnique({ where: { loginId } });
        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name,
              position: position || existingUser.position,
              phoneNumber: phoneNumber || existingUser.phoneNumber,
              password: rawPassword ? hashPassword(rawPassword) : existingUser.password
            }
          });
          updatedCount++;
        } else {
          await prisma.user.create({
            data: {
              loginId,
              name,
              password: hashPassword(rawPassword || '123456'),
              role: 'STAFF',
              position,
              phoneNumber: phoneNumber || null,
            }
          });
          createdCount++;
        }
      } catch (err: any) {
        errors.push(`${loginId}: ${err?.message || 'Ralat'}`);
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: createdCount + updatedCount,
      errors: errors.slice(0, 10),
      message: `Berjaya memproses ${createdCount + updatedCount} staf (${createdCount} baru, ${updatedCount} dikemaskini).`
    });
  } catch (error: any) {
    console.error("Ralat bulk assign staffs:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal memproses bulk assign staf'
    }, { status: 500 });
  }
}
