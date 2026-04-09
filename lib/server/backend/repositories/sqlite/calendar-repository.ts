import type { CalendarRepository } from '../contracts';
import type { CalendarDayMarkerDto, CalendarMonthDto } from '../../types';
import { ensureScaffoldForDate, getSqliteRepositoryDatabase, toIsoDate } from './shared';
import { SqliteWorkoutRepository } from './workout-repository';

type SessionSummaryRow = {
    date: string;
    sessionCount: number;
    completedCount: number;
    totalVolumeKg: number | null;
};

export class SqliteCalendarRepository implements CalendarRepository {
    constructor(private readonly workoutRepository = new SqliteWorkoutRepository()) {}

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
        const normalizedDate = toIsoDate(date);
        const session = await this.workoutRepository.findSessionByDate(userId, normalizedDate);

        return {
            date: normalizedDate,
            sessions: session ? [session] : []
        };
    }
}
