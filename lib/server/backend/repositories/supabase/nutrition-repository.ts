import type { SupabaseClient } from '@supabase/supabase-js';
import type { NutritionRepository } from '../contracts';
import type { UpdateNutritionDayInput } from '../../types';
import { getAutoNutritionTargets } from '../../nutrition-targets';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';

type NutritionTotalsRow = {
    calories_current: number;
    protein_current: number;
    carbs_current: number;
    fats_current: number;
};

type ProfileMetricsRow = {
    id: string;
    email: string | null;
    display_name: string;
    avatar_url: string | null;
    user_metrics:
        | {
              age: number | null;
              biological_sex: 'male' | 'female' | null;
              primary_goal: string;
              height_cm: number | null;
              weight_kg: number | null;
              desired_weight_kg: number | null;
              gym_sessions_per_week: number | null;
              step_goal: number | null;
          }
        | null;
};

function mapProfileRow(row: ProfileMetricsRow) {
    const metrics = row.user_metrics;

    if (!metrics) {
        throw new Error('Profile metrics missing');
    }

    return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        age: metrics.age,
        biologicalSex: metrics.biological_sex,
        primaryGoal: metrics.primary_goal as any,
        heightCm: metrics.height_cm,
        weightKg: metrics.weight_kg,
        desiredWeightKg: metrics.desired_weight_kg,
        gymSessionsPerWeek: metrics.gym_sessions_per_week,
        stepGoal: metrics.step_goal
    };
}

function isMissingSchemaError(error: { message?: string } | null): boolean {
    if (!error?.message) {
        return false;
    }

    return error.message.includes('does not exist') || error.message.includes('schema cache') || error.message.includes('Could not find the');
}

export class SupabaseNutritionRepository implements NutritionRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getNutritionDay(userId: string, date: string) {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);

        const totalsResult = await this.client
            .from('daily_nutrition_totals')
            .select('calories_current,protein_current,carbs_current,fats_current')
            .eq('user_id', userId)
            .eq('date', normalizedDate)
            .single();
        const totals = requireSupabaseOk(totalsResult as any, 'Nutrition totals not found') as NutritionTotalsRow;
        const profileResult = await this.client
            .from('users')
            .select('id,email,display_name,avatar_url,user_metrics ( age, biological_sex, primary_goal, height_cm, weight_kg, desired_weight_kg, gym_sessions_per_week, step_goal )')
            .eq('id', userId)
            .single();
        const fallbackProfileResult = isMissingSchemaError(profileResult.error)
            ? await this.client
                  .from('users')
                  .select('id,email,display_name,avatar_url,user_metrics ( age, primary_goal, height_cm, weight_kg, step_goal )')
                  .eq('id', userId)
                  .single()
            : profileResult;
        const profile = mapProfileRow(requireSupabaseOk(fallbackProfileResult as any, 'Profile not found') as ProfileMetricsRow);
        const targets = getAutoNutritionTargets(profile);

        return {
            date: normalizedDate,
            calories: { key: 'calories' as const, current: totals.calories_current, target: targets.caloriesTarget, unit: 'kcal' },
            protein: { key: 'protein' as const, current: totals.protein_current, target: targets.proteinTarget, unit: 'g' },
            carbs: { key: 'carbs' as const, current: totals.carbs_current, target: targets.carbsTarget, unit: 'g' },
            fats: { key: 'fats' as const, current: totals.fats_current, target: targets.fatsTarget, unit: 'g' }
        };
    }

    async updateNutritionDay(userId: string, date: string, input: UpdateNutritionDayInput) {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);
        const current = await this.getNutritionDay(userId, normalizedDate);

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
