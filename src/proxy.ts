import { auth } from "@/auth";
import { NextResponse } from 'next/server';

export const proxy = auth((request: any) => {
  const path = request.nextUrl.pathname;
  const isLoggedIn = !!request.auth?.user;

  console.log(`[Proxy] Path: ${path}, isLoggedIn: ${isLoggedIn}`);

  // 1. Route protection: redirect unauthenticated users to /login
  // Public routes: /login, API routes, or static files
  const isPublicRoute = 
    path === '/login' || 
    path.startsWith('/api') || 
    path.startsWith('/_next') || 
    path === '/favicon.ico';

  if (!isLoggedIn && !isPublicRoute) {
    console.log(`[Proxy] Redirecting unauthenticated user to /login from ${path}`);
    const loginUrl = new URL('/login', request.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Legacy/integration x-role header checks on API routes
  if (path.startsWith('/api/v1')) {
    const role = request.headers.get('x-role');
    const method = request.method;

    if (!role) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Missing x-role header' } },
        { status: 401 }
      );
    }

    if (role === 'reader') {
      if (method !== 'GET') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Reader role only allows GET requests' } },
          { status: 403 }
        );
      }
    } else if (role === 'editor') {
      const allowedMethods = ['GET', 'POST', 'PATCH', 'PUT'];
      if (!allowedMethods.includes(method)) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Editor role only allows GET, POST, PATCH, PUT' } },
          { status: 403 }
        );
      }
    } else if (role === 'admin' || role === 'finance') {
      // Allowed all methods
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Invalid role specified' } },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
