import type { AnalyticsRepository } from '../contracts';
import type { ProgressLogDto, ProgressPointDto, ProgressSummaryDto } from '../../types';
import { ensureScaffoldForDate, getSqliteRepositoryDatabase, toIsoDate } from './shared';

type WeeklyVolumeRow = {
    weekLabel: string;
    totalVolumeKg: number;
};

type OneRmRow = {
    monthValue: string;
    oneRmValue: number;
};

type LogSummaryRow = {
    averageRpe: number | null;
    readinessScore: number | null;
};

export class SqliteAnalyticsRepository implements AnalyticsRepository {
    async getProgressSummary(userId: string, range: string): Promise<ProgressSummaryDto> {
        const db = getSqliteRepositoryDatabase();
        const today = toIsoDate(new Date());
        ensureScaffoldForDate(db, userId, today);
        const rangeDays = this.parseRangeDays(range);
        const rangeStart = this.getRangeStart(today, rangeDays);

        const volumeTrend = this.getVolumeTrend(db, userId, rangeStart);
        const oneRmTrend = this.getOneRmTrend(db, userId, rangeStart);
        const logs = this.getLogs(db, userId, rangeStart);

        return {
            range,
            volumeTrend,
            oneRmTrend,
            logs
        };
    }

    private getVolumeTrend(
        db: ReturnType<typeof getSqliteRepositoryDatabase>,
        userId: string,
        rangeStart: string
    ): ProgressPointDto[] {
        const rows = db
            .prepare(`
                SELECT
                    printf('W%s', CAST(strftime('%W', date) AS INTEGER) + 1) AS weekLabel,
                    COALESCE(SUM(total_volume_kg), 0) AS totalVolumeKg
                FROM workout_sessions
                WHERE user_id = ?
                  AND date >= ?
                  AND status = 'completed'
                GROUP BY strftime('%Y-%W', date)
                ORDER BY date DESC
                LIMIT 8
            `)
            .all(userId, rangeStart) as WeeklyVolumeRow[];

        if (!rows.length) {
            return Array.from({ length: 8 }, (_, index) => ({
                label: `W${index + 1}`,
                value: 0
            }));
        }

        return rows.reverse().map((row) => ({
            label: row.weekLabel,
            value: Math.round(row.totalVolumeKg)
        }));
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
    ): ProgressLogDto[] {
        const row = db
            .prepare(`
                SELECT
                    AVG(rpe) AS averageRpe,
                    AVG(score) AS readinessScore
                FROM workout_sets
                LEFT JOIN workout_session_exercises
                    ON workout_session_exercises.id = workout_sets.session_exercise_id
                LEFT JOIN workout_sessions
                    ON workout_sessions.id = workout_session_exercises.session_id
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

        return [
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
    }

    private parseRangeDays(range: string): number {
        const match = /^(\d+)d$/.exec(range.trim());
        const days = match ? Number.parseInt(match[1], 10) : 30;

        if (!Number.isFinite(days) || days <= 0) {
            return 30;
        }

        return days;
    }

    private getRangeStart(today: string, rangeDays: number): string {
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
