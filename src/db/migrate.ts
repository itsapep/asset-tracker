import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function runMigrations() {
  // Only run migrations automatically on Vercel deployment or if explicitly forced
  if (process.env.VERCEL !== '1' && process.env.RUN_MIGRATIONS !== 'true') {
    console.log('Skipping database migrations for local build. (Set RUN_MIGRATIONS=true to run)');
    process.exit(0);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  // Use max 1 connection for migrations
  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  console.log('Running database migrations...');
  
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'src/db/migrations'),
  });

  console.log('Migrations completed successfully!');
  await migrationClient.end();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
