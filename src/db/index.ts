import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (process.env.MOCK_DB === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockDb = require('./mock-db');
  client = mockDb.client;
  db = mockDb.db;
} else {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL is not set in environment variables');
  }
  client = postgres(connectionString);
  db = drizzle(client, { schema });
}

export { client, db };

