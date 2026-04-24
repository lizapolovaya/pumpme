import type { ActivityRepository } from '../contracts';
import type { ActivityDayDto, UpdateActivityDayInput } from '../../types';
import { ensureScaffoldForDate, getSqliteRepositoryDatabase, toIsoDate } from './shared';

type ActivityRow = {
    steps: number;
    active_minutes: number | null;
    source: string | null;
    last_synced_at: string | null;
};

function mapActivityRow(date: string, row: ActivityRow): ActivityDayDto {
    const isUnsyncedLegacyRow = !row.source && !row.last_synced_at && row.steps === 8500 && row.active_minutes === 74;
    const normalizedSource =
        row.source === 'google_fit' || row.source === 'google_health'
            ? 'google_health'
            : row.source === 'health_connect'
              ? 'health_connect'
              : null;

    return {
        date,
        steps: isUnsyncedLegacyRow ? 0 : row.steps,
        activeMinutes: isUnsyncedLegacyRow ? null : row.active_minutes,
        lastSyncedAt: row.last_synced_at,
        source: normalizedSource
    };
}

export class SqliteActivityRepository implements ActivityRepository {
    async getActivityDay(userId: string, date: string) {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);

        const row = db
            .prepare(`
                SELECT steps, active_minutes, source, last_synced_at
                FROM activity_daily_summaries
                WHERE user_id = ? AND date = ?
            `)
            .get(userId, normalizedDate) as ActivityRow | undefined;

        if (!row) {
            throw new Error(`Activity not found for user ${userId} on ${normalizedDate}`);
        }

        return mapActivityRow(normalizedDate, row);
    }

    async syncActivityDay(userId: string, date: string, input: UpdateActivityDayInput) {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);
        const current = await this.getActivityDay(userId, normalizedDate);
        const nextSyncedAt = input.syncedAt ?? new Date().toISOString();

        if (current.lastSyncedAt && current.lastSyncedAt > nextSyncedAt) {
            return current;
        }

        db.prepare(`
            UPDATE activity_daily_summaries
            SET steps = @steps,
                active_minutes = @activeMinutes,
                source = @source,
                last_synced_at = @lastSyncedAt,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = @userId AND date = @date
        `).run({
            userId,
            date: normalizedDate,
            steps: input.steps,
            activeMinutes: input.activeMinutes === undefined ? current.activeMinutes : input.activeMinutes,
            source: input.source,
            lastSyncedAt: nextSyncedAt
        });

        return this.getActivityDay(userId, normalizedDate);
    }
}
