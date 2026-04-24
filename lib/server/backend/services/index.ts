import type { BackendServices } from './contracts';
import { createBackendRepositories } from '../repositories';
import { getBackendConfig } from '../config';
import { DefaultActivityService } from './activity-service';
import { DefaultAnalyticsService } from './analytics-service';
import { DefaultCalendarService } from './calendar-service';
import { DefaultDashboardService } from './dashboard-service';
import { DefaultNutritionService } from './nutrition-service';
import { DefaultPreferencesService } from './preferences-service';
import { DefaultProfileService } from './profile-service';
import { DefaultReadinessService } from './readiness-service';
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
    const repositories = createBackendRepositories(config);

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
        nutrition: new DefaultNutritionService(userId, repositories.nutrition),
        activity: new DefaultActivityService(userId, repositories.activity),
        readiness: new DefaultReadinessService(userId, repositories.readiness),
        analytics: new DefaultAnalyticsService(userId, repositories.analytics)
    };
}
