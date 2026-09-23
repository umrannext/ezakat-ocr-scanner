import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let client: PrismaClient | null = null;

function getConnectionString(): string {
  try {
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx?.env?.HYPERDRIVE?.connectionString) {
      return ctx.env.HYPERDRIVE.connectionString;
    }
  } catch (e) {
    // Outside of Cloudflare or during static build
  }
  return process.env.DATABASE_URL || process.env.DIRECT_URL || '';
}

function getClient(): PrismaClient {
  if (!client) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error(`Database connection string is missing in environment!`);
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
