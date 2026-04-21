import type { NutritionRepository } from '../contracts';
import type {
    NutritionSettingsDto,
    UpdateNutritionDayInput,
    UpdateNutritionSettingsInput
} from '../../types';
import { getEffectiveNutritionTargets } from '../../nutrition-targets';
import {
    ensureScaffoldForDate,
    getSqliteRepositoryDatabase,
    mapNutritionSettingsRow,
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
        const settings = await this.getNutritionSettings(userId);
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
        const targets = getEffectiveNutritionTargets(mapProfileRow(profileRow as never), settings);

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

    async getNutritionSettings(userId: string): Promise<NutritionSettingsDto> {
        const db = getSqliteRepositoryDatabase();
        ensureScaffoldForDate(db, userId, toIsoDate(new Date()));
        const row = db
            .prepare(`
                SELECT target_mode, manual_calories_target, manual_protein_target, manual_carbs_target, manual_fats_target
                FROM user_nutrition_settings
                WHERE user_id = ?
            `)
            .get(userId);

        if (!row) {
            throw new Error(`Nutrition settings not found for user ${userId}`);
        }

        return mapNutritionSettingsRow(row as never);
    }

    async updateNutritionSettings(userId: string, input: UpdateNutritionSettingsInput): Promise<NutritionSettingsDto> {
        const db = getSqliteRepositoryDatabase();
        ensureScaffoldForDate(db, userId, toIsoDate(new Date()));
        const current = await this.getNutritionSettings(userId);

        db.prepare(`
            UPDATE user_nutrition_settings
            SET target_mode = @targetMode,
                manual_calories_target = @manualCaloriesTarget,
                manual_protein_target = @manualProteinTarget,
                manual_carbs_target = @manualCarbsTarget,
                manual_fats_target = @manualFatsTarget,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = @userId
        `).run({
            userId,
            targetMode: input.targetMode ?? current.targetMode,
            manualCaloriesTarget:
                input.manualCaloriesTarget === undefined ? current.manualCaloriesTarget : input.manualCaloriesTarget,
            manualProteinTarget:
                input.manualProteinTarget === undefined ? current.manualProteinTarget : input.manualProteinTarget,
            manualCarbsTarget: input.manualCarbsTarget === undefined ? current.manualCarbsTarget : input.manualCarbsTarget,
            manualFatsTarget: input.manualFatsTarget === undefined ? current.manualFatsTarget : input.manualFatsTarget
        });

        return this.getNutritionSettings(userId);
    }
}
