import { NextResponse } from 'next/server';
import { GOOGLE_HEALTH_ACTIVITY_SCOPE } from '../../../lib/server/auth/constants';
import { createSupabaseServerAuthClient } from '../../../lib/server/auth/supabase';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const next = url.searchParams.get('next') ?? '/';
    const loginUrl = new URL('/login', url.origin);
    const nextPath = next.startsWith('/') ? next : '/';
    loginUrl.searchParams.set('next', nextPath);

    const client = await createSupabaseServerAuthClient();

    if (!client) {
        loginUrl.searchParams.set('authError', 'supabase_not_configured');
        return NextResponse.redirect(loginUrl);
    }

    const redirectUrl = new URL('/auth/callback', url.origin);
    redirectUrl.searchParams.set('next', nextPath);

    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl.toString(),
            scopes: `openid email profile ${GOOGLE_HEALTH_ACTIVITY_SCOPE}`,
            queryParams: {
                access_type: 'offline',
                include_granted_scopes: 'true',
                prompt: 'consent'
            }
        }
    });

    if (error || !data.url) {
        loginUrl.searchParams.set('authError', 'oauth_start_failed');
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(data.url);
}
