# Isolate Database for Tests using PGLite

This plan outlines how to stop the test suite from wiping the development database by replacing the actual PostgreSQL connection with a lightweight, in-memory WebAssembly PostgreSQL emulator called `PGlite`. This ensures the database is completely mocked out during tests while preserving the exact same behavior and test data logic.

## User Review Required

> [!IMPORTANT]
> - This plan requires installing `@electric-sql/pglite` as a dev dependency.
> - We will modify `src/db/index.ts` to conditionally load an in-memory database when `MOCK_DB=true` is set.
> - The test command in `package.json` will be updated to automatically inject this environment variable.

## Proposed Changes

### 1. `package.json` Updates
We will install the required PGLite dependency and update the test script.

#### [MODIFY] package.json
- **Add Dev Dependency:** Add `"@electric-sql/pglite"` to `devDependencies`.
- **Modify Script:** Update the `"test"` script to prefix with `MOCK_DB=true`:
  ```json
  "test": "MOCK_DB=true npx tsx --test --test-concurrency=1 src/app/api/api.test.ts src/app/api/auth.test.ts src/app/api/v1/status-requests/route.test.ts tests/components/EditAssetModal.test.tsx tests/components/UserDropdown.test.tsx"
  ```

---

### 2. Database Module Updates
We will extract the mock database setup and conditionally load it in the main DB index.

#### [NEW] src/db/mock-db.ts
Create a new file that initializes the `PGlite` in-memory database and provides a setup function to run your existing Drizzle migrations on it.
```typescript
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from './schema';

export const client = new PGlite();
export const db = drizzle(client, { schema });

export async function setupMockDb() {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
}
```

#### [MODIFY] src/db/index.ts
Update to optionally use the mock database when the environment variable is present. Using `require` here ensures `PGlite` is not bundled into production Next.js builds.
```typescript
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
```

---

### 3. Test Helper Update
We need to ensure the mock database is fully migrated before we try to insert test data.

#### [MODIFY] src/db/test-helper.ts
Update the `resetDatabase` function to run migrations once before clearing tables.
```typescript
import { db } from './index';
// Import all existing schema definitions
// ... (keep existing schema imports)

let isMigrated = false;

export async function resetDatabase() {
  if (process.env.MOCK_DB === 'true' && !isMigrated) {
    const { setupMockDb } = require('./mock-db');
    await setupMockDb();
    isMigrated = true;
  }

  // ... (keep existing clean tables and test data insertion code)
}
```

## Verification Plan

### Automated Tests
- Run `npm test` after implementing the changes.
- Verify that all tests pass without errors.
- Verify that the development PostgreSQL database remains untouched and its data is not wiped out.

### Manual Verification
- Check the local development site to ensure normal operations (e.g. `npm run dev`) still connect properly to the actual PostgreSQL database without issue.
