import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: ['error'],
    // Vercel serverless: use connection pooling when DATABASE_URL has pgBouncer
    ...(process.env.DATABASE_URL?.includes('pooler') ? {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    } : {}),
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// In development, reuse the client across HMR cycles
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db