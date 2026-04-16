import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarRepository } from '../contracts';
import type {
    CalendarDayDetailDto,
    CalendarDayMarkerDto,
    CalendarMonthDto,
    WorkoutSessionDto,
    WorkoutSessionExerciseDto,
    WorkoutSetDto
} from '../../types';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';

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
    constructor(private readonly client: SupabaseClient) {}

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
            selectedDay: this.buildDayDetailFromLoadedData(normalizedSelectedDate, sessions, exercisesBySessionId, setVolumeBySessionId, sessionHasSetEntries, await this.loadExercisesAndSetsForSelectedSession(sessions, normalizedSelectedDate))
        };
    }

    async getDayDetail(userId: string, date: string) {
        const normalizedDate = toIsoDate(date);
        const selectedSessionData = await this.loadExercisesAndSetsForSelectedSession(
            requireSupabaseOk(
                await this.client
                    .from('workout_sessions')
                    .select('id,date,status,total_volume_kg')
                    .eq('user_id', userId)
                    .eq('date', normalizedDate)
                    .order('created_at', { ascending: false }),
                'Unable to load selected day sessions'
            ) as SessionSummaryRow[],
            normalizedDate
        );
        const session = selectedSessionData ? this.mapSession(selectedSessionData.session, selectedSessionData.exercises, selectedSessionData.sets) : null;

        return {
            date: normalizedDate,
            sessions: session ? [session] : []
        } satisfies CalendarDayDetailDto;
    }

    private async loadExercisesAndSetsForSelectedSession(
        sessions: SessionSummaryRow[],
        selectedDate: string
    ): Promise<{
        session: WorkoutSessionDetailRow;
        exercises: SessionExerciseDetailRow[];
        sets: SetDetailRow[];
    } | null> {
        const candidateSessions = sessions.filter((session) => session.date === selectedDate);
        if (!candidateSessions.length) {
            return null;
        }

        const sessionIds = candidateSessions.map((session) => session.id);
        const sessionDetailRows = requireSupabaseOk(
            await this.client
                .from('workout_sessions')
                .select('id,template_id,date,title,focus,status,duration_minutes,total_volume_kg,estimated_burn_kcal')
                .in('id', sessionIds)
                .order('created_at', { ascending: false }),
            'Unable to load selected day session details'
        ) as WorkoutSessionDetailRow[];

        const exercises = requireSupabaseOk(
            await this.client
                .from('workout_session_exercises')
                .select('id,session_id,exercise_id,exercise_name,sort_order')
                .in('session_id', sessionIds)
                .order('sort_order', { ascending: true }),
            'Unable to load selected day exercises'
        ) as SessionExerciseDetailRow[];

        const exerciseIds = exercises.map((exercise) => exercise.id);
        const sets = exerciseIds.length
            ? (requireSupabaseOk(
                  await this.client
                      .from('workout_sets')
                      .select('id,session_exercise_id,sort_order,weight_kg,reps,rpe,completed')
                      .in('session_exercise_id', exerciseIds)
                      .order('sort_order', { ascending: true }),
                  'Unable to load selected day sets'
              ) as SetDetailRow[])
            : [];

        const chosenSession =
            sessionDetailRows.find((session) => session.status === 'completed' || session.total_volume_kg !== null) ??
            sessionDetailRows.find((session) => this.sessionHasEntries(session.id, exercises, sets)) ??
            null;

        if (!chosenSession) {
            return null;
        }

        return {
            session: chosenSession,
            exercises,
            sets
        };
    }

    private buildDayDetailFromLoadedData(
        selectedDate: string,
        sessions: SessionSummaryRow[],
        exercisesBySessionId: Map<string, number>,
        setVolumeBySessionId: Map<string, number>,
        sessionHasSetEntries: Set<string>,
        selectedSessionData: {
            session: WorkoutSessionDetailRow;
            exercises: SessionExerciseDetailRow[];
            sets: SetDetailRow[];
        } | null
    ): CalendarDayDetailDto {
        const daySessions = sessions.filter((session) => session.date === selectedDate);
        if (!daySessions.length || !selectedSessionData) {
            return {
                date: selectedDate,
                sessions: []
            };
        }

        const selectedSession = this.mapSession(
            selectedSessionData.session,
            selectedSessionData.exercises,
            selectedSessionData.sets
        );

        return {
            date: selectedDate,
            sessions: selectedSession ? [selectedSession] : []
        };
    }

    private sessionHasEntries(
        sessionId: string,
        exercises: SessionExerciseDetailRow[],
        sets: SetDetailRow[]
    ): boolean {
        const sessionExerciseIds = exercises.filter((exercise) => exercise.session_id === sessionId).map((exercise) => exercise.id);
        if (sessionExerciseIds.length > 0) {
            return true;
        }

        return sets.some((set) => {
            if (!sessionExerciseIds.includes(set.session_exercise_id)) {
                return false;
            }

            return set.completed || set.weight_kg !== null || set.reps !== null || set.rpe !== null;
        });
    }

    private mapSession(
        session: WorkoutSessionDetailRow,
        exercises: SessionExerciseDetailRow[],
        sets: SetDetailRow[]
    ): WorkoutSessionDto {
        const mappedExercises: WorkoutSessionExerciseDto[] = exercises
            .filter((exercise) => exercise.session_id === session.id)
            .map((exercise) => ({
                id: exercise.id,
                exerciseId: exercise.exercise_id,
                exerciseName: exercise.exercise_name,
                order: exercise.sort_order,
                sets: sets
                    .filter((set) => set.session_exercise_id === exercise.id)
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map(
                        (set): WorkoutSetDto => ({
                            id: set.id,
                            order: set.sort_order,
                            weightKg: set.weight_kg,
                            reps: set.reps,
                            rpe: set.rpe,
                            completed: Boolean(set.completed)
                        })
                    )
            }));

        return {
            id: session.id,
            templateId: session.template_id,
            date: session.date,
            title: session.title,
            focus: session.focus,
            status: session.status,
            durationMinutes: session.duration_minutes,
            totalVolumeKg: session.total_volume_kg,
            estimatedBurnKcal: session.estimated_burn_kcal,
            exercises: mappedExercises
        };
    }
}

type WorkoutSessionDetailRow = {
    id: string;
    template_id: string | null;
    date: string;
    title: string;
    focus: string | null;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    duration_minutes: number | null;
    total_volume_kg: number | null;
    estimated_burn_kcal: number | null;
};

type SessionExerciseDetailRow = {
    id: string;
    session_id: string;
    exercise_id: string;
    exercise_name: string;
    sort_order: number;
};

type SetDetailRow = {
    id: string;
    session_exercise_id: string;
    sort_order: number;
    weight_kg: number | null;
    reps: number | null;
    rpe: number | null;
    completed: boolean;
};
