import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './schema';

export const client = new PGlite();
// Compatibility layer for tests calling client.end()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(client as any).end = async () => {
  await client.close();
};

export const db = drizzle(client, { schema });

export async function setupMockDb() {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
}
