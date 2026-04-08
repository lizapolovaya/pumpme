import type { PreferencesRepository } from '../contracts';
import type { UpdatePreferencesInput } from '../../types';
import { ensureUserScaffold, getSqliteRepositoryDatabase, mapPreferencesRow } from './shared';

export class SqlitePreferencesRepository implements PreferencesRepository {
    async getPreferences(userId: string) {
        const db = getSqliteRepositoryDatabase();
        ensureUserScaffold(db, userId);

        const row = db
            .prepare(`
                SELECT unit_system, food_database_region, theme_mode
                FROM user_preferences
                WHERE user_id = ?
            `)
            .get(userId);

        if (!row) {
            throw new Error(`Preferences not found for user ${userId}`);
        }

        return mapPreferencesRow(row as ReturnType<typeof db.prepare> extends never ? never : any);
    }

    async updatePreferences(userId: string, input: UpdatePreferencesInput) {
        const db = getSqliteRepositoryDatabase();
        ensureUserScaffold(db, userId);

        const current = await this.getPreferences(userId);
        const nextPreferences = {
            unitSystem: input.unitSystem ?? current.unitSystem,
            foodDatabaseRegion: input.foodDatabaseRegion ?? current.foodDatabaseRegion
        };

        db.prepare(`
            UPDATE user_preferences
            SET unit_system = @unitSystem,
                food_database_region = @foodDatabaseRegion,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = @userId
        `).run({
            userId,
            unitSystem: nextPreferences.unitSystem,
            foodDatabaseRegion: nextPreferences.foodDatabaseRegion
        });

        return this.getPreferences(userId);
    }
}
