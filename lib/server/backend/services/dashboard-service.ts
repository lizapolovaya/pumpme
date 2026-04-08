import type { DashboardService } from './contracts';
import type { DashboardRepository, PreferencesRepository, ProfileRepository } from '../repositories/contracts';
import { getBootstrapFromRepositories } from './bootstrap';

export class DefaultDashboardService implements DashboardService {
    constructor(
        private readonly userId: string,
        private readonly repositories: {
            dashboard: DashboardRepository;
            profile: ProfileRepository;
            preferences: PreferencesRepository;
        }
    ) {}

    async getToday(date: string) {
        return this.repositories.dashboard.getTodayDashboard(this.userId, date);
    }

    async getBootstrap(date: string) {
        return getBootstrapFromRepositories(
            {
                profile: this.repositories.profile,
                preferences: this.repositories.preferences,
                dashboard: this.repositories.dashboard
            } as any,
            this.userId,
            date
        );
    }
}
