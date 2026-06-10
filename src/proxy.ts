import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req: any) => {
  const path = req.nextUrl.pathname;
  const isLoggedIn = !!req.auth?.user;

  // 1. Route protection: redirect unauthenticated users to /login
  // Public routes: /login, /api/auth/*, /favicon.ico, Next.js assets
  const isPublicRoute = path === '/login' || path.startsWith('/api/auth') || path.startsWith('/_next') || path === '/favicon.ico';

  if (!isLoggedIn && !isPublicRoute) {
    if (path.startsWith('/api')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized access' } }, { status: 401 });
    }
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
