import type { BackendConfig } from '../../config';
import type { BackendRepositories } from '../contracts';

function assertSupabaseConfig(config: BackendConfig) {
    if (!config.supabase.url) {
        throw new Error('PUMPME_SUPABASE_URL is required when PUMPME_STORAGE_DRIVER=supabase');
    }

    if (!config.supabase.anonKey && !config.supabase.serviceRoleKey) {
        throw new Error(
            'PUMPME_SUPABASE_ANON_KEY or PUMPME_SUPABASE_SERVICE_ROLE_KEY is required when PUMPME_STORAGE_DRIVER=supabase'
        );
    }
}

function createNotImplementedRepository<TName extends keyof BackendRepositories>(
    name: TName
): BackendRepositories[TName] {
    return new Proxy(
        {},
        {
            get(_target, property) {
                throw new Error(
                    `Supabase ${String(name)} repository is not implemented yet. ` +
                        `The backend is prepared for a provider swap, but ${String(property)} still needs a Supabase adapter.`
                );
            }
        }
    ) as BackendRepositories[TName];
}

export function createSupabaseRepositories(config: BackendConfig): BackendRepositories {
    assertSupabaseConfig(config);

    return {
        profile: createNotImplementedRepository('profile'),
        preferences: createNotImplementedRepository('preferences'),
        workouts: createNotImplementedRepository('workouts'),
        nutrition: createNotImplementedRepository('nutrition'),
        readiness: createNotImplementedRepository('readiness'),
        dashboard: createNotImplementedRepository('dashboard'),
        calendar: createNotImplementedRepository('calendar'),
        analytics: createNotImplementedRepository('analytics')
    };
}
