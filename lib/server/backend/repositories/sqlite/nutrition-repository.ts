import type { NutritionRepository } from '../contracts';
import type { UpdateNutritionDayInput } from '../../types';
import { getAutoNutritionTargets } from '../../nutrition-targets';
import {
    ensureScaffoldForDate,
    getSqliteRepositoryDatabase,
    mapProfileRow,
    toIsoDate
} from './shared';

export class SqliteNutritionRepository implements NutritionRepository {
    async getNutritionDay(userId: string, date: string) {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);

        const totals = db
            .prepare(`
                SELECT calories_current, protein_current, carbs_current, fats_current
                FROM daily_nutrition_totals
                WHERE user_id = ? AND date = ?
            `)
            .get(userId, normalizedDate) as {
            calories_current: number;
            protein_current: number;
            carbs_current: number;
            fats_current: number;
        };
        const profileRow = db
            .prepare(`
                SELECT
                    users.id,
                    users.email,
                    users.display_name,
                    users.avatar_url,
                    user_metrics.age,
                    user_metrics.biological_sex,
                    user_metrics.primary_goal,
                    user_metrics.height_cm,
                    user_metrics.weight_kg,
                    user_metrics.desired_weight_kg,
                    user_metrics.gym_sessions_per_week,
                    user_metrics.step_goal
                FROM users
                INNER JOIN user_metrics ON user_metrics.user_id = users.id
                WHERE users.id = ?
            `)
            .get(userId);
        if (!profileRow) {
            throw new Error(`Profile not found for user ${userId}`);
        }
        const targets = getAutoNutritionTargets(mapProfileRow(profileRow as never));

        return {
            date: normalizedDate,
            calories: { key: 'calories' as const, current: totals.calories_current, target: targets.caloriesTarget, unit: 'kcal' },
            protein: { key: 'protein' as const, current: totals.protein_current, target: targets.proteinTarget, unit: 'g' },
            carbs: { key: 'carbs' as const, current: totals.carbs_current, target: targets.carbsTarget, unit: 'g' },
            fats: { key: 'fats' as const, current: totals.fats_current, target: targets.fatsTarget, unit: 'g' }
        };
    }

    async updateNutritionDay(userId: string, date: string, input: UpdateNutritionDayInput) {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);
        const current = await this.getNutritionDay(userId, normalizedDate);

        db.prepare(`
            UPDATE daily_nutrition_totals
            SET calories_current = @caloriesCurrent,
                protein_current = @proteinCurrent,
                carbs_current = @carbsCurrent,
                fats_current = @fatsCurrent,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = @userId AND date = @date
        `).run({
            userId,
            date: normalizedDate,
            caloriesCurrent: input.caloriesCurrent ?? current.calories.current,
            proteinCurrent: input.proteinCurrent ?? current.protein.current,
            carbsCurrent: input.carbsCurrent ?? current.carbs.current,
            fatsCurrent: input.fatsCurrent ?? current.fats.current
        });

        return this.getNutritionDay(userId, normalizedDate);
    }
}
