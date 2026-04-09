create table if not exists users (
    id text primary key,
    email text,
    display_name text not null,
    avatar_url text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists user_preferences (
    user_id text primary key references users(id) on delete cascade,
    unit_system text not null default 'metric',
    food_database_region text not null default 'US',
    theme_mode text not null default 'dark',
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists user_metrics (
    user_id text primary key references users(id) on delete cascade,
    age integer,
    primary_goal text not null default 'athleticism',
    height_cm double precision,
    weight_kg double precision,
    step_goal integer,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists exercise_definitions (
    id text primary key,
    name text not null,
    muscle_group text,
    equipment text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists workout_templates (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    name text not null,
    focus text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists template_exercises (
    id text primary key,
    template_id text not null references workout_templates(id) on delete cascade,
    exercise_id text not null references exercise_definitions(id) on delete restrict,
    exercise_name text not null,
    sort_order integer not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists workout_sessions (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    template_id text references workout_templates(id) on delete set null,
    date text not null,
    title text not null,
    focus text,
    status text not null,
    duration_minutes integer,
    total_volume_kg double precision,
    estimated_burn_kcal double precision,
    notes text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    completed_at timestamptz
);

create table if not exists workout_session_exercises (
    id text primary key,
    session_id text not null references workout_sessions(id) on delete cascade,
    exercise_id text not null references exercise_definitions(id) on delete restrict,
    exercise_name text not null,
    sort_order integer not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists workout_sets (
    id text primary key,
    session_exercise_id text not null references workout_session_exercises(id) on delete cascade,
    sort_order integer not null,
    weight_kg double precision,
    reps integer,
    rpe double precision,
    completed boolean not null default false,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists daily_readiness (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    date text not null,
    score integer,
    band text not null default 'moderate',
    headline text not null,
    summary text not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, date)
);

create table if not exists daily_nutrition_targets (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    date text not null,
    calories_target double precision not null default 0,
    protein_target double precision not null default 0,
    carbs_target double precision not null default 0,
    fats_target double precision not null default 0,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, date)
);

create table if not exists daily_nutrition_totals (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    date text not null,
    calories_current double precision not null default 0,
    protein_current double precision not null default 0,
    carbs_current double precision not null default 0,
    fats_current double precision not null default 0,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, date)
);

create table if not exists activity_daily_summaries (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    date text not null,
    steps integer not null default 0,
    active_minutes integer,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, date)
);

create table if not exists personal_records (
    id text primary key,
    user_id text not null references users(id) on delete cascade,
    exercise_id text not null references exercise_definitions(id) on delete restrict,
    metric_key text not null,
    metric_value double precision not null,
    achieved_at timestamptz not null,
    source_session_id text references workout_sessions(id) on delete set null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_workout_templates_user_id on workout_templates(user_id);
create index if not exists idx_template_exercises_template_id on template_exercises(template_id);
create index if not exists idx_workout_sessions_user_date on workout_sessions(user_id, date);
create index if not exists idx_workout_session_exercises_session_id on workout_session_exercises(session_id);
create index if not exists idx_workout_sets_session_exercise_id on workout_sets(session_exercise_id);
create index if not exists idx_daily_readiness_user_date on daily_readiness(user_id, date);
create index if not exists idx_daily_nutrition_targets_user_date on daily_nutrition_targets(user_id, date);
create index if not exists idx_daily_nutrition_totals_user_date on daily_nutrition_totals(user_id, date);
create index if not exists idx_activity_daily_summaries_user_date on activity_daily_summaries(user_id, date);
create index if not exists idx_personal_records_user_exercise on personal_records(user_id, exercise_id);
