import type { CalendarRepository } from '../contracts';
import type {
    CalendarDayDetailDto,
    CalendarDayMarkerDto,
    CalendarMonthDto,
    WorkoutSessionDto,
    WorkoutSessionExerciseDto,
    WorkoutSetDto
} from '../../types';
import { ensureScaffoldForDate, getSqliteRepositoryDatabase, toIsoDate } from './shared';

type SessionSummaryRow = {
    date: string;
    sessionCount: number;
    completedCount: number;
    totalVolumeKg: number | null;
};

type SessionRow = {
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

type SessionExerciseRow = {
    id: string;
    session_id: string;
    exercise_id: string;
    exercise_name: string;
    sort_order: number;
};

type SetRow = {
    id: string;
    session_exercise_id: string;
    sort_order: number;
    weight_kg: number | null;
    reps: number | null;
    rpe: number | null;
    completed: number;
};

export class SqliteCalendarRepository implements CalendarRepository {
    async getMonth(
        userId: string,
        year: number,
        month: number,
        selectedDate?: string
    ): Promise<CalendarMonthDto> {
        const db = getSqliteRepositoryDatabase();
        const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
        const normalizedSelectedDate =
            selectedDate ?? firstOfMonth.toISOString().slice(0, 10);

        ensureScaffoldForDate(db, userId, normalizedSelectedDate);

        const gridStart = new Date(firstOfMonth);
        gridStart.setUTCDate(1 - ((firstOfMonth.getUTCDay() + 6) % 7));

        const gridEnd = new Date(gridStart);
        gridEnd.setUTCDate(gridStart.getUTCDate() + 27);

        const rows = db
            .prepare(`
                SELECT
                    date,
                    SUM(
                        CASE
                            WHEN status = 'completed'
                              OR EXISTS (
                                  SELECT 1
                                  FROM workout_session_exercises exercises
                                  WHERE exercises.session_id = workout_sessions.id
                              )
                              OR EXISTS (
                                  SELECT 1
                                  FROM workout_sets sets
                                  JOIN workout_session_exercises exercises
                                    ON exercises.id = sets.session_exercise_id
                                  WHERE exercises.session_id = workout_sessions.id
                                    AND (
                                        sets.weight_kg IS NOT NULL
                                        OR sets.reps IS NOT NULL
                                        OR sets.rpe IS NOT NULL
                                        OR sets.completed = 1
                                    )
                              )
                            THEN 1
                            ELSE 0
                        END
                    ) AS sessionCount,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completedCount,
                    SUM(
                        CASE
                            WHEN status = 'completed' THEN COALESCE(total_volume_kg, 0)
                            ELSE (
                                SELECT COALESCE(SUM(COALESCE(sets.weight_kg, 0) * COALESCE(sets.reps, 0)), 0)
                                FROM workout_sets sets
                                JOIN workout_session_exercises exercises
                                  ON exercises.id = sets.session_exercise_id
                                WHERE exercises.session_id = workout_sessions.id
                            )
                        END
                    ) AS totalVolumeKg
                FROM workout_sessions
                WHERE user_id = ?
                  AND date BETWEEN ? AND ?
                GROUP BY date
            `)
            .all(
                userId,
                gridStart.toISOString().slice(0, 10),
                gridEnd.toISOString().slice(0, 10)
            ) as SessionSummaryRow[];

        const rowsByDate = new Map(rows.map((row) => [row.date, row]));
        const days: CalendarDayMarkerDto[] = [];

        for (let index = 0; index < 28; index += 1) {
            const current = new Date(gridStart);
            current.setUTCDate(gridStart.getUTCDate() + index);
            const currentDate = current.toISOString().slice(0, 10);
            const row = rowsByDate.get(currentDate);
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
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        const sessions = db
            .prepare(`
                SELECT id, template_id, date, title, focus, status, duration_minutes, total_volume_kg, estimated_burn_kcal
                FROM workout_sessions
                WHERE user_id = ? AND date = ?
                ORDER BY created_at DESC
            `)
            .all(userId, normalizedDate) as SessionRow[];

        if (!sessions.length) {
            return {
                date: normalizedDate,
                sessions: []
            } satisfies CalendarDayDetailDto;
        }

        const sessionIds = sessions.map((session) => session.id);
        const exercises = db
            .prepare(`
                SELECT id, session_id, exercise_id, exercise_name, sort_order
                FROM workout_session_exercises
                WHERE session_id IN (${sessionIds.map(() => '?').join(',')})
                ORDER BY sort_order ASC
            `)
            .all(...sessionIds) as SessionExerciseRow[];

        const exerciseIds = exercises.map((exercise) => exercise.id);
        const sets = exerciseIds.length
            ? (db
                  .prepare(`
                SELECT id, session_exercise_id, sort_order, weight_kg, reps, rpe, completed
                FROM workout_sets
                WHERE session_exercise_id IN (${exerciseIds.map(() => '?').join(',')})
                ORDER BY sort_order ASC
            `)
                  .all(...exerciseIds) as SetRow[])
            : [];

        const session = this.selectRelevantSession(sessions, exercises, sets);

        return {
            date: normalizedDate,
            sessions: session ? [session] : []
        } satisfies CalendarDayDetailDto;
    }

    private selectRelevantSession(
        sessions: SessionRow[],
        exercises: SessionExerciseRow[],
        sets: SetRow[]
    ): WorkoutSessionDto | null {
        const exerciseIdsBySessionId = new Map<string, string[]>();
        for (const exercise of exercises) {
            exerciseIdsBySessionId.set(exercise.session_id, [
                ...(exerciseIdsBySessionId.get(exercise.session_id) ?? []),
                exercise.id
            ]);
        }

        const hasSessionEntries = (sessionId: string): boolean => {
            const sessionExerciseIds = exerciseIdsBySessionId.get(sessionId) ?? [];
            if (sessionExerciseIds.length > 0) {
                return true;
            }

            return sets.some((set) => {
                if (!sessionExerciseIds.includes(set.session_exercise_id)) {
                    return false;
                }

                return set.completed === 1 || set.weight_kg !== null || set.reps !== null || set.rpe !== null;
            });
        };

        const chosenSession =
            sessions.find((session) => session.status === 'completed' || session.total_volume_kg !== null) ??
            sessions.find((session) => hasSessionEntries(session.id)) ??
            null;

        if (!chosenSession) {
            return null;
        }

        return this.mapSession(chosenSession, exercises, sets);
    }

    private mapSession(
        session: SessionRow,
        exercises: SessionExerciseRow[],
        sets: SetRow[]
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
