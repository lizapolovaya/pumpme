import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalyticsRepository } from '../contracts';
import type { ProgressLogDto, ProgressMetricsSummaryDto, ProgressPointDto, ProgressVolumeWeekDto } from '../../types';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';
import { buildWeeklyVolumeTrend, getVolumeTrendWindowStart } from '../volume-trend';

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

function getMonthToDateStart(today: string): string {
    const date = new Date(`${today}T00:00:00.000Z`);
    date.setUTCDate(1);
    return toIsoDate(date);
}

function resolveRangeStart(today: string, range: string): string {
    if (range.trim().toLowerCase() === 'mtd') {
        return getMonthToDateStart(today);
    }

    return getRangeStart(today, parseRangeDays(range));
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

export class SupabaseAnalyticsRepository implements AnalyticsRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getProgressSummary(userId: string, range: string): Promise<ProgressMetricsSummaryDto> {
        const now = new Date();
        const today = toIsoDate(now);
        await ensureScaffoldForDate(this.client, userId, today);

        const rangeStart = resolveRangeStart(today, range);
        const volumeTrendWindowStart = getVolumeTrendWindowStart(now);
        const sessionFetchStart = rangeStart < volumeTrendWindowStart ? rangeStart : volumeTrendWindowStart;

        const sessionsResult = await this.client
            .from('workout_sessions')
            .select('id,date,total_volume_kg')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('date', sessionFetchStart);
        const sessions = requireSupabaseOk(sessionsResult as any, 'Unable to load progress sessions') as CompletedSessionRow[];

        const { exerciseIdToSession, sets } = await this.loadExercisesAndSets(sessions);
        const volumeTrend = this.computeVolumeTrend(sessions, sets, exerciseIdToSession, now);
        const { oneRmTrend, averageRpe } = this.computeOneRmAndRpeTrend(sessions, sets, exerciseIdToSession, rangeStart);
        const readinessScore = await this.computeReadinessScore(userId, sessions);

        const logs: ProgressLogDto[] = [];

        return {
            averageRpe,
            range,
            recoveryScore: readinessScore,
            volumeTrend,
            oneRmTrend,
            logs
        };
    }

    private computeVolumeTrend(
        sessions: CompletedSessionRow[],
        sets: SetRow[],
        exerciseIdToSession: Map<string, string>,
        today: Date
    ): ProgressVolumeWeekDto[] {
        const sessionById = new Map(
            sessions.map((session) => [
                session.id,
                {
                    date: session.date,
                    totalVolumeKg: 0
                }
            ])
        );

        for (const set of sets) {
            if (set.weight_kg === null || set.reps === null) {
                continue;
            }

            const sessionId = exerciseIdToSession.get(set.session_exercise_id);
            const session = sessionId ? sessionById.get(sessionId) : null;
            if (!session) {
                continue;
            }

            session.totalVolumeKg += set.weight_kg * set.reps;
        }

        return buildWeeklyVolumeTrend(
            Array.from(sessionById.values()).filter((session) => session.totalVolumeKg > 0),
            today
        );
    }

    private computeOneRmAndRpeTrend(
        sessions: CompletedSessionRow[],
        sets: SetRow[],
        exerciseIdToSession: Map<string, string>,
        rangeStart: string
    ): { oneRmTrend: ProgressPointDto[]; averageRpe: number } {
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

        const rpeValues = sets.map((set) => set.rpe).filter((value): value is number => typeof value === 'number');
        const averageRpe =
            rpeValues.length > 0 ? Number((rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length).toFixed(1)) : 8.2;

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

    private async loadExercisesAndSets(
        sessions: CompletedSessionRow[]
    ): Promise<{ exerciseIdToSession: Map<string, string>; sets: SetRow[] }> {
        const sessionIds = sessions.map((session) => session.id);
        if (!sessionIds.length) {
            return {
                exerciseIdToSession: new Map(),
                sets: []
            };
        }

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

        return {
            exerciseIdToSession: new Map(exercises.map((exercise) => [exercise.id, exercise.session_id])),
            sets
        };
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
