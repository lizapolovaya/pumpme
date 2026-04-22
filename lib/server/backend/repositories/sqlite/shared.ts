import type Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { getDatabase } from '../../db';
import type {
    BiologicalSex,
    PreferencesDto,
    PrimaryGoal,
    ProfileDto,
    UnitSystem
} from '../../types';
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

type ProfileRow = {
    id: string;
    email: string | null;
    display_name: string;
    avatar_url: string | null;
    age: number | null;
    biological_sex: BiologicalSex | null;
    primary_goal: PrimaryGoal;
    height_cm: number | null;
    weight_kg: number | null;
    desired_weight_kg: number | null;
    gym_sessions_per_week: number | null;
    step_goal: number | null;
};

type PreferencesRow = {
    unit_system: UnitSystem;
    food_database_region: string;
    theme_mode: 'dark';
};

export function createId(prefix: string): string {
    return `${prefix}-${randomUUID()}`;
}

export function toIsoDate(value: Date | string): string {
    if (typeof value === 'string') {
        return value;
    }

    return value.toISOString().slice(0, 10);
}

export function getSqliteRepositoryDatabase(): Database.Database {
    return getDatabase();
}

export function ensureUserScaffold(db: Database.Database, userId: string): void {
    const insertUser = db.prepare(`
        INSERT INTO users (id, email, display_name, avatar_url)
        VALUES (@id, @email, @displayName, @avatarUrl)
        ON CONFLICT(id) DO NOTHING
    `);

    const insertPreferences = db.prepare(`
        INSERT INTO user_preferences (user_id, unit_system, food_database_region, theme_mode)
        VALUES (@userId, @unitSystem, @foodDatabaseRegion, @themeMode)
        ON CONFLICT(user_id) DO NOTHING
    `);

    const insertMetrics = db.prepare(`
        INSERT INTO user_metrics (user_id, age, biological_sex, primary_goal, height_cm, weight_kg, desired_weight_kg, gym_sessions_per_week, step_goal)
        VALUES (@userId, @age, @biologicalSex, @primaryGoal, @heightCm, @weightKg, @desiredWeightKg, @gymSessionsPerWeek, @stepGoal)
        ON CONFLICT(user_id) DO NOTHING
    `);

    const seed = db.transaction(() => {
        insertUser.run({
            id: userId,
            email: 'alex.rivers@email.com',
            displayName: userId === DEFAULT_LOCAL_USER_ID ? 'Alex Rivers' : 'PumpMe User',
            avatarUrl: DEFAULT_AVATAR_URL
        });

        insertPreferences.run({
            userId,
            unitSystem: 'metric',
            foodDatabaseRegion: 'US',
            themeMode: 'dark'
        });

        insertMetrics.run({
            userId,
            age: 28,
            biologicalSex: 'male',
            primaryGoal: 'muscle_gain',
            heightCm: 180,
            weightKg: 82,
            desiredWeightKg: 85,
            gymSessionsPerWeek: 4,
            stepGoal: 10000
        });
    });

    seed();
}

export function ensureExerciseCatalog(db: Database.Database): void {
    const insertExercise = db.prepare(`
        INSERT INTO exercise_definitions (id, name, muscle_group, equipment)
        VALUES (@id, @name, @muscleGroup, @equipment)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            muscle_group = excluded.muscle_group,
            equipment = excluded.equipment,
            updated_at = CURRENT_TIMESTAMP
    `);

    const seedCatalog = db.transaction(() => {
        for (const exercise of DEFAULT_EXERCISES) {
            insertExercise.run(exercise);
        }
    });

    seedCatalog();
}

export function ensureDefaultTemplates(db: Database.Database, userId: string): void {
    ensureUserScaffold(db, userId);
    ensureExerciseCatalog(db);

    const insertTemplate = db.prepare(`
        INSERT INTO workout_templates (id, user_id, name, focus)
        VALUES (@id, @userId, @name, @focus)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            focus = excluded.focus,
            updated_at = CURRENT_TIMESTAMP
    `);

    const insertTemplateExercise = db.prepare(`
        INSERT INTO template_exercises (id, template_id, exercise_id, exercise_name, sort_order)
        VALUES (@id, @templateId, @exerciseId, @exerciseName, @sortOrder)
        ON CONFLICT(id) DO UPDATE SET
            exercise_id = excluded.exercise_id,
            exercise_name = excluded.exercise_name,
            sort_order = excluded.sort_order,
            updated_at = CURRENT_TIMESTAMP
    `);

    const seedTemplates = db.transaction(() => {
        for (const template of DEFAULT_TEMPLATES) {
            insertTemplate.run({
                id: template.id,
                userId,
                name: template.name,
                focus: template.focus
            });

            template.exercises.forEach((exercise, index) => {
                insertTemplateExercise.run({
                    id: exercise.id,
                    templateId: template.id,
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    sortOrder: index + 1
                });
            });
        }
    });

    seedTemplates();
}

export function ensureDailyScaffold(db: Database.Database, userId: string, date: string): void {
    const insertReadiness = db.prepare(`
        INSERT INTO daily_readiness (id, user_id, date, score, band, headline, summary)
        VALUES (@id, @userId, @date, @score, @band, @headline, @summary)
        ON CONFLICT(user_id, date) DO NOTHING
    `);

    const insertNutritionTargets = db.prepare(`
        INSERT INTO daily_nutrition_targets (id, user_id, date, calories_target, protein_target, carbs_target, fats_target)
        VALUES (@id, @userId, @date, @caloriesTarget, @proteinTarget, @carbsTarget, @fatsTarget)
        ON CONFLICT(user_id, date) DO NOTHING
    `);

    const insertNutritionTotals = db.prepare(`
        INSERT INTO daily_nutrition_totals (id, user_id, date, calories_current, protein_current, carbs_current, fats_current)
        VALUES (@id, @userId, @date, @caloriesCurrent, @proteinCurrent, @carbsCurrent, @fatsCurrent)
        ON CONFLICT(user_id, date) DO NOTHING
    `);

    const insertActivity = db.prepare(`
        INSERT INTO activity_daily_summaries (id, user_id, date, steps, active_minutes)
        VALUES (@id, @userId, @date, @steps, @activeMinutes)
        ON CONFLICT(user_id, date) DO NOTHING
    `);

    const seedDaily = db.transaction(() => {
        insertReadiness.run({
            id: createId('readiness'),
            userId,
            date,
            score: 82,
            band: 'excellent',
            headline: 'Excellent',
            summary: 'Your CNS is fully recovered. Optimal for high-intensity training today.'
        });

        insertNutritionTargets.run({
            id: createId('nutrition-targets'),
            userId,
            date,
            caloriesTarget: 4890,
            proteinTarget: 180,
            carbsTarget: 350,
            fatsTarget: 75
        });

        insertNutritionTotals.run({
            id: createId('nutrition-totals'),
            userId,
            date,
            caloriesCurrent: 2440,
            proteinCurrent: 145,
            carbsCurrent: 210,
            fatsCurrent: 52
        });

        insertActivity.run({
            id: createId('activity'),
            userId,
            date,
            steps: 8500,
            activeMinutes: 74
        });
    });

    seedDaily();
}

export function ensureScaffoldForDate(db: Database.Database, userId: string, date: string): void {
    ensureUserScaffold(db, userId);
    ensureDefaultTemplates(db, userId);
    ensureDailyScaffold(db, userId, date);
}

export function mapProfileRow(row: ProfileRow): ProfileDto {
    return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        age: row.age,
        biologicalSex: row.biological_sex,
        primaryGoal: row.primary_goal,
        heightCm: row.height_cm,
        weightKg: row.weight_kg,
        desiredWeightKg: row.desired_weight_kg,
        gymSessionsPerWeek: row.gym_sessions_per_week,
        stepGoal: row.step_goal
    };
}

export function mapPreferencesRow(row: PreferencesRow): PreferencesDto {
    return {
        unitSystem: row.unit_system,
        foodDatabaseRegion: row.food_database_region,
        themeMode: row.theme_mode
    };
}
