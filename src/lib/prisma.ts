import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

declare global {
  var prismaGlobal: PrismaClient | undefined
}

const getPrisma = () => {
  const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

  // Fallback for build time to prevent initialization error
  if (!connectionString) {
    // We return a client that is technically "invalid" for queries but 
    // satisfies the constructor requirement if the build doesn't actually run queries.
    // However, it's better to pass a dummy URL if possible, but schema won't allow it easily.
    // Let's try to pass a dummy adapter if we can.
    return new PrismaClient({
      datasources: {
        db: {
          url: "postgresql://dummy@localhost:5432/dummy"
        }
      }
    } as any)
  }

  if (typeof window === 'undefined') {
    neonConfig.webSocketConstructor = ws
  }

  // Prisma 7 PrismaNeon constructor expects PoolConfig (the config object)
  const adapter = new PrismaNeon({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma = globalThis.prismaGlobal ?? getPrisma()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
