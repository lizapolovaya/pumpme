import type { BackendServices } from './contracts';
import { createSqliteRepositories } from '../repositories/sqlite';
import { getBackendConfig } from '../config';
import { DefaultCalendarService } from './calendar-service';
import { DefaultDashboardService } from './dashboard-service';
import { DefaultPreferencesService } from './preferences-service';
import { DefaultProfileService } from './profile-service';
import { DefaultWorkoutService } from './workout-service';

function notImplementedService(name: string) {
    return new Proxy(
        {},
        {
            get() {
                throw new Error(`${name} is not implemented yet`);
            }
        }
    );
}

export function createBackendServices(userId: string): BackendServices {
    const config = getBackendConfig();

    if (config.storageDriver !== 'sqlite') {
        throw new Error(`Unsupported storage driver: ${config.storageDriver}`);
    }

    const repositories = createSqliteRepositories();

    return {
        profile: new DefaultProfileService(userId, repositories.profile),
        preferences: new DefaultPreferencesService(userId, repositories.preferences),
        dashboard: new DefaultDashboardService(userId, {
            dashboard: repositories.dashboard,
            profile: repositories.profile,
            preferences: repositories.preferences
        }),
        workouts: new DefaultWorkoutService(userId, repositories.workouts),
        calendar: new DefaultCalendarService(userId, repositories.calendar),
        nutrition: notImplementedService('NutritionService') as BackendServices['nutrition'],
        readiness: notImplementedService('ReadinessService') as BackendServices['readiness'],
        analytics: notImplementedService('AnalyticsService') as BackendServices['analytics']
    };
}
