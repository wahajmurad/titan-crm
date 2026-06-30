import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || ''

  // Supabase free tier: max 15 connections via PgBouncer (port 6543)
  // Vercel serverless: multiple cold instances each create their own pool
  // connection_limit=3 ensures even 5 concurrent functions stay under 15
  let url = dbUrl
  const hasParams = dbUrl.includes('?')
  const sep = hasParams ? '&' : '?'
  url = `${url}${sep}connection_limit=3&pool_timeout=15`

  // Ensure pgbouncer mode is enabled
  if (!url.includes('pgbouncer')) {
    url += '&pgbouncer=true'
  }

  return new PrismaClient({
    datasourceUrl: url,
    log: [],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

// In development, reuse the client across HMR cycles
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db