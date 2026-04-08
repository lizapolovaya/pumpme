import type { CalendarService } from './contracts';
import type { CalendarRepository } from '../repositories/contracts';

export class DefaultCalendarService implements CalendarService {
    constructor(
        private readonly userId: string,
        private readonly repository: CalendarRepository
    ) {}

    async getMonth(year: number, month: number, selectedDate?: string) {
        return this.repository.getMonth(this.userId, year, month, selectedDate);
    }
}
