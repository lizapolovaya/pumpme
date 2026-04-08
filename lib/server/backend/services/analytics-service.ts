import type { AnalyticsService } from './contracts';
import type { AnalyticsRepository } from '../repositories/contracts';

export class DefaultAnalyticsService implements AnalyticsService {
    constructor(
        private readonly userId: string,
        private readonly repository: AnalyticsRepository
    ) {}

    async getProgress(range: string) {
        return this.repository.getProgressSummary(this.userId, range);
    }
}
