import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.createMany({
    data: [
      { loginId: 'admin', name: 'Pentadbir Utama', password: '123', role: 'ADMIN' },
      { loginId: 'AMIL-Z01-001', name: 'Amil Zakat BM', password: '123', role: 'AMIL' },
      { loginId: 'staff1', name: 'Staf Arkib JUZWAB', password: '123', role: 'STAFF' }
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
