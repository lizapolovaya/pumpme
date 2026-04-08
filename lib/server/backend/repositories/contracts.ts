import type {
    AddWorkoutExerciseInput,
    AddWorkoutSetInput,
    CalendarDayDetailDto,
    CalendarMonthDto,
    NutritionDayDto,
    PlannedWorkoutSummaryDto,
    PreferencesDto,
    ProfileDto,
    ProgressSummaryDto,
    ReadinessDayDto,
    StartWorkoutSessionInput,
    TodayDashboardDto,
    UpdateNutritionDayInput,
    UpdatePreferencesInput,
    UpdateProfileInput,
    UpdateReadinessDayInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSessionInput,
    UpdateWorkoutSetInput,
    WeeklyDisciplineDayDto,
    WorkoutSessionDto,
    WorkoutTemplateDto
} from '../types';

export interface ProfileRepository {
    getProfile(userId: string): Promise<ProfileDto>;
    updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileDto>;
}

export interface PreferencesRepository {
    getPreferences(userId: string): Promise<PreferencesDto>;
    updatePreferences(userId: string, input: UpdatePreferencesInput): Promise<PreferencesDto>;
}

export interface WorkoutRepository {
    listTemplates(userId: string): Promise<WorkoutTemplateDto[]>;
    getSessionByDate(userId: string, date: string): Promise<WorkoutSessionDto | null>;
    startSession(userId: string, input: StartWorkoutSessionInput): Promise<WorkoutSessionDto>;
    updateSession(userId: string, sessionId: string, input: UpdateWorkoutSessionInput): Promise<WorkoutSessionDto>;
    addExercise(userId: string, sessionId: string, input: AddWorkoutExerciseInput): Promise<WorkoutSessionDto>;
    updateExercise(
        userId: string,
        sessionId: string,
        exerciseRowId: string,
        input: UpdateWorkoutExerciseInput
    ): Promise<WorkoutSessionDto>;
    removeExercise(userId: string, sessionId: string, exerciseRowId: string): Promise<WorkoutSessionDto>;
    addSet(userId: string, sessionId: string, exerciseRowId: string, input: AddWorkoutSetInput): Promise<WorkoutSessionDto>;
    updateSet(
        userId: string,
        sessionId: string,
        setId: string,
        input: UpdateWorkoutSetInput
    ): Promise<WorkoutSessionDto>;
    removeSet(userId: string, sessionId: string, setId: string): Promise<WorkoutSessionDto>;
    finishSession(userId: string, sessionId: string): Promise<WorkoutSessionDto>;
}

export interface NutritionRepository {
    getNutritionDay(userId: string, date: string): Promise<NutritionDayDto>;
    updateNutritionDay(userId: string, date: string, input: UpdateNutritionDayInput): Promise<NutritionDayDto>;
}

export interface ReadinessRepository {
    getReadinessDay(userId: string, date: string): Promise<ReadinessDayDto>;
    updateReadinessDay(userId: string, date: string, input: UpdateReadinessDayInput): Promise<ReadinessDayDto>;
}

export interface DashboardRepository {
    getPlannedWorkout(userId: string, date: string): Promise<PlannedWorkoutSummaryDto>;
    getWeeklyDiscipline(userId: string, date: string): Promise<WeeklyDisciplineDayDto[]>;
    getTodayDashboard(userId: string, date: string): Promise<TodayDashboardDto>;
}

export interface CalendarRepository {
    getMonth(userId: string, year: number, month: number, selectedDate?: string): Promise<CalendarMonthDto>;
    getDayDetail(userId: string, date: string): Promise<CalendarDayDetailDto | null>;
}

export interface AnalyticsRepository {
    getProgressSummary(userId: string, range: string): Promise<ProgressSummaryDto>;
}

export interface BackendRepositories {
    profile: ProfileRepository;
    preferences: PreferencesRepository;
    workouts: WorkoutRepository;
    nutrition: NutritionRepository;
    readiness: ReadinessRepository;
    dashboard: DashboardRepository;
    calendar: CalendarRepository;
    analytics: AnalyticsRepository;
}
