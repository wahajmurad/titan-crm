import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL always points to writable /tmp location
// The project's overlay filesystem is read-only for SQLite journal/WAL ops
const DB_URL = process.env.DATABASE_URL || 'file:/tmp/titan.db'

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: DB_URL,
      },
    },
    log: ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// In development, reuse the client across HMR cycles
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db