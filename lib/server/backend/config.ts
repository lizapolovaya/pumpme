export type BackendStorageDriver = 'sqlite' | 'supabase';

export type BackendConfig = {
    storageDriver: BackendStorageDriver;
};

export function getBackendConfig(): BackendConfig {
    const storageDriver = process.env.PUMPME_STORAGE_DRIVER === 'supabase' ? 'supabase' : 'sqlite';

    return {
        storageDriver
    };
}
