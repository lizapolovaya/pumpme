import type { BackendConfig } from '../../config';
import type { BackendRepositories } from '../contracts';
import { SupabaseActivityRepository } from './activity-repository';
import { createSupabaseServerClient } from './client';
import { SupabaseAnalyticsRepository } from './analytics-repository';
import { SupabaseCalendarRepository } from './calendar-repository';
import { SupabaseDashboardRepository } from './dashboard-repository';
import { SupabaseNutritionRepository } from './nutrition-repository';
import { SupabasePreferencesRepository } from './preferences-repository';
import { SupabaseProfileRepository } from './profile-repository';
import { SupabaseReadinessRepository } from './readiness-repository';
import { SupabaseWorkoutRepository } from './workout-repository';

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

export function createSupabaseRepositories(config: BackendConfig): BackendRepositories {
    assertSupabaseConfig(config);
    const client = createSupabaseServerClient(config.supabase);

    return {
        profile: new SupabaseProfileRepository(client),
        preferences: new SupabasePreferencesRepository(client),
        workouts: new SupabaseWorkoutRepository(client),
        nutrition: new SupabaseNutritionRepository(client),
        activity: new SupabaseActivityRepository(client),
        readiness: new SupabaseReadinessRepository(client),
        dashboard: new SupabaseDashboardRepository(client),
        calendar: new SupabaseCalendarRepository(client),
        analytics: new SupabaseAnalyticsRepository(client)
    };
}
