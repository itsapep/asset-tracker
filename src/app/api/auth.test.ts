import { describe, it, beforeEach, after, mock } from 'node:test';
import assert from 'node:assert';
import { resetDatabase } from '@/db/test-helper';
import { client, db } from '@/db';
import authConfig from '@/auth.config';
import { users, roles, permissions, userRoles, rolePermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// We want to test rbac helpers. Since ESM exports are read-only, we can mock the session by intercepting hasPermission/hasRole inputs
// or we can test the credentials authorize function directly.
describe('Authentication & RBAC Tests', () => {
  let ids: { applianceAssetId: string; vehicleAssetId: string; vehicleId: string };

  beforeEach(async () => {
    ids = await resetDatabase();
  });

  after(async () => {
    await client.end();
  });

  describe('Credentials Provider Authorization', () => {
    it('should successfully authorize user with correct email and password', async () => {
      // Find the Credentials provider from config
      const credentialsProvider = authConfig.providers.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p && typeof p === 'object' && p.id === 'credentials'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;

      assert.ok(credentialsProvider, 'Credentials provider should be defined in config');

      // Create a test user in the database
      const passwordHash = await bcrypt.hash('testpassword123', 10);
      const [testUser] = await db.insert(users).values({
        name: 'Test User',
        email: 'test@example.com',
        password: passwordHash,
      }).returning();

      const authFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;

      // Call the authorize function
      const authorizedUser = await authFn({
        email: 'test@example.com',
        password: 'testpassword123',
      });

      assert.ok(authorizedUser, 'Authorize should return user object');
      assert.strictEqual(authorizedUser.email, 'test@example.com');
      assert.strictEqual(authorizedUser.id, testUser.id);
    });

    it('should return null for incorrect password', async () => {
      const credentialsProvider = authConfig.providers.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p && typeof p === 'object' && p.id === 'credentials'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
      const authFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;

      const passwordHash = await bcrypt.hash('testpassword123', 10);
      await db.insert(users).values({
        name: 'Test User',
        email: 'test@example.com',
        password: passwordHash,
      });

      const authorizedUser = await authFn({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      assert.strictEqual(authorizedUser, null, 'Should return null for wrong password');
    });

    it('should return null for non-existent email', async () => {
      const credentialsProvider = authConfig.providers.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p && typeof p === 'object' && p.id === 'credentials'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any;
      const authFn = credentialsProvider.options?.authorize || credentialsProvider.authorize;

      const authorizedUser = await authFn({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      assert.strictEqual(authorizedUser, null, 'Should return null for non-existent user');
    });
  });

  describe('JWT Session Enrichment Callback', () => {
    it('should append user roles and permissions to the JWT token on first sign in', async () => {
      const jwtCallback = authConfig.callbacks?.jwt;
      assert.ok(jwtCallback, 'JWT callback should be defined');

      // Seed a user, role, and permission
      const [testUser] = await db.insert(users).values({
        name: 'RBAC User',
        email: 'rbac@example.com',
      }).returning();

      const [testRole] = await db.insert(roles).values({
        name: 'Custom Manager',
        description: 'Test role',
      }).returning();

      const [testPermission] = await db.insert(permissions).values({
        name: 'test:permission',
        description: 'Test permission',
      }).returning();

      // Link them
      await db.insert(rolePermissions).values({
        roleId: testRole.id,
        permissionId: testPermission.id,
      });

      await db.insert(userRoles).values({
        userId: testUser.id,
        roleId: testRole.id,
      });

      // Invoke callback mimicking initial sign in (user parameter provided)
      const token = await jwtCallback({
        token: {},
        user: { id: testUser.id, email: testUser.email, name: testUser.name },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      assert.ok(token);
      assert.deepStrictEqual(token.roles, ['Custom Manager']);
      assert.deepStrictEqual(token.permissions, ['test:permission']);
    });
  });
});
