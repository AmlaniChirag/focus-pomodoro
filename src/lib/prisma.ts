import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  })

// Cache singleton across hot-reloads in dev AND across concurrent requests in prod (Fluid Compute)
globalForPrisma.prisma = prisma
