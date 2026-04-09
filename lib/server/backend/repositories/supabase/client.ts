import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseConfig } from '../../config';

export function createSupabaseServerClient(config: SupabaseConfig): SupabaseClient {
    if (!config.url) {
        throw new Error('PUMPME_SUPABASE_URL is required when PUMPME_STORAGE_DRIVER=supabase');
    }

    const key = config.serviceRoleKey ?? config.anonKey;
    if (!key) {
        throw new Error(
            'PUMPME_SUPABASE_SERVICE_ROLE_KEY or PUMPME_SUPABASE_ANON_KEY is required when PUMPME_STORAGE_DRIVER=supabase'
        );
    }

    return createClient(config.url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
}

export function requireSupabaseOk<T>(result: { data: T | null; error: unknown | null }, context: string): T {
    if (result.error) {
        const message = result.error instanceof Error ? result.error.message : String(result.error);
        throw new Error(`${context}: ${message}`);
    }

    if (result.data === null) {
        throw new Error(`${context}: no data returned`);
    }

    return result.data;
}
