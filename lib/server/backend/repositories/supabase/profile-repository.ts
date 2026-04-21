import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileRepository } from '../contracts';
import type { UpdateProfileInput } from '../../types';
import { ensureUserScaffold } from './shared';
import { requireSupabaseOk } from './client';

type ProfileRow = {
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
        | Array<{
              age: number | null;
              biological_sex: 'male' | 'female' | null;
              primary_goal: string;
              height_cm: number | null;
              weight_kg: number | null;
              desired_weight_kg: number | null;
              gym_sessions_per_week: number | null;
              step_goal: number | null;
          }>
        | null;
};

function mapProfileRow(row: ProfileRow) {
    const metrics = Array.isArray(row.user_metrics) ? row.user_metrics[0] : row.user_metrics;
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

    return error.message.includes('does not exist') || error.message.includes('schema cache');
}

export class SupabaseProfileRepository implements ProfileRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getProfile(userId: string) {
        await ensureUserScaffold(this.client, userId);

        const result = await this.client
            .from('users')
            .select('id,email,display_name,avatar_url,user_metrics ( age, biological_sex, primary_goal, height_cm, weight_kg, desired_weight_kg, gym_sessions_per_week, step_goal )')
            .eq('id', userId)
            .single();
        const fallbackResult = isMissingSchemaError(result.error)
            ? await this.client
                  .from('users')
                  .select('id,email,display_name,avatar_url,user_metrics ( age, primary_goal, height_cm, weight_kg, step_goal )')
                  .eq('id', userId)
                  .single()
            : result;

        const row = requireSupabaseOk(fallbackResult as any, `Profile not found for user ${userId}`) as ProfileRow;
        return mapProfileRow(row);
    }

    async updateProfile(userId: string, input: UpdateProfileInput) {
        await ensureUserScaffold(this.client, userId);
        const current = await this.getProfile(userId);
        const nextProfile = {
            displayName: input.displayName ?? current.displayName,
            avatarUrl: input.avatarUrl === undefined ? current.avatarUrl : input.avatarUrl,
            age: input.age === undefined ? current.age : input.age,
            biologicalSex: input.biologicalSex === undefined ? current.biologicalSex : input.biologicalSex,
            primaryGoal: input.primaryGoal ?? current.primaryGoal,
            heightCm: input.heightCm === undefined ? current.heightCm : input.heightCm,
            weightKg: input.weightKg === undefined ? current.weightKg : input.weightKg,
            desiredWeightKg: input.desiredWeightKg === undefined ? current.desiredWeightKg : input.desiredWeightKg,
            gymSessionsPerWeek: input.gymSessionsPerWeek === undefined ? current.gymSessionsPerWeek : input.gymSessionsPerWeek,
            stepGoal: input.stepGoal === undefined ? current.stepGoal : input.stepGoal
        };

        const userUpdate = await this.client
            .from('users')
            .update({
                display_name: nextProfile.displayName,
                avatar_url: nextProfile.avatarUrl
            })
            .eq('id', userId);
        if (userUpdate.error) {
            throw userUpdate.error;
        }

        let metricsUpdate = await this.client
            .from('user_metrics')
            .update({
                age: nextProfile.age,
                biological_sex: nextProfile.biologicalSex,
                primary_goal: nextProfile.primaryGoal,
                height_cm: nextProfile.heightCm,
                weight_kg: nextProfile.weightKg,
                desired_weight_kg: nextProfile.desiredWeightKg,
                gym_sessions_per_week: nextProfile.gymSessionsPerWeek,
                step_goal: nextProfile.stepGoal
            })
            .eq('user_id', userId);
        if (isMissingSchemaError(metricsUpdate.error)) {
            metricsUpdate = await this.client
                .from('user_metrics')
                .update({
                    age: nextProfile.age,
                    primary_goal: nextProfile.primaryGoal,
                    height_cm: nextProfile.heightCm,
                    weight_kg: nextProfile.weightKg,
                    step_goal: nextProfile.stepGoal
                })
                .eq('user_id', userId);
        }
        if (metricsUpdate.error) {
            throw metricsUpdate.error;
        }

        return this.getProfile(userId);
    }
}
