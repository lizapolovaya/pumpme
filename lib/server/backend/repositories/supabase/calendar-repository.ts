import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarRepository } from '../contracts';
import type { CalendarDayMarkerDto, CalendarMonthDto } from '../../types';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';
import { SupabaseWorkoutRepository } from './workout-repository';

type SessionSummaryRow = {
    id: string;
    date: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
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

export class SupabaseCalendarRepository implements CalendarRepository {
    constructor(
        private readonly client: SupabaseClient,
        private readonly workoutRepository = new SupabaseWorkoutRepository(client)
    ) {}

    async getMonth(
        userId: string,
        year: number,
        month: number,
        selectedDate?: string
    ): Promise<CalendarMonthDto> {
        const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
        const normalizedSelectedDate = selectedDate ?? firstOfMonth.toISOString().slice(0, 10);

        await ensureScaffoldForDate(this.client, userId, normalizedSelectedDate);

        const gridStart = new Date(firstOfMonth);
        gridStart.setUTCDate(1 - ((firstOfMonth.getUTCDay() + 6) % 7));

        const gridEnd = new Date(gridStart);
        gridEnd.setUTCDate(gridStart.getUTCDate() + 27);

        const rangeStart = gridStart.toISOString().slice(0, 10);
        const rangeEnd = gridEnd.toISOString().slice(0, 10);

        const sessionsResult = await this.client
            .from('workout_sessions')
            .select('id,date,status,total_volume_kg')
            .eq('user_id', userId)
            .gte('date', rangeStart)
            .lte('date', rangeEnd);
        const sessions = requireSupabaseOk(sessionsResult as any, 'Unable to load calendar sessions') as SessionSummaryRow[];

        const sessionIds = sessions.map((session) => session.id);
        const exercisesBySessionId = new Map<string, number>();
        const sessionHasSetEntries = new Set<string>();
        const setVolumeBySessionId = new Map<string, number>();

        if (sessionIds.length) {
            const exercisesResult = await this.client
                .from('workout_session_exercises')
                .select('id,session_id')
                .in('session_id', sessionIds);
            const exercises = requireSupabaseOk(exercisesResult as any, 'Unable to load calendar exercises') as SessionExerciseRow[];

            for (const exercise of exercises) {
                exercisesBySessionId.set(exercise.session_id, (exercisesBySessionId.get(exercise.session_id) ?? 0) + 1);
            }

            const exerciseIds = exercises.map((exercise) => exercise.id);
            if (exerciseIds.length) {
                const setsResult = await this.client
                    .from('workout_sets')
                    .select('session_exercise_id,weight_kg,reps,rpe,completed')
                    .in('session_exercise_id', exerciseIds);
                const sets = requireSupabaseOk(setsResult as any, 'Unable to load calendar sets') as SetRow[];

                const exerciseIdToSessionId = new Map(exercises.map((exercise) => [exercise.id, exercise.session_id]));
                for (const set of sets) {
                    const sessionId = exerciseIdToSessionId.get(set.session_exercise_id);
                    if (!sessionId) {
                        continue;
                    }

                    const volume = (set.weight_kg ?? 0) * (set.reps ?? 0);
                    setVolumeBySessionId.set(sessionId, (setVolumeBySessionId.get(sessionId) ?? 0) + volume);

                    if (set.completed || set.weight_kg !== null || set.reps !== null || set.rpe !== null) {
                        sessionHasSetEntries.add(sessionId);
                    }
                }
            }
        }

        const daily = new Map<string, { sessionCount: number; completedCount: number; totalVolumeKg: number }>();

        for (const session of sessions) {
            const hasExercises = (exercisesBySessionId.get(session.id) ?? 0) > 0;
            const hasSetEntries = sessionHasSetEntries.has(session.id);
            const countsAsLogged = session.status === 'completed' || hasExercises || hasSetEntries;
            const volume =
                session.status === 'completed'
                    ? (session.total_volume_kg ?? 0)
                    : (setVolumeBySessionId.get(session.id) ?? 0);

            const current = daily.get(session.date) ?? { sessionCount: 0, completedCount: 0, totalVolumeKg: 0 };
            daily.set(session.date, {
                sessionCount: current.sessionCount + (countsAsLogged ? 1 : 0),
                completedCount: current.completedCount + (session.status === 'completed' ? 1 : 0),
                totalVolumeKg: current.totalVolumeKg + volume
            });
        }

        const days: CalendarDayMarkerDto[] = [];
        for (let index = 0; index < 28; index += 1) {
            const current = new Date(gridStart);
            current.setUTCDate(gridStart.getUTCDate() + index);
            const currentDate = current.toISOString().slice(0, 10);
            const row = daily.get(currentDate);
            const totalVolumeKg = row?.totalVolumeKg ?? 0;

            days.push({
                date: currentDate,
                sessionCount: row?.sessionCount ?? 0,
                completedSessionCount: row?.completedCount ?? 0,
                hasVolume: totalVolumeKg > 0,
                intensity:
                    totalVolumeKg >= 10000
                        ? 'high'
                        : totalVolumeKg >= 5000
                          ? 'moderate'
                          : totalVolumeKg > 0
                            ? 'light'
                            : 'none'
            });
        }

        return {
            year,
            month,
            days,
            selectedDay: await this.getDayDetail(userId, normalizedSelectedDate)
        };
    }

    async getDayDetail(userId: string, date: string) {
        const normalizedDate = toIsoDate(date);
        const session = await this.workoutRepository.findSessionByDate(userId, normalizedDate);

        return {
            date: normalizedDate,
            sessions: session ? [session] : []
        };
    }
}
