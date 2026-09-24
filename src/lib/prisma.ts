import { PrismaClient } from '@prisma/client/wasm';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let client: PrismaClient | null = null;
let currentPool: Pool | null = null;

function resolveConnectionString(): string {
  // 1. Dapatkan connectionString daripada Hyperdrive jika berada dalam runtime Cloudflare
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx?.env?.HYPERDRIVE?.connectionString) {
      return ctx.env.HYPERDRIVE.connectionString;
    }
  } catch (_) {}

  // 2. Sandaran env tempatan / langsung
  const conn = process.env.HYPERDRIVE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL || '';
  return conn.trim().replace(/^["']|["']$/g, '');
}

function createClient(): PrismaClient {
  const connectionString = resolveConnectionString();
  if (!connectionString) {
    throw new Error(`DATABASE_URL or HYPERDRIVE is missing in environment!`);
  }

  // Jika guna Hyperdrive (Cloudflare local proxy), SSL diuruskan oleh Hyperdrive
  const isHyperdrive = connectionString.includes('127.0.0.1') || connectionString.includes('localhost') || connectionString.includes('hyperdrive');

  currentPool = new Pool({
    connectionString,
    ssl: isHyperdrive ? false : { rejectUnauthorized: false },
    max: 1, // Had 1 sambungan setiap isolate Cloudflare Worker
    connectionTimeoutMillis: 8000,
    idleTimeoutMillis: 4000,
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

function isConnectionError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (err.code || '').toString();
  return (
    msg.includes('connection') ||
    msg.includes('socket') ||
    msg.includes('terminated') ||
    msg.includes('closed') ||
    msg.includes('broken pipe') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('timeout') ||
    msg.includes('pool') ||
    msg.includes('too many clients') ||
    msg.includes('client has encountered a connection error') ||
    msg.includes('certificate') ||
    msg.includes('ssl') ||
    msg.includes('reach') ||
    msg.includes('handshake') ||
    code.startsWith('08') ||
    code.startsWith('57P')
  );
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getClient();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    // Balut model Prisma (cth: prisma.receipt, prisma.user) dengan auto-retry & backoff
    if (value && typeof value === 'object') {
      return new Proxy(value, {
        get(modelTarget, modelProp) {
          const modelVal = modelTarget[modelProp];
          if (typeof modelVal === 'function') {
            return async (...args: any[]) => {
              try {
                return await modelVal.apply(modelTarget, args);
              } catch (err: any) {
                if (isConnectionError(err)) {
                  console.warn('DB connection glitch detected. Auto-reconnecting...', err?.message);
                  client = null;
                  if (currentPool) {
                    try { await currentPool.end(); } catch (_) {}
                    currentPool = null;
                  }
                  // Beri ruang 200ms untuk slot pool Supabase dilepaskan
                  await new Promise(r => setTimeout(r, 200));
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
