import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
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
      if (user) {
        token.id = user.id;
        
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
