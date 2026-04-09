import type { SupabaseClient } from '@supabase/supabase-js';
import type { NutritionRepository } from '../contracts';
import type { UpdateNutritionDayInput } from '../../types';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';

type NutritionTargetsRow = {
    calories_target: number;
    protein_target: number;
    carbs_target: number;
    fats_target: number;
};

type NutritionTotalsRow = {
    calories_current: number;
    protein_current: number;
    carbs_current: number;
    fats_current: number;
};

export class SupabaseNutritionRepository implements NutritionRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getNutritionDay(userId: string, date: string) {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);

        const targetsResult = await this.client
            .from('daily_nutrition_targets')
            .select('calories_target,protein_target,carbs_target,fats_target')
            .eq('user_id', userId)
            .eq('date', normalizedDate)
            .single();
        const targets = requireSupabaseOk(targetsResult as any, 'Nutrition targets not found') as NutritionTargetsRow;

        const totalsResult = await this.client
            .from('daily_nutrition_totals')
            .select('calories_current,protein_current,carbs_current,fats_current')
            .eq('user_id', userId)
            .eq('date', normalizedDate)
            .single();
        const totals = requireSupabaseOk(totalsResult as any, 'Nutrition totals not found') as NutritionTotalsRow;

        return {
            date: normalizedDate,
            calories: { key: 'calories' as const, current: totals.calories_current, target: targets.calories_target, unit: 'kcal' },
            protein: { key: 'protein' as const, current: totals.protein_current, target: targets.protein_target, unit: 'g' },
            carbs: { key: 'carbs' as const, current: totals.carbs_current, target: targets.carbs_target, unit: 'g' },
            fats: { key: 'fats' as const, current: totals.fats_current, target: targets.fats_target, unit: 'g' }
        };
    }

    async updateNutritionDay(userId: string, date: string, input: UpdateNutritionDayInput) {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);
        const current = await this.getNutritionDay(userId, normalizedDate);

        const targetsUpdate = await this.client
            .from('daily_nutrition_targets')
            .update({
                calories_target: input.caloriesTarget ?? current.calories.target,
                protein_target: input.proteinTarget ?? current.protein.target,
                carbs_target: input.carbsTarget ?? current.carbs.target,
                fats_target: input.fatsTarget ?? current.fats.target
            })
            .eq('user_id', userId)
            .eq('date', normalizedDate);
        if (targetsUpdate.error) {
            throw targetsUpdate.error;
        }

        const totalsUpdate = await this.client
            .from('daily_nutrition_totals')
            .update({
                calories_current: input.caloriesCurrent ?? current.calories.current,
                protein_current: input.proteinCurrent ?? current.protein.current,
                carbs_current: input.carbsCurrent ?? current.carbs.current,
                fats_current: input.fatsCurrent ?? current.fats.current
            })
            .eq('user_id', userId)
            .eq('date', normalizedDate);
        if (totalsUpdate.error) {
            throw totalsUpdate.error;
        }

        return this.getNutritionDay(userId, normalizedDate);
    }
}
