import type { PreferencesService } from './contracts';
import type { PreferencesRepository } from '../repositories/contracts';
import type { UpdatePreferencesInput } from '../types';

export class DefaultPreferencesService implements PreferencesService {
    constructor(
        private readonly userId: string,
        private readonly repository: PreferencesRepository
    ) {}

    async getPreferences() {
        return this.repository.getPreferences(this.userId);
    }

    async updatePreferences(input: UpdatePreferencesInput) {
        return this.repository.updatePreferences(this.userId, input);
    }
}
