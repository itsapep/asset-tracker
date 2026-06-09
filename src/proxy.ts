import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

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
}

export const config = {
  matcher: '/api/v1/:path*',
};
