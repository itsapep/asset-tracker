# API Login & Role Differentiation (NextAuth.js + RBAC) - Technical Specification

This document provides a highly detailed, step-by-step technical specification to implement authentication using NextAuth.js (Auth.js v5) and a granular Role-Based Access Control (RBAC) system using Drizzle ORM. This guide is designed to be easily actionable by a junior engineer or AI assistant.

## Goal Description
Implement an authentication system supporting Credentials (Email/Password) and Google OAuth without building the frontend UI. We will use JWT for session storage because the NextAuth Credentials provider mandates it, embedding user roles/permissions into the token.

---

## Phase 1: Dependency Installation

Run the following commands to install required packages:

```bash
# Install NextAuth v5 beta and the Drizzle adapter
npm install next-auth@beta @auth/drizzle-adapter

# Install password hashing library
npm install bcryptjs
npm install -D @types/bcryptjs
```

---

## Phase 2: Database Schema Updates (`src/db/schema.ts`)

You must add the NextAuth adapter tables and our custom RBAC tables to the Drizzle schema.

### 1. NextAuth Tables
Add the standard Auth.js tables with `pgTable`. Ensure you import necessary types from `drizzle-orm/pg-core` (like `timestamp`, `text`, `primaryKey`, `integer`).

```typescript
import { pgTable, text, timestamp, integer, primaryKey, uuid } from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"), // ADDED FOR CREDENTIALS
});

export const accounts = pgTable("account", {
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccountType>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
},
(account) => [
  primaryKey({ columns: [account.provider, account.providerAccountId] }),
]);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
},
(vt) => [
  primaryKey({ columns: [vt.identifier, vt.token] }),
]);
```

### 2. RBAC Tables
Add the tables that will define Roles and Permissions, and their relationships.

```typescript
export const roles = pgTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(), // e.g., 'Admin', 'Asset Manager', 'Viewer'
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(), // e.g., 'create:asset', 'delete:asset'
  description: text("description"),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.roleId, t.permissionId] }),
]);

export const userRoles = pgTable("user_roles", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.userId, t.roleId] }),
]);
```

**Action**: Run `npx drizzle-kit push` to apply these schema changes to the database.

---

## Phase 3: NextAuth Configuration

NextAuth v5 requires setting up configuration that can be used in Edge environments (like middleware), and a main `auth.ts` file.

### 1. Create `src/auth.config.ts`
This file contains the core configuration (providers and callbacks) but does NOT initialize the Drizzle adapter to keep it edge-compatible.

```typescript
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
// Note: You'll need to query the database here using your db instance
import { db } from '@/db'; 
import { eq } from 'drizzle-orm';
import { users, userRoles, rolePermissions, permissions, roles } from '@/db/schema';

export default {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        const userResult = await db.select().from(users).where(eq(users.email, credentials.email as string)).limit(1);
        const user = userResult[0];

        if (!user || !user.password) return null;
        
        const passwordsMatch = await bcrypt.compare(credentials.password as string, user.password);
        if (passwordsMatch) return user;
        
        return null;
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // If user object exists, it's the first time signing in
      if (user) {
        token.id = user.id;
        
        // Fetch user roles and permissions from the database
        const userRolesResult = await db
          .select({ roleName: roles.name, permissionName: permissions.name })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
          .leftJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(userRoles.userId, user.id as string));

        const roleSet = new Set<string>();
        const permissionSet = new Set<string>();
        
        userRolesResult.forEach(row => {
          if (row.roleName) roleSet.add(row.roleName);
          if (row.permissionName) permissionSet.add(row.permissionName);
        });

        token.roles = Array.from(roleSet);
        token.permissions = Array.from(permissionSet);
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as string[]) || [];
        session.user.permissions = (token.permissions as string[]) || [];
      }
      return session;
    }
  }
} satisfies NextAuthConfig;
```

### 2. Extend NextAuth Types (`src/types/next-auth.d.ts`)
To make TypeScript aware of our custom `roles` and `permissions` properties on the session.

```typescript
import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      permissions: string[];
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    permissions: string[];
  }
}
```

### 3. Create `src/auth.ts`
This is where the adapter is injected.

```typescript
import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import authConfig from "./auth.config"
import { accounts, sessions, users, verificationTokens } from "./db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  ...authConfig,
})
```

### 4. Create NextAuth API Route Handler
Create the file: `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

---

## Phase 4: RBAC Authorization Utilities

Create a utility file `src/lib/rbac.ts` to cleanly check permissions in Server Actions or API routes.

```typescript
import { auth } from "@/auth";

export async function hasPermission(requiredPermission: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  
  return session.user.permissions.includes(requiredPermission);
}

export async function hasRole(requiredRole: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  
  return session.user.roles.includes(requiredRole);
}

export async function requirePermission(requiredPermission: string) {
  const isAuthorized = await hasPermission(requiredPermission);
  if (!isAuthorized) {
    throw new Error("Unauthorized: Missing required permission");
  }
}
```

---

## Phase 5: Database Seeding (`src/db/seed.ts`)

Update the seeding script to insert roles, permissions, and a default admin user for login.

1. **Insert Permissions**: e.g., 'create:asset', 'read:asset', 'update:asset', 'delete:asset'
2. **Insert Roles**: e.g., 'Admin', 'Asset Manager', 'Technician', 'Viewer', 'Division Head'
3. **Map Permissions to Roles**: 
   - Admin gets everything.
   - Viewer gets only 'read:asset'.
4. **Create Default Admin User**:
   - Name: "System Admin"
   - Email: "admin@example.com"
   - Password: Hash the string `"password123"` using `bcrypt.hashSync("password123", 10)`
5. **Assign User Role**: Map the new Admin user to the 'Admin' role via the `user_roles` table.

## Phase 6: Environment Variables
Ensure `.env.local` contains:
```env
AUTH_SECRET="your-super-secret-random-string" # Run `npx auth secret` to generate one
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```
