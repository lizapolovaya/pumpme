import { createSupabaseServerClient } from '../backend/repositories/supabase/client';
import { getBackendConfig } from '../backend/config';
import type { GoogleConnectionRecord } from './types';
import { getGoogleOAuthClientCredentials } from './config';
import { GOOGLE_HEALTH_ACTIVITY_SCOPE } from './constants';

type PersistGoogleConnectionInput = {
    accessToken?: string | null;
    accessTokenExpiresAt?: string | null;
    connectedAt?: string | null;
    email?: string | null;
    googleUserId?: string | null;
    refreshToken?: string | null;
    scopes?: string[];
    userId: string;
};

function createAdminClient() {
    const config = getBackendConfig();

    if (config.storageDriver !== 'supabase') {
        throw new Error('Google auth storage requires PUMPME_STORAGE_DRIVER=supabase');
    }

    return createSupabaseServerClient(config.supabase);
}

export function isGoogleConnectionStoreAvailable(): boolean {
    return getBackendConfig().storageDriver === 'supabase';
}

function mapScopes(value: string | null | undefined): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(' ')
        .map((scope) => scope.trim())
        .filter(Boolean);
}

function toRecord(row: Record<string, unknown>): GoogleConnectionRecord {
    return {
        accessToken: typeof row.access_token === 'string' ? row.access_token : null,
        accessTokenExpiresAt: typeof row.access_token_expires_at === 'string' ? row.access_token_expires_at : null,
        connectedAt: typeof row.connected_at === 'string' ? row.connected_at : null,
        email: typeof row.email === 'string' ? row.email : null,
        googleUserId: typeof row.google_user_id === 'string' ? row.google_user_id : null,
        lastSyncAt: typeof row.last_sync_at === 'string' ? row.last_sync_at : null,
        lastSyncError: typeof row.last_sync_error === 'string' ? row.last_sync_error : null,
        refreshToken: typeof row.refresh_token === 'string' ? row.refresh_token : null,
        scopes: mapScopes(typeof row.scopes === 'string' ? row.scopes : null),
        userId: String(row.user_id)
    };
}

export async function getGoogleConnection(userId: string): Promise<GoogleConnectionRecord | null> {
    if (!isGoogleConnectionStoreAvailable()) {
        return null;
    }

    const client = createAdminClient();
    const result = await client
        .from('google_oauth_connections')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (result.error) {
        if (result.error.message.includes('does not exist') || result.error.message.includes('schema cache')) {
            return null;
        }

        throw result.error;
    }

    if (!result.data) {
        return null;
    }

    return toRecord(result.data);
}

export async function persistGoogleConnection(input: PersistGoogleConnectionInput): Promise<void> {
    if (!isGoogleConnectionStoreAvailable()) {
        throw new Error('Google auth storage requires PUMPME_STORAGE_DRIVER=supabase');
    }

    const existing = await getGoogleConnection(input.userId);
    const client = createAdminClient();
    const result = await client.from('google_oauth_connections').upsert(
        {
            user_id: input.userId,
            access_token: input.accessToken ?? existing?.accessToken ?? null,
            access_token_expires_at: input.accessTokenExpiresAt ?? existing?.accessTokenExpiresAt ?? null,
            connected_at: input.connectedAt ?? existing?.connectedAt ?? new Date().toISOString(),
            email: input.email ?? existing?.email ?? null,
            google_user_id: input.googleUserId ?? existing?.googleUserId ?? null,
            refresh_token: input.refreshToken ?? existing?.refreshToken ?? null,
            scopes: (input.scopes ?? existing?.scopes ?? []).join(' '),
            updated_at: new Date().toISOString()
        },
        {
            onConflict: 'user_id'
        }
    );

    if (result.error) {
        throw result.error;
    }
}

export async function updateGoogleSyncResult(userId: string, input: { lastSyncAt?: string | null; lastSyncError?: string | null }) {
    if (!isGoogleConnectionStoreAvailable()) {
        throw new Error('Google auth storage requires PUMPME_STORAGE_DRIVER=supabase');
    }

    const client = createAdminClient();
    const result = await client
        .from('google_oauth_connections')
        .update({
            last_sync_at: input.lastSyncAt ?? null,
            last_sync_error: input.lastSyncError ?? null,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

    if (result.error) {
        throw result.error;
    }
}

export async function inspectGoogleAccessTokenScopes(accessToken: string): Promise<string[]> {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`, {
        cache: 'no-store'
    });

    if (!response.ok) {
        return [];
    }

    const payload = (await response.json()) as { scope?: string };
    return mapScopes(payload.scope);
}

export async function refreshGoogleAccessToken(connection: GoogleConnectionRecord): Promise<{
    accessToken: string;
    expiresAt: string | null;
}> {
    if (!connection.refreshToken) {
        throw new Error('Google account is connected without a refresh token. Reconnect Google to continue.');
    }

    const credentials = getGoogleOAuthClientCredentials();

    if (!credentials) {
        throw new Error('Missing Google OAuth client credentials on the server.');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: connection.refreshToken
        }),
        cache: 'no-store'
    });

    const payload = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
        scope?: string;
        error?: string;
        error_description?: string;
    };

    if (!response.ok || !payload.access_token) {
        throw new Error(payload.error_description ?? payload.error ?? 'Unable to refresh Google access token');
    }

    const expiresAt =
        typeof payload.expires_in === 'number'
            ? new Date(Date.now() + payload.expires_in * 1000).toISOString()
            : null;

    await persistGoogleConnection({
        accessToken: payload.access_token,
        accessTokenExpiresAt: expiresAt,
        refreshToken: connection.refreshToken,
        scopes: payload.scope ? mapScopes(payload.scope) : connection.scopes,
        userId: connection.userId
    });

    return {
        accessToken: payload.access_token,
        expiresAt
    };
}

export function hasGoogleHealthActivityScope(scopes: string[]): boolean {
    return scopes.includes(GOOGLE_HEALTH_ACTIVITY_SCOPE);
}
