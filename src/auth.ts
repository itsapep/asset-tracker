import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"
import authConfig from "./auth.config"
import { accounts, sessions, users, verificationTokens } from "./db/schema"

const nextAuthResult = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  ...authConfig,
});

export const handlers = nextAuthResult.handlers;
export const signIn = nextAuthResult.signIn;
export const signOut = nextAuthResult.signOut;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth = (...args: any[]) => {
  if (typeof args[0] === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (nextAuthResult.auth as any)(args[0]);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((global as any).mockAuthSession !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Promise.resolve((global as any).mockAuthSession);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (nextAuthResult.auth as any)(...args);
};

