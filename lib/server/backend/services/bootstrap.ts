import type { BackendRepositories } from '../repositories/contracts';
import type { BootstrapResponse, TodayDashboardDto } from '../types';

export async function getTodayDashboardFromRepositories(
    repositories: BackendRepositories,
    userId: string,
    date: string
): Promise<TodayDashboardDto> {
    return repositories.dashboard.getTodayDashboard(userId, date);
}

export async function getBootstrapFromRepositories(
    repositories: BackendRepositories,
    userId: string,
    date: string
): Promise<BootstrapResponse> {
    const [user, preferences, today] = await Promise.all([
        repositories.profile.getProfile(userId),
        repositories.preferences.getPreferences(userId),
        getTodayDashboardFromRepositories(repositories, userId, date)
    ]);

    return {
        user,
        preferences,
        today
    };
}
