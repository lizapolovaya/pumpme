import type { WorkoutService } from './contracts';
import type { WorkoutRepository } from '../repositories/contracts';
import type {
    AddWorkoutExerciseInput,
    AddWorkoutSetInput,
    StartWorkoutSessionInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSessionInput,
    UpdateWorkoutSetInput
} from '../types';

export class DefaultWorkoutService implements WorkoutService {
    constructor(
        private readonly userId: string,
        private readonly repository: WorkoutRepository
    ) {}

    async listTemplates() {
        return this.repository.listTemplates(this.userId);
    }

    async getSession(sessionId: string) {
        return this.repository.getSession(this.userId, sessionId);
    }

    async getSessionByDate(date: string) {
        return this.repository.getSessionByDate(this.userId, date);
    }

    async findSessionByDate(date: string) {
        return this.repository.findSessionByDate(this.userId, date);
    }

    async startSession(input: StartWorkoutSessionInput) {
        return this.repository.startSession(this.userId, input);
    }

    async updateSession(sessionId: string, input: UpdateWorkoutSessionInput) {
        return this.repository.updateSession(this.userId, sessionId, input);
    }

    async addExercise(sessionId: string, input: AddWorkoutExerciseInput) {
        return this.repository.addExercise(this.userId, sessionId, input);
    }

    async updateExercise(sessionId: string, exerciseRowId: string, input: UpdateWorkoutExerciseInput) {
        return this.repository.updateExercise(this.userId, sessionId, exerciseRowId, input);
    }

    async removeExercise(sessionId: string, exerciseRowId: string) {
        return this.repository.removeExercise(this.userId, sessionId, exerciseRowId);
    }

    async addSet(sessionId: string, exerciseRowId: string, input: AddWorkoutSetInput) {
        return this.repository.addSet(this.userId, sessionId, exerciseRowId, input);
    }

    async updateSet(sessionId: string, setId: string, input: UpdateWorkoutSetInput) {
        return this.repository.updateSet(this.userId, sessionId, setId, input);
    }

    async removeSet(sessionId: string, setId: string) {
        return this.repository.removeSet(this.userId, sessionId, setId);
    }

    async finishSession(sessionId: string) {
        return this.repository.finishSession(this.userId, sessionId);
    }
}
