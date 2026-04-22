import type { NutritionService } from './contracts';
import type { NutritionRepository } from '../repositories/contracts';
import type { UpdateNutritionDayInput } from '../types';

export class DefaultNutritionService implements NutritionService {
    constructor(
        private readonly userId: string,
        private readonly repository: NutritionRepository
    ) {}

    async getDay(date: string) {
        return this.repository.getNutritionDay(this.userId, date);
    }

    async updateDay(date: string, input: UpdateNutritionDayInput) {
        return this.repository.updateNutritionDay(this.userId, date, input);
    }
}
