# Production Readiness Improvements (Detailed Execution Plan)

Based on our `/grill-me` session, we have identified three major areas to improve before deploying the Asset Tracker application to production: **Security**, **Workflow**, and **Deployment Strategy**.

This plan has been specifically formatted with step-by-step instructions, complete code snippets, and exact commands so that a junior programmer or AI agent can execute it without guesswork.

## User Review Required
> [!IMPORTANT]
> Please review the proposed changes below. Once you approve, I will begin execution and implement these changes.
> We are replacing the `x-role` header mechanism with real session role checks. If you have external automated systems relying on the `x-role` header to hit the `/api/v1/*` endpoints, they will need to be updated to use valid session tokens or we will need to implement a dedicated API key mechanism.

---

## 1. Security: Middleware & Authorization

Currently, `proxy.ts` is ignored by Next.js and the `x-role` header is highly insecure. We will replace it with a proper Next.js middleware using NextAuth's wrapper.

### Step 1.1: Delete `proxy.ts`
Run the following command in the terminal to remove the obsolete file:
```bash
rm src/proxy.ts
```

### Step 1.2: Create `src/middleware.ts`
Create the file `src/middleware.ts` and copy-paste the exact code below. This protects all API and dashboard routes by reading the user's role directly from the verified NextAuth session (`req.auth?.user?.roles`) instead of relying on spoofable headers.

```typescript
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth?.user;

  // 1. Route protection: redirect unauthenticated users to /login
  // Public routes: /login, /favicon.ico, Next.js assets
  const isPublicRoute = path === '/login' || path.startsWith('/_next') || path === '/favicon.ico';

  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role checks on API routes
  if (path.startsWith('/api/v1')) {
    // Cast user as any to access custom roles property injected in auth.config.ts
    const roles: string[] = (req.auth?.user as any)?.roles || [];
    const method = req.method;

    // Reject users with no roles
    if (roles.length === 0) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User has no assigned roles' } }, { status: 401 });
    }

    if (roles.includes('reader') && !roles.includes('admin') && !roles.includes('editor') && !roles.includes('finance')) {
      if (method !== 'GET') {
         return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Reader role only allows GET requests' } }, { status: 403 });
      }
    } else if (roles.includes('editor') && !roles.includes('admin') && !roles.includes('finance')) {
      const allowedMethods = ['GET', 'POST', 'PATCH', 'PUT'];
      if (!allowedMethods.includes(method)) {
         return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Editor role only allows GET, POST, PATCH, PUT' } }, { status: 403 });
      }
    }
    // Admin and Finance are allowed all methods implicitly here
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 2. Deployment: Database Migrations (Vercel)

To safely push schema changes to the production PostgreSQL database during Vercel deployments, we need a dedicated migration script.

### Step 2.1: Create Migration Script
Create the file `src/db/migrate.ts` with the following code. This script uses Drizzle's migrator to apply all SQL migrations.

```typescript
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function runMigrations() {
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
```

### Step 2.2: Update `package.json`
Edit `package.json` to add the `db:migrate` script and update the `build` script to automatically run migrations before Next.js builds.

Apply this diff to the `scripts` object in `package.json`:
```diff
   "scripts": {
     "dev": "next dev",
-    "build": "next build",
+    "build": "npm run db:migrate && next build",
     "start": "next start",
     "lint": "eslint",
     "db:seed": "npx tsx src/db/seed.ts",
+    "db:migrate": "npx tsx src/db/migrate.ts",
     "test": "MOCK_DB=true npx tsx --test --test-concurrency=1 src/app/api/api.test.ts src/app/api/auth.test.ts src/app/api/v1/status-requests/route.test.ts tests/components/EditAssetModal.test.tsx tests/components/UserDropdown.test.tsx"
   },
```

---

## 3. Workflow: CI/CD Pipeline (GitHub Actions)

We need an automated pipeline to run linting, type-checking, unit tests, and Playwright tests before code is merged or deployed.

### Step 3.1: Create GitHub Actions Workflow File
Create the directory structure `.github/workflows/` and then create a file inside named `ci.yml`. Add the following YAML content.

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/ci.yml`:
```yaml
name: CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: TypeScript Compile Check
      run: npx tsc --noEmit
      
    - name: ESLint Check
      run: npm run lint
      
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
      
    - name: Run Unit Tests
      run: npm run test
      
    - name: Run Playwright E2E Tests
      run: npx playwright test
```

## Final Verification
1. Run `npm run test` locally to ensure our mock database setup is unaffected by the `package.json` script updates.
2. Verify API routes enforce the 401 Unauthorized status code without a valid NextAuth session.
3. Test a production build locally with `npm run build` and ensure `drizzle-orm` successfully runs the `src/db/migrate.ts` script.
