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
    biological_sex text,
    primary_goal text not null default 'athleticism',
    height_cm double precision,
    weight_kg double precision,
    desired_weight_kg double precision,
    gym_sessions_per_week integer,
    step_goal integer,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists user_nutrition_settings (
    user_id text primary key references users(id) on delete cascade,
    target_mode text not null default 'auto',
    manual_calories_target double precision,
    manual_protein_target double precision,
    manual_carbs_target double precision,
    manual_fats_target double precision,
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
    source text,
    last_synced_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, date)
);

alter table public.activity_daily_summaries add column if not exists source text;
alter table public.activity_daily_summaries add column if not exists last_synced_at timestamptz;

create table if not exists google_oauth_connections (
    user_id text primary key references users(id) on delete cascade,
    google_user_id text,
    email text,
    access_token text,
    refresh_token text,
    scopes text not null default '',
    access_token_expires_at timestamptz,
    connected_at timestamptz not null default timezone('utc', now()),
    last_sync_at timestamptz,
    last_sync_error text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_metrics enable row level security;
alter table public.user_nutrition_settings enable row level security;
alter table public.workout_templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.daily_readiness enable row level security;
alter table public.daily_nutrition_targets enable row level security;
alter table public.daily_nutrition_totals enable row level security;
alter table public.activity_daily_summaries enable row level security;

create policy if not exists "users_select_own" on public.users for select using (auth.uid()::text = id);
create policy if not exists "user_preferences_select_own" on public.user_preferences for select using (auth.uid()::text = user_id);
create policy if not exists "user_metrics_select_own" on public.user_metrics for select using (auth.uid()::text = user_id);
create policy if not exists "user_nutrition_settings_select_own" on public.user_nutrition_settings for select using (auth.uid()::text = user_id);
create policy if not exists "workout_templates_select_own" on public.workout_templates for select using (auth.uid()::text = user_id);
create policy if not exists "template_exercises_select_own" on public.template_exercises for select using (
    exists (
        select 1
        from public.workout_templates
        where workout_templates.id = template_exercises.template_id
          and workout_templates.user_id = auth.uid()::text
    )
);
create policy if not exists "workout_sessions_select_own" on public.workout_sessions for select using (auth.uid()::text = user_id);
create policy if not exists "workout_session_exercises_select_own" on public.workout_session_exercises for select using (
    exists (
        select 1
        from public.workout_sessions
        where workout_sessions.id = workout_session_exercises.session_id
          and workout_sessions.user_id = auth.uid()::text
    )
);
create policy if not exists "workout_sets_select_own" on public.workout_sets for select using (
    exists (
        select 1
        from public.workout_session_exercises
        join public.workout_sessions on workout_sessions.id = workout_session_exercises.session_id
        where workout_session_exercises.id = workout_sets.session_exercise_id
          and workout_sessions.user_id = auth.uid()::text
    )
);
create policy if not exists "daily_readiness_select_own" on public.daily_readiness for select using (auth.uid()::text = user_id);
create policy if not exists "daily_nutrition_targets_select_own" on public.daily_nutrition_targets for select using (auth.uid()::text = user_id);
create policy if not exists "daily_nutrition_totals_select_own" on public.daily_nutrition_totals for select using (auth.uid()::text = user_id);
create policy if not exists "activity_daily_summaries_select_own" on public.activity_daily_summaries for select using (auth.uid()::text = user_id);

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
