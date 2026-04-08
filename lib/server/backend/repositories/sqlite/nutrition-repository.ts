import type { NutritionRepository } from '../contracts';
import type { UpdateNutritionDayInput } from '../../types';
import { createId, ensureScaffoldForDate, getSqliteRepositoryDatabase, toIsoDate } from './shared';

export class SqliteNutritionRepository implements NutritionRepository {
    async getNutritionDay(userId: string, date: string) {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);

        const targets = db
            .prepare(`
                SELECT calories_target, protein_target, carbs_target, fats_target
                FROM daily_nutrition_targets
                WHERE user_id = ? AND date = ?
            `)
            .get(userId, normalizedDate) as {
            calories_target: number;
            protein_target: number;
            carbs_target: number;
            fats_target: number;
        };

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

        return {
            date: normalizedDate,
            calories: { key: 'calories' as const, current: totals.calories_current, target: targets.calories_target, unit: 'kcal' },
            protein: { key: 'protein' as const, current: totals.protein_current, target: targets.protein_target, unit: 'g' },
            carbs: { key: 'carbs' as const, current: totals.carbs_current, target: targets.carbs_target, unit: 'g' },
            fats: { key: 'fats' as const, current: totals.fats_current, target: targets.fats_target, unit: 'g' }
        };
    }

    async updateNutritionDay(userId: string, date: string, input: UpdateNutritionDayInput) {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);
        const current = await this.getNutritionDay(userId, normalizedDate);

        db.prepare(`
            UPDATE daily_nutrition_targets
            SET calories_target = @caloriesTarget,
                protein_target = @proteinTarget,
                carbs_target = @carbsTarget,
                fats_target = @fatsTarget,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = @userId AND date = @date
        `).run({
            userId,
            date: normalizedDate,
            caloriesTarget: input.caloriesTarget ?? current.calories.target,
            proteinTarget: input.proteinTarget ?? current.protein.target,
            carbsTarget: input.carbsTarget ?? current.carbs.target,
            fatsTarget: input.fatsTarget ?? current.fats.target
        });

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
