import type { ActivityService } from './contracts';
import type { ActivityRepository } from '../repositories/contracts';
import type { UpdateActivityDayInput } from '../types';

export class DefaultActivityService implements ActivityService {
    constructor(
        private readonly userId: string,
        private readonly repository: ActivityRepository
    ) {}

    async getDay(date: string) {
        return this.repository.getActivityDay(this.userId, date);
    }

    async syncDay(date: string, input: UpdateActivityDayInput) {
        return this.repository.syncActivityDay(this.userId, date, input);
    }
}
