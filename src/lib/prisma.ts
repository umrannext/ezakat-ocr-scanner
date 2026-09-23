import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let client: PrismaClient | null = null;

function getClient(): PrismaClient {
  if (!client) {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!connectionString) {
      throw new Error(`DATABASE_URL is missing in environment! Available keys: ${Object.keys(process.env).join(', ')}`);
    }
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    client = new PrismaClient({ adapter });
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
    return value;
  },
});

export default prisma;
