type Migration = {
    id: string;
    sql: string;
};

export const SQLITE_MIGRATIONS: readonly Migration[] = [
    {
        id: '0001_initial_schema',
        sql: `
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id TEXT PRIMARY KEY,
                applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT,
                display_name TEXT NOT NULL,
                avatar_url TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id TEXT PRIMARY KEY,
                unit_system TEXT NOT NULL DEFAULT 'metric',
                food_database_region TEXT NOT NULL DEFAULT 'US',
                theme_mode TEXT NOT NULL DEFAULT 'dark',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS user_metrics (
                user_id TEXT PRIMARY KEY,
                age INTEGER,
                biological_sex TEXT,
                primary_goal TEXT NOT NULL DEFAULT 'athleticism',
                height_cm REAL,
                weight_kg REAL,
                desired_weight_kg REAL,
                gym_sessions_per_week INTEGER,
                step_goal INTEGER,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS user_nutrition_settings (
                user_id TEXT PRIMARY KEY,
                target_mode TEXT NOT NULL DEFAULT 'auto',
                manual_calories_target REAL,
                manual_protein_target REAL,
                manual_carbs_target REAL,
                manual_fats_target REAL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS exercise_definitions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                muscle_group TEXT,
                equipment TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS workout_templates (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                focus TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS template_exercises (
                id TEXT PRIMARY KEY,
                template_id TEXT NOT NULL,
                exercise_id TEXT NOT NULL,
                exercise_name TEXT NOT NULL,
                sort_order INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercise_definitions(id) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS workout_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                template_id TEXT,
                date TEXT NOT NULL,
                title TEXT NOT NULL,
                focus TEXT,
                status TEXT NOT NULL,
                duration_minutes INTEGER,
                total_volume_kg REAL,
                estimated_burn_kcal REAL,
                notes TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS workout_session_exercises (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                exercise_id TEXT NOT NULL,
                exercise_name TEXT NOT NULL,
                sort_order INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercise_definitions(id) ON DELETE RESTRICT
            );

            CREATE TABLE IF NOT EXISTS workout_sets (
                id TEXT PRIMARY KEY,
                session_exercise_id TEXT NOT NULL,
                sort_order INTEGER NOT NULL,
                weight_kg REAL,
                reps INTEGER,
                rpe REAL,
                completed INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_exercise_id) REFERENCES workout_session_exercises(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS daily_readiness (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                score INTEGER,
                band TEXT NOT NULL DEFAULT 'moderate',
                headline TEXT NOT NULL,
                summary TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (user_id, date)
            );

            CREATE TABLE IF NOT EXISTS daily_nutrition_targets (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                calories_target REAL NOT NULL DEFAULT 0,
                protein_target REAL NOT NULL DEFAULT 0,
                carbs_target REAL NOT NULL DEFAULT 0,
                fats_target REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (user_id, date)
            );

            CREATE TABLE IF NOT EXISTS daily_nutrition_totals (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                calories_current REAL NOT NULL DEFAULT 0,
                protein_current REAL NOT NULL DEFAULT 0,
                carbs_current REAL NOT NULL DEFAULT 0,
                fats_current REAL NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (user_id, date)
            );

            CREATE TABLE IF NOT EXISTS activity_daily_summaries (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                date TEXT NOT NULL,
                steps INTEGER NOT NULL DEFAULT 0,
                active_minutes INTEGER,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE (user_id, date)
            );

            CREATE TABLE IF NOT EXISTS personal_records (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                exercise_id TEXT NOT NULL,
                metric_key TEXT NOT NULL,
                metric_value REAL NOT NULL,
                achieved_at TEXT NOT NULL,
                source_session_id TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercise_definitions(id) ON DELETE RESTRICT,
                FOREIGN KEY (source_session_id) REFERENCES workout_sessions(id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON workout_templates(user_id);
            CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON template_exercises(template_id);
            CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date);
            CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_session_id ON workout_session_exercises(session_id);
            CREATE INDEX IF NOT EXISTS idx_workout_sets_session_exercise_id ON workout_sets(session_exercise_id);
            CREATE INDEX IF NOT EXISTS idx_daily_readiness_user_date ON daily_readiness(user_id, date);
            CREATE INDEX IF NOT EXISTS idx_daily_nutrition_targets_user_date ON daily_nutrition_targets(user_id, date);
            CREATE INDEX IF NOT EXISTS idx_daily_nutrition_totals_user_date ON daily_nutrition_totals(user_id, date);
            CREATE INDEX IF NOT EXISTS idx_activity_daily_summaries_user_date ON activity_daily_summaries(user_id, date);
            CREATE INDEX IF NOT EXISTS idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);
        `
    },
    {
        id: '0002_profile_and_nutrition_settings',
        sql: `
            ALTER TABLE user_metrics ADD COLUMN biological_sex TEXT;
            ALTER TABLE user_metrics ADD COLUMN desired_weight_kg REAL;
            ALTER TABLE user_metrics ADD COLUMN gym_sessions_per_week INTEGER;

            CREATE TABLE IF NOT EXISTS user_nutrition_settings (
                user_id TEXT PRIMARY KEY,
                target_mode TEXT NOT NULL DEFAULT 'auto',
                manual_calories_target REAL,
                manual_protein_target REAL,
                manual_carbs_target REAL,
                manual_fats_target REAL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `
    }
];
