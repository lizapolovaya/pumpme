import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set(['/auth/callback', '/auth/signout', '/help', '/login', '/privacy']);

function isPublicPath(pathname: string): boolean {
    if (PUBLIC_PATHS.has(pathname)) {
        return true;
    }

    return pathname.startsWith('/_next') || pathname.startsWith('/icons') || pathname === '/manifest.webmanifest';
}

export async function proxy(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers
        }
    });

    const client = createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                for (const cookie of cookiesToSet) {
                    request.cookies.set(cookie.name, cookie.value);
                }

                response = NextResponse.next({
                    request: {
                        headers: request.headers
                    }
                });

                for (const cookie of cookiesToSet) {
                    response.cookies.set(cookie.name, cookie.value, cookie.options as CookieOptions);
                }
            }
        }
    });

    const {
        data: { user }
    } = await client.auth.getUser();
    const pathname = request.nextUrl.pathname;
    const isPublic = isPublicPath(pathname);

    if (!user && !isPublic) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(redirectUrl);
    }

    if (user && pathname === '/login') {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.delete('next');
        return NextResponse.redirect(redirectUrl);
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js).*)']
};
