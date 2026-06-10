import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

let client: any;
let db: any;

if (process.env.MOCK_DB === 'true') {
  const mockDb = require('./mock-db');
  client = mockDb.client;
  db = mockDb.db;
} else {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }
  client = postgres(connectionString);
  db = drizzle(client, { schema });
}

export { client, db };

