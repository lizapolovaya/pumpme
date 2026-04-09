import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'pumpme_demo_session';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/icons') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const hasSession = request.cookies.get(COOKIE_NAME)?.value === '1';

    if (!hasSession && pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (hasSession && pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
