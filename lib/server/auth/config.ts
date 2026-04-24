export type SupabaseAuthConfig = {
    anonKey: string;
    url: string;
};

export function getSupabaseAuthConfig(): SupabaseAuthConfig | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        return null;
    }

    return {
        url,
        anonKey
    };
}

export function isSupabaseAuthEnabled(): boolean {
    return getSupabaseAuthConfig() !== null;
}

export function getGoogleOAuthClientCredentials() {
    const clientId = process.env.PUMPME_GOOGLE_OAUTH_CLIENT_ID ?? null;
    const clientSecret = process.env.PUMPME_GOOGLE_OAUTH_CLIENT_SECRET ?? null;

    if (!clientId || !clientSecret) {
        return null;
    }

    return {
        clientId,
        clientSecret
    };
}

