import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const { pathname } = request.nextUrl;

    // Public routes
    const publicRoutes = ['/login', '/register', '/'];
    if (publicRoutes.includes(pathname)) {
        if (token) {
            // Redirect to dashboard if already logged in
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Protected routes - require authentication
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection
    const role = token.role as string;

    // Owner routes
    if (pathname.startsWith('/dashboard/owner') && role !== 'OWNER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Kurir routes
    if (pathname.startsWith('/dashboard/kurir') && role !== 'KURIR') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // User routes
    if (pathname.startsWith('/dashboard/user') && role !== 'USER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/register',
    ],
};
