import type { ReadinessService } from './contracts';
import type { ReadinessRepository } from '../repositories/contracts';
import type { UpdateReadinessDayInput } from '../types';

export class DefaultReadinessService implements ReadinessService {
    constructor(
        private readonly userId: string,
        private readonly repository: ReadinessRepository
    ) {}

    async getDay(date: string) {
        return this.repository.getReadinessDay(this.userId, date);
    }

    async updateDay(date: string, input: UpdateReadinessDayInput) {
        return this.repository.updateReadinessDay(this.userId, date, input);
    }
}
