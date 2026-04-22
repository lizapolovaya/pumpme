import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_LOCAL_USER_ID } from '../../context';

const DEFAULT_AVATAR_URL =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBXb6bQ_6pGK2QytE71viNJV7IVFABH_L7U4x8FcpFvOqHCQ9OxgKk1xBZQQZK-HGl_k1N_vfKdaaoc95JBGZXRfAO6x5Pa5XEUfuRV5jZCSAwxTZwt7h3SXMR9gpnY0sP_O5tKTUCnCqJyYBX9OVIUYHjWTTu1cfHJfQdUF6K70u1VYb720azdtT9BGxtdaIv3nUcw0kXZGwkWN0FCpwweKFzzvaC8MKFTwEI83Vt74SaRgemweAt0gDoBUwMHu2N__xU6IZLiEBnR';

const DEFAULT_EXERCISES = [
    { id: 'exercise-bench-press', name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell' },
    {
        id: 'exercise-tricep-pushdowns',
        name: 'Tricep Pushdowns',
        muscleGroup: 'triceps',
        equipment: 'cable'
    },
    {
        id: 'exercise-incline-bench-press',
        name: 'Incline Bench Press',
        muscleGroup: 'upper-chest',
        equipment: 'barbell'
    },
    { id: 'exercise-weighted-dips', name: 'Weighted Dips', muscleGroup: 'triceps', equipment: 'bodyweight' },
    { id: 'exercise-lateral-raises', name: 'Lateral Raises', muscleGroup: 'shoulders', equipment: 'dumbbell' },
    { id: 'exercise-lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable' },
    { id: 'exercise-seated-row', name: 'Seated Row', muscleGroup: 'back', equipment: 'cable' },
    { id: 'exercise-bicep-curl', name: 'Bicep Curl', muscleGroup: 'biceps', equipment: 'dumbbell' }
] as const;

const DEFAULT_TEMPLATES = [
    {
        id: 'template-chest-triceps',
        name: 'Chest & Triceps',
        focus: 'Upper Body Push',
        exercises: [
            { id: 'template-exercise-bench-press', exerciseId: 'exercise-bench-press', exerciseName: 'Bench Press' },
            {
                id: 'template-exercise-tricep-pushdowns',
                exerciseId: 'exercise-tricep-pushdowns',
                exerciseName: 'Tricep Pushdowns'
            }
        ]
    },
    {
        id: 'template-pull-day',
        name: 'Pull Day',
        focus: 'Back & Biceps Focus',
        exercises: [
            { id: 'template-exercise-lat-pulldown', exerciseId: 'exercise-lat-pulldown', exerciseName: 'Lat Pulldown' },
            { id: 'template-exercise-seated-row', exerciseId: 'exercise-seated-row', exerciseName: 'Seated Row' },
            { id: 'template-exercise-bicep-curl', exerciseId: 'exercise-bicep-curl', exerciseName: 'Bicep Curl' }
        ]
    }
] as const;

export function createId(prefix: string): string {
    return `${prefix}-${randomUUID()}`;
}

export function toIsoDate(value: Date | string): string {
    if (typeof value === 'string') {
        return value;
    }

    return value.toISOString().slice(0, 10);
}

function stableDailyId(prefix: string, userId: string, date: string): string {
    return `${prefix}-${userId}-${date}`;
}

function isMissingSupabaseColumnOrTable(error: { message?: string } | null): boolean {
    if (!error?.message) {
        return false;
    }

    return (
        error.message.includes('Could not find the') ||
        error.message.includes('does not exist') ||
        error.message.includes('column') ||
        error.message.includes('schema cache')
    );
}

export async function ensureUserScaffold(client: SupabaseClient, userId: string): Promise<void> {
    const userRow = {
        id: userId,
        email: 'alex.rivers@email.com',
        display_name: userId === DEFAULT_LOCAL_USER_ID ? 'Alex Rivers' : 'PumpMe User',
        avatar_url: DEFAULT_AVATAR_URL
    };

    const userResult = await client.from('users').upsert(userRow, {
        onConflict: 'id',
        ignoreDuplicates: true
    });
    if (userResult.error) {
        throw userResult.error;
    }

    const prefsResult = await client.from('user_preferences').upsert(
        {
            user_id: userId,
            unit_system: 'metric',
            food_database_region: 'US',
            theme_mode: 'dark'
        },
        {
            onConflict: 'user_id',
            ignoreDuplicates: true
        }
    );
    if (prefsResult.error) {
        throw prefsResult.error;
    }

    let metricsResult = await client.from('user_metrics').upsert(
        {
            user_id: userId,
            age: 28,
            biological_sex: 'male',
            primary_goal: 'muscle_gain',
            height_cm: 180,
            weight_kg: 82,
            desired_weight_kg: 85,
            gym_sessions_per_week: 4,
            step_goal: 10000
        },
        {
            onConflict: 'user_id',
            ignoreDuplicates: true
        }
    );
    if (isMissingSupabaseColumnOrTable(metricsResult.error)) {
        metricsResult = await client.from('user_metrics').upsert(
            {
                user_id: userId,
                age: 28,
                primary_goal: 'muscle_gain',
                height_cm: 180,
                weight_kg: 82,
                step_goal: 10000
            },
            {
                onConflict: 'user_id',
                ignoreDuplicates: true
            }
        );
    }
    if (metricsResult.error) {
        throw metricsResult.error;
    }

}

export async function ensureExerciseCatalog(client: SupabaseClient): Promise<void> {
    const rows = DEFAULT_EXERCISES.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        muscle_group: exercise.muscleGroup,
        equipment: exercise.equipment
    }));

    const result = await client.from('exercise_definitions').upsert(rows, { onConflict: 'id' });
    if (result.error) {
        throw result.error;
    }
}

export async function ensureDefaultTemplates(client: SupabaseClient, userId: string): Promise<void> {
    await ensureUserScaffold(client, userId);
    await ensureExerciseCatalog(client);

    const templatesResult = await client.from('workout_templates').upsert(
        DEFAULT_TEMPLATES.map((template) => ({
            id: template.id,
            user_id: userId,
            name: template.name,
            focus: template.focus
        })),
        {
            onConflict: 'id',
            ignoreDuplicates: true
        }
    );
    if (templatesResult.error) {
        throw templatesResult.error;
    }

    const templateExerciseRows = DEFAULT_TEMPLATES.flatMap((template) =>
        template.exercises.map((exercise, index) => ({
            id: exercise.id,
            template_id: template.id,
            exercise_id: exercise.exerciseId,
            exercise_name: exercise.exerciseName,
            sort_order: index + 1
        }))
    );

    const templateExercisesResult = await client
        .from('template_exercises')
        .upsert(templateExerciseRows, { onConflict: 'id', ignoreDuplicates: true });
    if (templateExercisesResult.error) {
        throw templateExercisesResult.error;
    }
}

export async function ensureDailyScaffold(client: SupabaseClient, userId: string, date: string): Promise<void> {
    await ensureUserScaffold(client, userId);

    const readinessResult = await client.from('daily_readiness').upsert(
        {
            id: stableDailyId('readiness', userId, date),
            user_id: userId,
            date,
            score: 82,
            band: 'excellent',
            headline: 'Excellent',
            summary: 'Your CNS is fully recovered. Optimal for high-intensity training today.'
        },
        {
            onConflict: 'user_id,date',
            ignoreDuplicates: true
        }
    );
    if (readinessResult.error) {
        throw readinessResult.error;
    }

    const targetsResult = await client.from('daily_nutrition_targets').upsert(
        {
            id: stableDailyId('nutrition-targets', userId, date),
            user_id: userId,
            date,
            calories_target: 4890,
            protein_target: 180,
            carbs_target: 350,
            fats_target: 75
        },
        {
            onConflict: 'user_id,date',
            ignoreDuplicates: true
        }
    );
    if (targetsResult.error) {
        throw targetsResult.error;
    }

    const totalsResult = await client.from('daily_nutrition_totals').upsert(
        {
            id: stableDailyId('nutrition-totals', userId, date),
            user_id: userId,
            date,
            calories_current: 2440,
            protein_current: 145,
            carbs_current: 210,
            fats_current: 52
        },
        {
            onConflict: 'user_id,date',
            ignoreDuplicates: true
        }
    );
    if (totalsResult.error) {
        throw totalsResult.error;
    }

    const activityResult = await client.from('activity_daily_summaries').upsert(
        {
            id: stableDailyId('activity', userId, date),
            user_id: userId,
            date,
            steps: 8500,
            active_minutes: 74
        },
        {
            onConflict: 'user_id,date',
            ignoreDuplicates: true
        }
    );
    if (activityResult.error) {
        throw activityResult.error;
    }
}

export async function ensureScaffoldForDate(client: SupabaseClient, userId: string, date: string): Promise<void> {
    await ensureDefaultTemplates(client, userId);
    await ensureDailyScaffold(client, userId, date);
}
