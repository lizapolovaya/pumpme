'use client';

import { getSupabaseBrowserClient } from './supabase-browser';
import { GOOGLE_FIT_ACTIVITY_SCOPE } from '../server/auth/constants';

export async function startGoogleAuthFlow(nextPath = '/'): Promise<void> {
    const client = getSupabaseBrowserClient();

    if (!client) {
        throw new Error('Supabase auth is not configured.');
    }

    const redirectUrl = new URL('/auth/callback', window.location.origin);
    redirectUrl.searchParams.set('next', nextPath);

    const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl.toString(),
            scopes: `openid email profile ${GOOGLE_FIT_ACTIVITY_SCOPE}`,
            queryParams: {
                access_type: 'offline',
                include_granted_scopes: 'true',
                prompt: 'consent'
            }
        }
    });

    if (error) {
        throw error;
    }
}
