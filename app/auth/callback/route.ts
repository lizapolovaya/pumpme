import { NextResponse } from 'next/server';
import { createSupabaseServerAuthClient } from '../../../lib/server/auth/supabase';
import { ensureBackendUserFromAuthUser } from '../../../lib/server/auth/users';
import { inspectGoogleAccessTokenScopes, persistGoogleConnection } from '../../../lib/server/auth/google-connection';
import { syncGoogleStepsForDate } from '../../../lib/server/auth/google-fit';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') ?? '/';
    const redirectUrl = new URL(next.startsWith('/') ? next : '/', url.origin);

    if (!code) {
        redirectUrl.searchParams.set('authError', 'missing_code');
        return NextResponse.redirect(redirectUrl);
    }

    const client = await createSupabaseServerAuthClient();

    if (!client) {
        redirectUrl.searchParams.set('authError', 'supabase_not_configured');
        return NextResponse.redirect(redirectUrl);
    }

    const { data, error } = await client.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
        redirectUrl.searchParams.set('authError', 'exchange_failed');
        return NextResponse.redirect(redirectUrl);
    }

    await ensureBackendUserFromAuthUser(data.user);

    if (data.session?.provider_token || data.session?.provider_refresh_token) {
        const scopes = data.session.provider_token
            ? await inspectGoogleAccessTokenScopes(data.session.provider_token)
            : [];

        await persistGoogleConnection({
            accessToken: data.session.provider_token ?? null,
            accessTokenExpiresAt:
                typeof data.session.expires_at === 'number'
                    ? new Date(data.session.expires_at * 1000).toISOString()
                    : null,
            email: data.user.email ?? null,
            googleUserId: Array.isArray(data.user.identities) ? data.user.identities[0]?.id ?? null : null,
            refreshToken: data.session.provider_refresh_token ?? null,
            scopes,
            userId: data.user.id
        });

        try {
            await syncGoogleStepsForDate(data.user.id, new Date().toISOString().slice(0, 10));
        } catch {
            return NextResponse.redirect(redirectUrl);
        }
    }

    return NextResponse.redirect(redirectUrl);
}

