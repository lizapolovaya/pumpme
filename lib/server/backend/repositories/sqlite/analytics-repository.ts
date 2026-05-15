import type { AnalyticsRepository } from '../contracts';
import type { ProgressLogDto, ProgressMetricsSummaryDto, ProgressPointDto, ProgressVolumeWeekDto } from '../../types';
import { ensureScaffoldForDate, getSqliteRepositoryDatabase, toIsoDate } from './shared';
import { buildWeeklyVolumeTrend, getVolumeTrendWindowStart, type WeeklyVolumeSession } from '../volume-trend';

type OneRmRow = {
    monthValue: string;
    oneRmValue: number;
};

type LogSummaryRow = {
    averageRpe: number | null;
    readinessScore: number | null;
};

export class SqliteAnalyticsRepository implements AnalyticsRepository {
    async getProgressSummary(userId: string, range: string): Promise<ProgressMetricsSummaryDto> {
        const db = getSqliteRepositoryDatabase();
        const now = new Date();
        const today = toIsoDate(now);
        ensureScaffoldForDate(db, userId, today);
        const rangeStart = this.getRangeStart(today, range);

        const volumeTrend = this.getVolumeTrend(db, userId, now);
        const oneRmTrend = this.getOneRmTrend(db, userId, rangeStart);
        const { averageRpe, logs, recoveryScore } = this.getLogs(db, userId, rangeStart);

        return {
            averageRpe,
            range,
            recoveryScore,
            volumeTrend,
            oneRmTrend,
            logs
        };
    }

    private getVolumeTrend(
        db: ReturnType<typeof getSqliteRepositoryDatabase>,
        userId: string,
        today: Date
    ): ProgressVolumeWeekDto[] {
        const windowStart = getVolumeTrendWindowStart(today);
        const sessions = db
            .prepare(`
                SELECT
                    workout_sessions.date AS date,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN workout_sets.weight_kg IS NOT NULL AND workout_sets.reps IS NOT NULL
                                    THEN workout_sets.weight_kg * workout_sets.reps
                                ELSE 0
                            END
                        ),
                        0
                    ) AS totalVolumeKg
                FROM workout_sessions
                LEFT JOIN workout_session_exercises
                    ON workout_session_exercises.session_id = workout_sessions.id
                LEFT JOIN workout_sets
                    ON workout_sets.session_exercise_id = workout_session_exercises.id
                WHERE workout_sessions.user_id = ?
                  AND workout_sessions.date >= ?
                GROUP BY workout_sessions.id, workout_sessions.date
                HAVING totalVolumeKg > 0
                ORDER BY workout_sessions.date ASC
            `)
            .all(userId, windowStart) as WeeklyVolumeSession[];

        return buildWeeklyVolumeTrend(sessions, today);
    }

    private getOneRmTrend(
        db: ReturnType<typeof getSqliteRepositoryDatabase>,
        userId: string,
        rangeStart: string
    ): ProgressPointDto[] {
        const rows = db
            .prepare(`
                SELECT
                    strftime('%Y-%m', workout_sessions.date) AS monthValue,
                    MAX(workout_sets.weight_kg * (1 + (COALESCE(workout_sets.reps, 0) / 30.0))) AS oneRmValue
                FROM workout_sets
                INNER JOIN workout_session_exercises
                    ON workout_session_exercises.id = workout_sets.session_exercise_id
                INNER JOIN workout_sessions
                    ON workout_sessions.id = workout_session_exercises.session_id
                WHERE workout_sessions.user_id = ?
                  AND workout_sessions.date >= ?
                  AND workout_sessions.status = 'completed'
                  AND workout_sets.completed = 1
                  AND workout_sets.weight_kg IS NOT NULL
                  AND workout_sets.reps IS NOT NULL
                GROUP BY strftime('%Y-%m', workout_sessions.date)
                ORDER BY monthValue DESC
                LIMIT 4
            `)
            .all(userId, rangeStart) as OneRmRow[];

        if (!rows.length) {
            return [
                { label: 'Nov', value: 215 },
                { label: 'Dec', value: 220 },
                { label: 'Jan', value: 235 },
                { label: 'Feb', value: 245 }
            ];
        }

        return rows.reverse().map((row) => ({
            label: this.formatMonthLabel(row.monthValue),
            value: Math.round(row.oneRmValue)
        }));
    }

    private getLogs(
        db: ReturnType<typeof getSqliteRepositoryDatabase>,
        userId: string,
        rangeStart: string
    ): { averageRpe: number; logs: ProgressLogDto[]; recoveryScore: number } {
        const row = db
            .prepare(`
                SELECT
                    AVG(workout_sets.rpe) AS averageRpe,
                    AVG(daily_readiness.score) AS readinessScore
                FROM workout_sessions
                LEFT JOIN workout_session_exercises
                    ON workout_session_exercises.session_id = workout_sessions.id
                LEFT JOIN workout_sets
                    ON workout_sets.session_exercise_id = workout_session_exercises.id
                LEFT JOIN daily_readiness
                    ON daily_readiness.user_id = workout_sessions.user_id
                   AND daily_readiness.date = workout_sessions.date
                WHERE workout_sessions.user_id = ?
                  AND workout_sessions.date >= ?
                  AND workout_sessions.status = 'completed'
            `)
            .get(userId, rangeStart) as LogSummaryRow;

        const averageRpe = row.averageRpe ? Number(row.averageRpe.toFixed(1)) : 8.2;
        const readinessScore = row.readinessScore ? Math.round(row.readinessScore) : 92;

        return {
            averageRpe,
            logs: [],
            recoveryScore: readinessScore
        };
    }

    private parseRangeDays(range: string): number {
        const match = /^(\d+)d$/.exec(range.trim());
        const days = match ? Number.parseInt(match[1], 10) : 30;

        if (!Number.isFinite(days) || days <= 0) {
            return 30;
        }

        return days;
    }

    private getRangeStart(today: string, range: string): string {
        if (range.trim().toLowerCase() === 'mtd') {
            const date = new Date(`${today}T00:00:00.000Z`);
            date.setUTCDate(1);
            return toIsoDate(date);
        }

        const rangeDays = this.parseRangeDays(range);
        const date = new Date(`${today}T00:00:00.000Z`);
        date.setUTCDate(date.getUTCDate() - Math.max(0, rangeDays - 1));
        return toIsoDate(date);
    }

    private formatMonthLabel(monthValue: string): string {
        const [year, month] = monthValue.split('-').map((value) => Number.parseInt(value, 10));

        if (!year || !month) {
            return 'N/A';
        }

        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            timeZone: 'UTC'
        }).format(new Date(Date.UTC(year, month - 1, 1)));
    }
}
