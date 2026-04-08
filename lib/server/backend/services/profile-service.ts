import type { ProfileService } from './contracts';
import type { ProfileRepository } from '../repositories/contracts';
import type { UpdateProfileInput } from '../types';

export class DefaultProfileService implements ProfileService {
    constructor(
        private readonly userId: string,
        private readonly repository: ProfileRepository
    ) {}

    async getProfile() {
        return this.repository.getProfile(this.userId);
    }

    async updateProfile(input: UpdateProfileInput) {
        return this.repository.updateProfile(this.userId, input);
    }
}
