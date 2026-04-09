import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalyticsRepository } from '../contracts';
import type { ProgressLogDto, ProgressPointDto, ProgressSummaryDto } from '../../types';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';

type CompletedSessionRow = {
    id: string;
    date: string;
    total_volume_kg: number | null;
};

type SessionExerciseRow = {
    id: string;
    session_id: string;
};

type SetRow = {
    session_exercise_id: string;
    weight_kg: number | null;
    reps: number | null;
    rpe: number | null;
    completed: boolean;
};

type ReadinessRow = {
    date: string;
    score: number | null;
};

function parseRangeDays(range: string): number {
    const match = /^(\d+)d$/.exec(range.trim());
    const days = match ? Number.parseInt(match[1], 10) : 30;

    if (!Number.isFinite(days) || days <= 0) {
        return 30;
    }

    return days;
}

function getRangeStart(today: string, rangeDays: number): string {
    const date = new Date(`${today}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - Math.max(0, rangeDays - 1));
    return toIsoDate(date);
}

function formatMonthLabel(monthValue: string): string {
    const [year, month] = monthValue.split('-').map((value) => Number.parseInt(value, 10));

    if (!year || !month) {
        return 'N/A';
    }

    return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
        new Date(Date.UTC(year, month - 1, 1))
    );
}

function getSqliteWeekNumber(dateString: string): number {
    // Mirrors SQLite strftime('%W', date) with Monday as the first day of the week.
    const date = new Date(`${dateString}T00:00:00.000Z`);
    const year = date.getUTCFullYear();
    const jan1 = new Date(Date.UTC(year, 0, 1));
    const jan1DayIndex = (jan1.getUTCDay() + 6) % 7; // Mon=0..Sun=6
    const firstMonday = new Date(jan1);
    firstMonday.setUTCDate(jan1.getUTCDate() + ((7 - jan1DayIndex) % 7));

    if (date < firstMonday) {
        return 0;
    }

    const diffDays = Math.floor((date.getTime() - firstMonday.getTime()) / (24 * 60 * 60 * 1000));
    return Math.floor(diffDays / 7) + 1;
}

export class SupabaseAnalyticsRepository implements AnalyticsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getProgressSummary(userId: string, range: string): Promise<ProgressSummaryDto> {
        const today = toIsoDate(new Date());
        await ensureScaffoldForDate(this.client, userId, today);

        const rangeDays = parseRangeDays(range);
        const rangeStart = getRangeStart(today, rangeDays);

        const sessionsResult = await this.client
            .from('workout_sessions')
            .select('id,date,total_volume_kg')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('date', rangeStart);
        const sessions = requireSupabaseOk(sessionsResult as any, 'Unable to load progress sessions') as CompletedSessionRow[];

        const volumeTrend = this.computeVolumeTrend(sessions);
        const { oneRmTrend, averageRpe } = await this.computeOneRmAndRpeTrend(userId, sessions, rangeStart);
        const readinessScore = await this.computeReadinessScore(userId, sessions);

        const logs: ProgressLogDto[] = [
            {
                title: 'Relative Intensity (RPE) Average',
                subtitle: 'Average across logged workout sets',
                value: averageRpe.toFixed(1),
                status: averageRpe >= 8 ? 'Optimal Range' : 'Build Intensity'
            },
            {
                title: 'Recovery Score',
                subtitle: 'Based on daily readiness entries',
                value: `${readinessScore}%`,
                status: readinessScore >= 85 ? 'High Readiness' : 'Monitor Recovery'
            }
        ];

        return {
            range,
            volumeTrend,
            oneRmTrend,
            logs
        };
    }

    private computeVolumeTrend(sessions: CompletedSessionRow[]): ProgressPointDto[] {
        if (!sessions.length) {
            return Array.from({ length: 8 }, (_, index) => ({ label: `W${index + 1}`, value: 0 }));
        }

        const byWeek = new Map<string, { label: string; value: number; maxDate: string }>();
        for (const session of sessions) {
            const weekNumber = getSqliteWeekNumber(session.date);
            const label = `W${weekNumber + 1}`;
            const current = byWeek.get(label) ?? { label, value: 0, maxDate: session.date };
            byWeek.set(label, {
                label,
                value: current.value + Math.round(session.total_volume_kg ?? 0),
                maxDate: session.date > current.maxDate ? session.date : current.maxDate
            });
        }

        const sorted = Array.from(byWeek.values())
            .sort((a, b) => (a.maxDate < b.maxDate ? 1 : -1))
            .slice(0, 8)
            .reverse()
            .map((row) => ({ label: row.label, value: row.value }));

        if (sorted.length < 8) {
            const pad = Array.from({ length: 8 - sorted.length }, (_, index) => ({
                label: `W${index + 1}`,
                value: 0
            }));
            return [...pad, ...sorted].slice(-8);
        }

        return sorted;
    }

    private async computeOneRmAndRpeTrend(
        userId: string,
        sessions: CompletedSessionRow[],
        rangeStart: string
    ): Promise<{ oneRmTrend: ProgressPointDto[]; averageRpe: number }> {
        if (!sessions.length) {
            return {
                oneRmTrend: [
                    { label: 'Nov', value: 215 },
                    { label: 'Dec', value: 220 },
                    { label: 'Jan', value: 235 },
                    { label: 'Feb', value: 245 }
                ],
                averageRpe: 8.2
            };
        }

        const sessionIds = sessions.map((session) => session.id);
        const exercisesResult = await this.client
            .from('workout_session_exercises')
            .select('id,session_id')
            .in('session_id', sessionIds);
        const exercises = requireSupabaseOk(exercisesResult as any, 'Unable to load progress exercises') as SessionExerciseRow[];
        const exerciseIds = exercises.map((exercise) => exercise.id);

        let sets: SetRow[] = [];
        if (exerciseIds.length) {
            const setsResult = await this.client
                .from('workout_sets')
                .select('session_exercise_id,weight_kg,reps,rpe,completed')
                .in('session_exercise_id', exerciseIds);
            sets = requireSupabaseOk(setsResult as any, 'Unable to load progress sets') as SetRow[];
        }

        const rpeValues = sets.map((set) => set.rpe).filter((value): value is number => typeof value === 'number');
        const averageRpe =
            rpeValues.length > 0 ? Number((rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length).toFixed(1)) : 8.2;

        const exerciseIdToSession = new Map(exercises.map((exercise) => [exercise.id, exercise.session_id]));
        const sessionById = new Map(sessions.map((session) => [session.id, session]));

        const byMonth = new Map<string, number>();
        for (const set of sets) {
            if (!set.completed || set.weight_kg === null || set.reps === null) {
                continue;
            }

            const sessionId = exerciseIdToSession.get(set.session_exercise_id);
            const session = sessionId ? sessionById.get(sessionId) : null;
            if (!session) {
                continue;
            }

            if (session.date < rangeStart) {
                continue;
            }

            const monthValue = session.date.slice(0, 7);
            const oneRm = set.weight_kg * (1 + set.reps / 30);
            const current = byMonth.get(monthValue) ?? 0;
            byMonth.set(monthValue, Math.max(current, oneRm));
        }

        const oneRmTrend =
            byMonth.size === 0
                ? [
                      { label: 'Nov', value: 215 },
                      { label: 'Dec', value: 220 },
                      { label: 'Jan', value: 235 },
                      { label: 'Feb', value: 245 }
                  ]
                : Array.from(byMonth.entries())
                      .sort(([a], [b]) => (a < b ? 1 : -1))
                      .slice(0, 4)
                      .reverse()
                      .map(([monthValue, oneRmValue]) => ({
                          label: formatMonthLabel(monthValue),
                          value: Math.round(oneRmValue)
                      }));

        return { oneRmTrend, averageRpe };
    }

    private async computeReadinessScore(userId: string, sessions: CompletedSessionRow[]): Promise<number> {
        if (!sessions.length) {
            return 92;
        }

        const dates = Array.from(new Set(sessions.map((session) => session.date)));
        const readinessResult = await this.client
            .from('daily_readiness')
            .select('date,score')
            .eq('user_id', userId)
            .in('date', dates);
        const readiness = requireSupabaseOk(readinessResult as any, 'Unable to load readiness scores') as ReadinessRow[];

        const scores = readiness.map((row) => row.score).filter((value): value is number => typeof value === 'number');
        if (!scores.length) {
            return 92;
        }

        return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
    }
}
