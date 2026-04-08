import type { BackendRepositories } from '../contracts';
import { SqliteCalendarRepository } from './calendar-repository';
import { SqliteDashboardRepository } from './dashboard-repository';
import { SqliteNutritionRepository } from './nutrition-repository';
import { SqlitePreferencesRepository } from './preferences-repository';
import { SqliteProfileRepository } from './profile-repository';
import { SqliteReadinessRepository } from './readiness-repository';
import { SqliteWorkoutRepository } from './workout-repository';

function notImplementedRepository(name: string) {
    return new Proxy(
        {},
        {
            get() {
                throw new Error(`${name} is not implemented yet`);
            }
        }
    );
}

export function createSqliteRepositories(): BackendRepositories {
    return {
        profile: new SqliteProfileRepository(),
        preferences: new SqlitePreferencesRepository(),
        workouts: new SqliteWorkoutRepository(),
        nutrition: new SqliteNutritionRepository(),
        readiness: new SqliteReadinessRepository(),
        dashboard: new SqliteDashboardRepository(),
        calendar: new SqliteCalendarRepository(),
        analytics: notImplementedRepository('AnalyticsRepository') as BackendRepositories['analytics']
    };
}
