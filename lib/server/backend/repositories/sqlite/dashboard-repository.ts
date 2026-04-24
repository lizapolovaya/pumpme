import type { DashboardRepository } from '../contracts';
import type { PlannedWorkoutSummaryDto, TodayDashboardDto, WeeklyDisciplineDayDto } from '../../types';
import { SqliteActivityRepository } from './activity-repository';
import { ensureScaffoldForDate, getSqliteRepositoryDatabase, toIsoDate } from './shared';
import { SqliteNutritionRepository } from './nutrition-repository';
import { SqliteReadinessRepository } from './readiness-repository';

const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });

export class SqliteDashboardRepository implements DashboardRepository {
    constructor(
        private readonly activityRepository = new SqliteActivityRepository(),
        private readonly nutritionRepository = new SqliteNutritionRepository(),
        private readonly readinessRepository = new SqliteReadinessRepository()
    ) {}

    async getPlannedWorkout(userId: string, date: string): Promise<PlannedWorkoutSummaryDto> {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);

        const row = db
            .prepare(`
                SELECT id, template_id, title, focus, duration_minutes, total_volume_kg, status
                FROM workout_sessions
                WHERE user_id = ? AND date = ?
                ORDER BY created_at DESC
                LIMIT 1
            `)
            .get(userId, normalizedDate) as {
            id: string;
            template_id: string | null;
            title: string;
            focus: string | null;
            duration_minutes: number | null;
            total_volume_kg: number | null;
            status: 'scheduled' | 'active' | 'completed' | 'cancelled';
        } | undefined;

        if (!row) {
            const template = db
                .prepare(`
                    SELECT id, name, focus
                    FROM workout_templates
                    WHERE user_id = ?
                    ORDER BY created_at ASC
                    LIMIT 1
                `)
                .get(userId) as { id: string; name: string; focus: string | null } | undefined;

            if (!template) {
                return {
                    sessionId: null,
                    templateId: null,
                    title: 'No Plan',
                    focus: null,
                    estimatedDurationMinutes: null,
                    targetVolumeKg: null,
                    status: 'none'
                };
            }

            return {
                sessionId: null,
                templateId: template.id,
                title: template.name,
                focus: template.focus,
                estimatedDurationMinutes: 75,
                targetVolumeKg: 12400,
                status: 'scheduled'
            };
        }

        return {
            sessionId: row.id,
            templateId: row.template_id,
            title: row.title,
            focus: row.focus,
            estimatedDurationMinutes: row.duration_minutes ?? 75,
            targetVolumeKg: row.total_volume_kg ?? 12400,
            status: row.status
        };
    }

    async getWeeklyDiscipline(userId: string, date: string): Promise<WeeklyDisciplineDayDto[]> {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);

        const sourceDate = new Date(`${normalizedDate}T00:00:00.000Z`);
        const dayIndex = (sourceDate.getUTCDay() + 6) % 7;
        const weekStart = new Date(sourceDate);
        weekStart.setUTCDate(sourceDate.getUTCDate() - dayIndex);

        const days: WeeklyDisciplineDayDto[] = [];
        for (let index = 0; index < 7; index += 1) {
            const current = new Date(weekStart);
            current.setUTCDate(weekStart.getUTCDate() + index);
            const currentDate = current.toISOString().slice(0, 10);
            const row = db
                .prepare(`
                    SELECT
                        COUNT(*) AS sessionCount,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedCount
                    FROM workout_sessions
                    WHERE user_id = ? AND date = ?
                `)
                .get(userId, currentDate) as { sessionCount: number; completedCount: number | null };

            days.push({
                date: currentDate,
                label: weekdayFormatter.format(current).slice(0, 1),
                sessionCount: row.sessionCount,
                completed: Boolean(row.completedCount ?? 0)
            });
        }

        return days;
    }

    async getTodayDashboard(userId: string, date: string): Promise<TodayDashboardDto> {
        const normalizedDate = toIsoDate(date);

        const [activity, readiness, plannedWorkout, weeklyDiscipline, nutrition] = await Promise.all([
            this.activityRepository.getActivityDay(userId, normalizedDate),
            this.readinessRepository.getReadinessDay(userId, normalizedDate),
            this.getPlannedWorkout(userId, normalizedDate),
            this.getWeeklyDiscipline(userId, normalizedDate),
            this.nutritionRepository.getNutritionDay(userId, normalizedDate)
        ]);

        return {
            activity,
            readiness,
            plannedWorkout,
            weeklyDiscipline,
            nutrition
        };
    }
}
