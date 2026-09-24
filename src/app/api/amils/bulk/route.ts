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
    const amilRows: any[] = body.amils || [];

    if (!Array.isArray(amilRows) || amilRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Tiada data amil dijumpai dalam fail' }, { status: 400 });
    }

    // Cache Zon & Masjid dalam ingatan untuk kelajuan pemprosesan maksimum
    const existingZones = await prisma.zone.findMany();
    const zoneMap = new Map<string, string>();
    existingZones.forEach(z => zoneMap.set(z.name.trim().toLowerCase(), z.id));

    const existingMosques = await prisma.mosque.findMany();
    const mosqueMap = new Map<string, string>();
    existingMosques.forEach(m => mosqueMap.set(m.name.trim().toLowerCase(), m.id));

    let defaultZoneId = existingZones[0]?.id;
    if (!defaultZoneId) {
      const newZ = await prisma.zone.create({ data: { name: 'Zon 1 (Brunei Muara)' } });
      defaultZoneId = newZ.id;
      zoneMap.set(newZ.name.toLowerCase(), newZ.id);
    }

    let defaultMosqueId = existingMosques[0]?.id;
    if (!defaultMosqueId) {
      const newM = await prisma.mosque.create({
        data: {
          name: "Masjid Jame' Asr Hassanil Bolkiah",
          zoneId: defaultZoneId
        }
      });
      defaultMosqueId = newM.id;
      mosqueMap.set(newM.name.toLowerCase(), newM.id);
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (const row of amilRows) {
      const loginId = String(row.loginId || row['ID Amil'] || row['ID'] || row['login_id'] || '').trim();
      const name = String(row.name || row['Nama'] || row['Nama Penuh'] || row['nama_amil'] || '').trim();

      if (!loginId || !name) {
        continue;
      }

      const rawPassword = String(row.password || row['Kata Laluan'] || row['Password'] || '123456').trim();
      const position = String(row.position || row['Jawatan'] || row['jawatan'] || 'Amil Lantikan').trim();
      const phoneNumber = String(row.phoneNumber || row['No Telefon'] || row['Telefon'] || row['no_tel'] || '').trim();
      const rawZone = String(row.zoneName || row['Zon'] || row['Zone'] || row['nama_zon'] || '').trim();
      const rawMosque = String(row.mosqueName || row['Masjid'] || row['Surau'] || row['Nama Masjid'] || row['nama_masjid'] || '').trim();

      // Padankan atau cipta Zon
      let targetZoneId = defaultZoneId;
      if (rawZone) {
        const zoneKey = rawZone.toLowerCase();
        if (zoneMap.has(zoneKey)) {
          targetZoneId = zoneMap.get(zoneKey)!;
        } else {
          try {
            const newZone = await prisma.zone.create({ data: { name: rawZone } });
            targetZoneId = newZone.id;
            zoneMap.set(zoneKey, newZone.id);
          } catch (_) {
            targetZoneId = defaultZoneId;
          }
        }
      }

      // Padankan atau cipta Masjid
      let targetMosqueId = defaultMosqueId;
      if (rawMosque) {
        const mosqueKey = rawMosque.toLowerCase();
        if (mosqueMap.has(mosqueKey)) {
          targetMosqueId = mosqueMap.get(mosqueKey)!;
        } else {
          try {
            const newMosque = await prisma.mosque.create({
              data: {
                name: rawMosque,
                zoneId: targetZoneId
              }
            });
            targetMosqueId = newMosque.id;
            mosqueMap.set(mosqueKey, newMosque.id);
          } catch (_) {
            targetMosqueId = defaultMosqueId;
          }
        }
      }

      // Cipta atau kemaskini rekod pengguna Amil (Upsert)
      try {
        const existingUser = await prisma.user.findUnique({ where: { loginId } });
        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name,
              position: position || existingUser.position,
              phoneNumber: phoneNumber || existingUser.phoneNumber,
              mosqueId: targetMosqueId,
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
              role: 'AMIL',
              position,
              phoneNumber: phoneNumber || null,
              mosqueId: targetMosqueId
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
      message: `Berjaya memproses ${createdCount + updatedCount} amil (${createdCount} baru, ${updatedCount} dikemaskini).`
    });
  } catch (error: any) {
    console.error("Ralat bulk assign amils:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Gagal memproses bulk assign amil'
    }, { status: 500 });
  }
}
