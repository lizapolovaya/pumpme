import type { NutritionService } from './contracts';
import type { NutritionRepository } from '../repositories/contracts';
import type { UpdateNutritionDayInput, UpdateNutritionSettingsInput } from '../types';

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

    async getSettings() {
        return this.repository.getNutritionSettings(this.userId);
    }

    async updateSettings(input: UpdateNutritionSettingsInput) {
        return this.repository.updateNutritionSettings(this.userId, input);
    }
}
