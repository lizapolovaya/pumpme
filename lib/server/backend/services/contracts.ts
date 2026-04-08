import type {
    AddWorkoutExerciseInput,
    AddWorkoutSetInput,
    BootstrapResponse,
    CalendarMonthDto,
    NutritionDayDto,
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
    WorkoutSessionDto,
    WorkoutTemplateDto
} from '../types';

export interface ProfileService {
    getProfile(): Promise<ProfileDto>;
    updateProfile(input: UpdateProfileInput): Promise<ProfileDto>;
}

export interface PreferencesService {
    getPreferences(): Promise<PreferencesDto>;
    updatePreferences(input: UpdatePreferencesInput): Promise<PreferencesDto>;
}

export interface DashboardService {
    getToday(date: string): Promise<TodayDashboardDto>;
    getBootstrap(date: string): Promise<BootstrapResponse>;
}

export interface WorkoutService {
    listTemplates(): Promise<WorkoutTemplateDto[]>;
    getSessionByDate(date: string): Promise<WorkoutSessionDto | null>;
    startSession(input: StartWorkoutSessionInput): Promise<WorkoutSessionDto>;
    updateSession(sessionId: string, input: UpdateWorkoutSessionInput): Promise<WorkoutSessionDto>;
    addExercise(sessionId: string, input: AddWorkoutExerciseInput): Promise<WorkoutSessionDto>;
    updateExercise(sessionId: string, exerciseRowId: string, input: UpdateWorkoutExerciseInput): Promise<WorkoutSessionDto>;
    removeExercise(sessionId: string, exerciseRowId: string): Promise<WorkoutSessionDto>;
    addSet(sessionId: string, exerciseRowId: string, input: AddWorkoutSetInput): Promise<WorkoutSessionDto>;
    updateSet(sessionId: string, setId: string, input: UpdateWorkoutSetInput): Promise<WorkoutSessionDto>;
    removeSet(sessionId: string, setId: string): Promise<WorkoutSessionDto>;
    finishSession(sessionId: string): Promise<WorkoutSessionDto>;
}

export interface CalendarService {
    getMonth(year: number, month: number, selectedDate?: string): Promise<CalendarMonthDto>;
}

export interface NutritionService {
    getDay(date: string): Promise<NutritionDayDto>;
    updateDay(date: string, input: UpdateNutritionDayInput): Promise<NutritionDayDto>;
}

export interface ReadinessService {
    getDay(date: string): Promise<ReadinessDayDto>;
    updateDay(date: string, input: UpdateReadinessDayInput): Promise<ReadinessDayDto>;
}

export interface AnalyticsService {
    getProgress(range: string): Promise<ProgressSummaryDto>;
}

export interface BackendServices {
    profile: ProfileService;
    preferences: PreferencesService;
    dashboard: DashboardService;
    workouts: WorkoutService;
    calendar: CalendarService;
    nutrition: NutritionService;
    readiness: ReadinessService;
    analytics: AnalyticsService;
}
