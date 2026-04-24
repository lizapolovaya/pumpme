export type UnitSystem = 'metric' | 'imperial';
export type ThemeMode = 'dark';
export type PrimaryGoal = 'muscle_gain' | 'fat_loss' | 'strength' | 'maintenance' | 'athleticism';
export type ReadinessBand = 'low' | 'moderate' | 'high' | 'excellent';
export type WorkoutSessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type MacroKey = 'protein' | 'carbs' | 'fats' | 'calories';
export type BiologicalSex = 'male' | 'female';
export type ActivitySource = 'health_connect' | 'google_fit';

export type UserContext = {
    userId: string;
};

export type ProfileDto = {
    id: string;
    email: string | null;
    displayName: string;
    avatarUrl: string | null;
    age: number | null;
    biologicalSex: BiologicalSex | null;
    primaryGoal: PrimaryGoal;
    heightCm: number | null;
    weightKg: number | null;
    desiredWeightKg: number | null;
    gymSessionsPerWeek: number | null;
    stepGoal: number | null;
};

export type PreferencesDto = {
    unitSystem: UnitSystem;
    foodDatabaseRegion: string;
    themeMode: ThemeMode;
};

export type ReadinessDayDto = {
    date: string;
    score: number | null;
    band: ReadinessBand;
    headline: string;
    summary: string;
};

export type ActivityDayDto = {
    date: string;
    steps: number;
    activeMinutes: number | null;
    lastSyncedAt: string | null;
    source: ActivitySource | null;
};

export type NutritionMacroDto = {
    key: MacroKey;
    current: number;
    target: number;
    unit: string;
};

export type NutritionDayDto = {
    date: string;
    calories: NutritionMacroDto;
    protein: NutritionMacroDto;
    carbs: NutritionMacroDto;
    fats: NutritionMacroDto;
};

export type WeeklyDisciplineDayDto = {
    date: string;
    label: string;
    sessionCount: number;
    completed: boolean;
};

export type PlannedWorkoutSummaryDto = {
    sessionId: string | null;
    templateId: string | null;
    title: string;
    focus: string | null;
    estimatedDurationMinutes: number | null;
    targetVolumeKg: number | null;
    status: WorkoutSessionStatus | 'none';
};

export type TodayDashboardDto = {
    readiness: ReadinessDayDto;
    plannedWorkout: PlannedWorkoutSummaryDto;
    weeklyDiscipline: WeeklyDisciplineDayDto[];
    nutrition: NutritionDayDto;
    activity: ActivityDayDto;
};

export type WorkoutTemplateExerciseDto = {
    id: string;
    exerciseId: string;
    exerciseName: string;
    order: number;
};

export type WorkoutTemplateDto = {
    id: string;
    name: string;
    focus: string | null;
    exercises: WorkoutTemplateExerciseDto[];
};

export type WorkoutSetDto = {
    id: string;
    order: number;
    weightKg: number | null;
    reps: number | null;
    rpe: number | null;
    completed: boolean;
};

export type WorkoutSessionExerciseDto = {
    id: string;
    exerciseId: string;
    exerciseName: string;
    order: number;
    sets: WorkoutSetDto[];
};

export type WorkoutSessionDto = {
    id: string;
    templateId: string | null;
    date: string;
    title: string;
    focus: string | null;
    status: WorkoutSessionStatus;
    durationMinutes: number | null;
    totalVolumeKg: number | null;
    estimatedBurnKcal: number | null;
    exercises: WorkoutSessionExerciseDto[];
};

export type CalendarDayMarkerDto = {
    date: string;
    sessionCount: number;
    completedSessionCount: number;
    hasVolume: boolean;
    intensity: 'none' | 'light' | 'moderate' | 'high';
};

export type CalendarDayDetailDto = {
    date: string;
    sessions: WorkoutSessionDto[];
};

export type CalendarMonthDto = {
    year: number;
    month: number;
    days: CalendarDayMarkerDto[];
    selectedDay: CalendarDayDetailDto | null;
};

export type ProgressPointDto = {
    label: string;
    value: number;
};

export type ProgressLogDto = {
    title: string;
    subtitle: string;
    value: string;
    status: string;
};

export type ProgressSummaryDto = {
    range: string;
    volumeTrend: ProgressPointDto[];
    oneRmTrend: ProgressPointDto[];
    logs: ProgressLogDto[];
};

export type BootstrapResponse = {
    user: ProfileDto;
    preferences: PreferencesDto;
    today: TodayDashboardDto;
};

export type ProfileBootstrapResponse = {
    profile: ProfileDto;
    preferences: PreferencesDto;
    readiness: ReadinessDayDto;
    nutrition: NutritionDayDto;
    activity: ActivityDayDto;
    googleConnection: GoogleConnectionDto;
};

export type GoogleConnectionDto = {
    available: boolean;
    connected: boolean;
    email: string | null;
    fitnessScopeGranted: boolean;
    lastSyncAt: string | null;
    lastSyncError: string | null;
};

export type WorkoutsBootstrapResponse = {
    session: WorkoutSessionDto | null;
    templates: WorkoutTemplateDto[];
};

export type UpdateProfileInput = {
    displayName?: string;
    avatarUrl?: string | null;
    age?: number | null;
    biologicalSex?: BiologicalSex | null;
    primaryGoal?: PrimaryGoal;
    heightCm?: number | null;
    weightKg?: number | null;
    desiredWeightKg?: number | null;
    gymSessionsPerWeek?: number | null;
    stepGoal?: number | null;
};

export type UpdatePreferencesInput = {
    unitSystem?: UnitSystem;
    foodDatabaseRegion?: string;
};

export type StartWorkoutSessionInput = {
    date: string;
    templateId?: string | null;
    title: string;
    focus?: string | null;
};

export type UpdateWorkoutSessionInput = {
    title?: string;
    focus?: string | null;
    durationMinutes?: number | null;
    status?: WorkoutSessionStatus;
};

export type AddWorkoutExerciseInput = {
    exerciseId: string;
    exerciseName: string;
};

export type UpdateWorkoutExerciseInput = {
    exerciseName?: string;
};

export type AddWorkoutSetInput = {
    weightKg?: number | null;
    reps?: number | null;
    rpe?: number | null;
};

export type UpdateWorkoutSetInput = {
    weightKg?: number | null;
    reps?: number | null;
    rpe?: number | null;
    completed?: boolean;
};

export type UpdateNutritionDayInput = {
    caloriesCurrent?: number;
    caloriesTarget?: number;
    proteinCurrent?: number;
    proteinTarget?: number;
    carbsCurrent?: number;
    carbsTarget?: number;
    fatsCurrent?: number;
    fatsTarget?: number;
};

export type UpdateReadinessDayInput = {
    score?: number | null;
    band?: ReadinessBand;
    headline?: string;
    summary?: string;
};

export type UpdateActivityDayInput = {
    steps: number;
    activeMinutes?: number | null;
    source: ActivitySource;
    syncedAt?: string;
};
