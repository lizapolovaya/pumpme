export { getBackendConfig } from './config';
export { DEFAULT_LOCAL_USER_ID, resolveCurrentUserContext } from './context';
export { closeDatabase, getDatabase, getSqlitePath, SQLITE_MIGRATIONS } from './db';
export type { BackendRepositories } from './repositories/contracts';
export type { BackendServices } from './services/contracts';
export { getBootstrapFromRepositories, getTodayDashboardFromRepositories } from './services/bootstrap';
export type {
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
    UserContext,
    WorkoutSessionDto,
    WorkoutTemplateDto
} from './types';
