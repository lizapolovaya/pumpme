import type { BackendConfig } from '../config';
import type { BackendRepositories } from './contracts';
import { createSqliteRepositories } from './sqlite';
import { createSupabaseRepositories } from './supabase';

export function createBackendRepositories(config: BackendConfig): BackendRepositories {
    switch (config.storageDriver) {
        case 'sqlite':
            return createSqliteRepositories();
        case 'supabase':
            return createSupabaseRepositories(config);
        default: {
            const exhaustiveCheck: never = config.storageDriver;
            throw new Error(`Unsupported storage driver: ${exhaustiveCheck}`);
        }
    }
}
