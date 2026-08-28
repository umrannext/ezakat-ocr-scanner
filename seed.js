const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Simple hash function for MVP purposes
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function main() {
  console.log("Starting seeding...");

  // 1. Create Zones
  const zone1 = await prisma.zone.create({ data: { name: 'Zon 1 (Brunei-Muara)' } });
  const zone2 = await prisma.zone.create({ data: { name: 'Zon 2 (Belait)' } });

  // 2. Create Mosques
  const mosque1 = await prisma.mosque.create({
    data: { name: "Masjid Jame' Asr Hassanil Bolkiah", zoneId: zone1.id, phoneNumber: '02-222333' }
  });
  const mosque2 = await prisma.mosque.create({
    data: { name: "Masjid Mohammad Jamalul Alam", zoneId: zone2.id, phoneNumber: '03-333444' }
  });

  // 3. Create Rice Types (Multiple Years)
  const berasSiam1446 = await prisma.riceType.create({
    data: { code: 'B_SIAM_1446H', name: 'Beras Siam', price: 1.90, activeYear: '1446H' }
  });
  const berasWangi1446 = await prisma.riceType.create({
    data: { code: 'B_WANGI_1446H', name: 'Beras Wangi', price: 2.80, activeYear: '1446H' }
  });

  const berasSiam1447 = await prisma.riceType.create({
    data: { code: 'B_SIAM_1447H', name: 'Beras Siam', price: 1.93, activeYear: '1447H' }
  });
  const berasWangi1447 = await prisma.riceType.create({
    data: { code: 'B_WANGI_1447H', name: 'Beras Wangi', price: 2.84, activeYear: '1447H' }
  });

  // 4. Create Users (Admin & Amil)
  const admin = await prisma.user.create({
    data: {
      loginId: 'admin',
      name: 'Pentadbir Utama',
      password: hashPassword('admin123'),
      role: 'ADMIN'
    }
  });

  const amil1 = await prisma.user.create({
    data: {
      loginId: 'AMIL-Z01-001',
      name: 'Ustaz Ahmad Tarmizi',
      password: hashPassword('amil123'),
      role: 'AMIL',
      position: 'Imam',
      phoneNumber: '0812-444555',
      mosqueId: mosque1.id
    }
  });

  const amil2 = await prisma.user.create({
    data: {
      loginId: 'AMIL-Z02-001',
      name: 'Haji Rosli Bin Hassan',
      password: hashPassword('amil123'),
      role: 'AMIL',
      position: 'Bilal',
      phoneNumber: '0813-777888',
      mosqueId: mosque2.id
    }
  });

  // 5. Create Dummy Receipts
  await prisma.receipt.create({
    data: {
      receiptNumber: 'RZT-8472',
      payerName: 'AWANG AHMAD BIN ALI',
      payerIcNumber: '01-123456',
      riceTypeId: berasSiam1447.id,
      dependents: 4,
      totalAmount: (1 + 4) * 1.93,
      paymentDate: new Date('2026-03-15T00:00:00Z'),
      isVerified: true,
      amilId: amil1.id
    }
  });

  await prisma.receipt.create({
    data: {
      receiptNumber: 'RZT-9931',
      payerName: 'DAYANG SITI NURHALIZA',
      payerIcNumber: '00-654321',
      riceTypeId: berasWangi1447.id,
      dependents: 2,
      totalAmount: (1 + 2) * 2.84,
      paymentDate: new Date('2026-03-16T00:00:00Z'),
      isVerified: true,
      amilId: amil1.id
    }
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
