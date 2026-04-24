import type { SupabaseClient } from '@supabase/supabase-js';
import type { DashboardRepository } from '../contracts';
import type { PlannedWorkoutSummaryDto, TodayDashboardDto, WeeklyDisciplineDayDto } from '../../types';
import { SupabaseActivityRepository } from './activity-repository';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';
import { SupabaseNutritionRepository } from './nutrition-repository';
import { SupabaseReadinessRepository } from './readiness-repository';

const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' });

type SessionRow = {
    id: string;
    template_id: string | null;
    title: string;
    focus: string | null;
    duration_minutes: number | null;
    total_volume_kg: number | null;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
};

type TemplateRow = {
    id: string;
    name: string;
    focus: string | null;
};

export class SupabaseDashboardRepository implements DashboardRepository {
    private readonly activityRepository: SupabaseActivityRepository;
    private readonly nutritionRepository: SupabaseNutritionRepository;
    private readonly readinessRepository: SupabaseReadinessRepository;

    constructor(private readonly client: SupabaseClient) {
        this.activityRepository = new SupabaseActivityRepository(client);
        this.nutritionRepository = new SupabaseNutritionRepository(client);
        this.readinessRepository = new SupabaseReadinessRepository(client);
    }

    async getPlannedWorkout(userId: string, date: string): Promise<PlannedWorkoutSummaryDto> {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);

        const sessionResult = await this.client
            .from('workout_sessions')
            .select('id,template_id,title,focus,duration_minutes,total_volume_kg,status')
            .eq('user_id', userId)
            .eq('date', normalizedDate)
            .order('created_at', { ascending: false })
            .limit(1);
        const sessions = requireSupabaseOk(sessionResult as any, 'Unable to load planned workout') as SessionRow[];
        const session = sessions[0];

        if (!session) {
            const templateResult = await this.client
                .from('workout_templates')
                .select('id,name,focus')
                .eq('user_id', userId)
                .order('created_at', { ascending: true })
                .limit(1);
            const templates = requireSupabaseOk(templateResult as any, 'Unable to load workout templates') as TemplateRow[];
            const template = templates[0];

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
            sessionId: session.id,
            templateId: session.template_id,
            title: session.title,
            focus: session.focus,
            estimatedDurationMinutes: session.duration_minutes ?? 75,
            targetVolumeKg: session.total_volume_kg ?? 12400,
            status: session.status
        };
    }

    async getWeeklyDiscipline(userId: string, date: string): Promise<WeeklyDisciplineDayDto[]> {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);

        const sourceDate = new Date(`${normalizedDate}T00:00:00.000Z`);
        const dayIndex = (sourceDate.getUTCDay() + 6) % 7;
        const weekStart = new Date(sourceDate);
        weekStart.setUTCDate(sourceDate.getUTCDate() - dayIndex);

        const weekDates: string[] = [];
        for (let index = 0; index < 7; index += 1) {
            const current = new Date(weekStart);
            current.setUTCDate(weekStart.getUTCDate() + index);
            weekDates.push(current.toISOString().slice(0, 10));
        }

        const sessionsResult = await this.client
            .from('workout_sessions')
            .select('date,status')
            .eq('user_id', userId)
            .in('date', weekDates);
        const sessions = requireSupabaseOk(sessionsResult as any, 'Unable to load weekly discipline') as Array<{
            date: string;
            status: string;
        }>;

        const byDate = new Map<string, { sessionCount: number; completedCount: number }>();
        for (const session of sessions) {
            const current = byDate.get(session.date) ?? { sessionCount: 0, completedCount: 0 };
            byDate.set(session.date, {
                sessionCount: current.sessionCount + 1,
                completedCount: current.completedCount + (session.status === 'completed' ? 1 : 0)
            });
        }

        const days: WeeklyDisciplineDayDto[] = [];
        for (let index = 0; index < 7; index += 1) {
            const current = new Date(weekStart);
            current.setUTCDate(weekStart.getUTCDate() + index);
            const currentDate = current.toISOString().slice(0, 10);
            const row = byDate.get(currentDate) ?? { sessionCount: 0, completedCount: 0 };

            days.push({
                date: currentDate,
                label: weekdayFormatter.format(current).slice(0, 1),
                sessionCount: row.sessionCount,
                completed: row.completedCount > 0
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
