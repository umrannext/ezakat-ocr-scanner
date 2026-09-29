import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const hashPassword = (password: string) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function main() {
  // Padam data lama jika ada
  await prisma.receipt.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.riceType.deleteMany({})

  await prisma.user.createMany({
    data: [
      { loginId: 'admin', name: 'Pentadbir Utama', password: hashPassword('123'), role: 'ADMIN' },
      { loginId: 'AMIL-Z01-001', name: 'Amil Zakat BM', password: hashPassword('123'), role: 'AMIL' },
      { loginId: 'staf', name: 'Staf Arkib JUZWAB', password: hashPassword('123'), role: 'STAFF' }
    ]
  })
  
  await prisma.riceType.createMany({
    data: [
      { code: 'DW', name: 'Beras Wangi', price: 2.84, activeYear: '1447H' },
      { code: 'CS', name: 'Beras Siam', price: 1.93, activeYear: '1447H' }
    ]
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
