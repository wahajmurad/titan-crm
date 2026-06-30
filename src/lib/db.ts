import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''
  const separator = dbUrl.includes('?') ? '&' : '?'
  const url = `${dbUrl}${separator}connection_limit=5&pool_timeout=10`

  return new PrismaClient({
    datasourceUrl: url,
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db