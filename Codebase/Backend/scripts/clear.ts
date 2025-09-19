import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$transaction([
      prisma.transactionLog.deleteMany(),
      prisma.investment.deleteMany(),
    ])
    console.log('Cleared investments and transaction logs.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


