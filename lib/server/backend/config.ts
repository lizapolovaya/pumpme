export type BackendStorageDriver = 'sqlite' | 'supabase';

export type SupabaseConfig = {
    url: string | null;
    anonKey: string | null;
    serviceRoleKey: string | null;
};

export type BackendConfig = {
    storageDriver: BackendStorageDriver;
    sqlitePath: string | null;
    supabase: SupabaseConfig;
};

export function getBackendConfig(): BackendConfig {
    const storageDriver = process.env.PUMPME_STORAGE_DRIVER === 'supabase' ? 'supabase' : 'sqlite';

    return {
        storageDriver,
        sqlitePath: process.env.PUMPME_SQLITE_PATH ?? null,
        supabase: {
            url: process.env.PUMPME_SUPABASE_URL ?? null,
            anonKey: process.env.PUMPME_SUPABASE_ANON_KEY ?? null,
            serviceRoleKey: process.env.PUMPME_SUPABASE_SERVICE_ROLE_KEY ?? null
        }
    };
}
