import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let client: PrismaClient | null = null;
let currentPool: Pool | null = null;

function createClient(): PrismaClient {
  let connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
  connectionString = connectionString.trim().replace(/^["']|["']$/g, '');
  if (!connectionString) {
    throw new Error(`DATABASE_URL is missing in environment!`);
  }

  // Konfigurasi Pool mesra Cloudflare Workers & Supabase Supavisor
  currentPool = new Pool({
    connectionString,
    max: 1, // Had 1 sambungan setiap isolate Cloudflare Worker
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 5000, // Tutup sambungan terbiar lebih awal untuk elak soket terputus (stale socket)
  });

  currentPool.on('error', (err) => {
    console.warn('Prisma pg pool notice:', err?.message);
    client = null;
    currentPool = null;
  });

  const adapter = new PrismaPg(currentPool);
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!client) {
    client = createClient();
  }
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getClient();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    // Balut model Prisma (cth: prisma.receipt, prisma.user) dengan auto-retry sekiranya sambungan terputus
    if (value && typeof value === 'object') {
      return new Proxy(value, {
        get(modelTarget, modelProp) {
          const modelVal = modelTarget[modelProp];
          if (typeof modelVal === 'function') {
            return async (...args: any[]) => {
              try {
                return await modelVal.apply(modelTarget, args);
              } catch (err: any) {
                const errMsg = err?.message || '';
                // Sekiranya sambungan TCP ditamatkan oleh Supabase (Connection terminated unexpectedly), sambung semula & cuba lagi
                if (
                  errMsg.includes('Connection terminated') ||
                  errMsg.includes('Connection closed') ||
                  errMsg.includes('broken pipe') ||
                  errMsg.includes('ECONNRESET')
                ) {
                  console.warn('Sambungan terputus dikesan. Menyambung semula secara automatik...');
                  client = null;
                  if (currentPool) {
                    try { await currentPool.end(); } catch (_) {}
                    currentPool = null;
                  }
                  const freshInstance = getClient();
                  const freshModel = (freshInstance as any)[prop];
                  return await freshModel[modelProp](...args);
                }
                throw err;
              }
            };
          }
          return modelVal;
        }
      });
    }
    return value;
  },
});

export default prisma;
