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
            // Redirect langsung ke dashboard sesuai role
            const role = (token.role as string)?.toLowerCase() || 'user';
            return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
        }
        return NextResponse.next();
    }

    // Protected routes - require authentication
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    const role = (token.role as string)?.toLowerCase() || 'user';

    // Redirect /dashboard ke dashboard spesifik role
    if (pathname === '/dashboard') {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    // Role-based route protection
    if (pathname.startsWith('/dashboard/owner') && token.role !== 'OWNER') {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    if (pathname.startsWith('/dashboard/kurir') && token.role !== 'KURIR') {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }

    if (pathname.startsWith('/dashboard/user') && token.role !== 'USER') {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
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
