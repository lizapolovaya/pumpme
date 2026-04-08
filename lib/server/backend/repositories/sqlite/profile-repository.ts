import type { ProfileRepository } from '../contracts';
import type { UpdateProfileInput } from '../../types';
import { ensureUserScaffold, getSqliteRepositoryDatabase, mapProfileRow } from './shared';

export class SqliteProfileRepository implements ProfileRepository {
    async getProfile(userId: string) {
        const db = getSqliteRepositoryDatabase();
        ensureUserScaffold(db, userId);

        const row = db
            .prepare(`
                SELECT
                    users.id,
                    users.email,
                    users.display_name,
                    users.avatar_url,
                    user_metrics.age,
                    user_metrics.primary_goal,
                    user_metrics.height_cm,
                    user_metrics.weight_kg,
                    user_metrics.step_goal
                FROM users
                INNER JOIN user_metrics ON user_metrics.user_id = users.id
                WHERE users.id = ?
            `)
            .get(userId);

        if (!row) {
            throw new Error(`Profile not found for user ${userId}`);
        }

        return mapProfileRow(row as ReturnType<typeof db.prepare> extends never ? never : any);
    }

    async updateProfile(userId: string, input: UpdateProfileInput) {
        const db = getSqliteRepositoryDatabase();
        ensureUserScaffold(db, userId);

        const current = await this.getProfile(userId);
        const nextProfile = {
            displayName: input.displayName ?? current.displayName,
            avatarUrl: input.avatarUrl === undefined ? current.avatarUrl : input.avatarUrl,
            age: input.age === undefined ? current.age : input.age,
            primaryGoal: input.primaryGoal ?? current.primaryGoal,
            heightCm: input.heightCm === undefined ? current.heightCm : input.heightCm,
            weightKg: input.weightKg === undefined ? current.weightKg : input.weightKg,
            stepGoal: input.stepGoal === undefined ? current.stepGoal : input.stepGoal
        };

        const update = db.transaction(() => {
            db.prepare(`
                UPDATE users
                SET display_name = @displayName,
                    avatar_url = @avatarUrl,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = @userId
            `).run({
                userId,
                displayName: nextProfile.displayName,
                avatarUrl: nextProfile.avatarUrl
            });

            db.prepare(`
                UPDATE user_metrics
                SET age = @age,
                    primary_goal = @primaryGoal,
                    height_cm = @heightCm,
                    weight_kg = @weightKg,
                    step_goal = @stepGoal,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = @userId
            `).run({
                userId,
                age: nextProfile.age,
                primaryGoal: nextProfile.primaryGoal,
                heightCm: nextProfile.heightCm,
                weightKg: nextProfile.weightKg,
                stepGoal: nextProfile.stepGoal
            });
        });

        update();

        return this.getProfile(userId);
    }
}
