import type { ReadinessRepository } from '../contracts';
import type { UpdateReadinessDayInput } from '../../types';
import { createId, ensureScaffoldForDate, getSqliteRepositoryDatabase, toIsoDate } from './shared';

export class SqliteReadinessRepository implements ReadinessRepository {
    async getReadinessDay(userId: string, date: string) {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);

        const row = db
            .prepare(`
                SELECT score, band, headline, summary
                FROM daily_readiness
                WHERE user_id = ? AND date = ?
            `)
            .get(userId, normalizedDate) as {
            score: number | null;
            band: 'low' | 'moderate' | 'high' | 'excellent';
            headline: string;
            summary: string;
        };

        return {
            date: normalizedDate,
            score: row.score,
            band: row.band,
            headline: row.headline,
            summary: row.summary
        };
    }

    async updateReadinessDay(userId: string, date: string, input: UpdateReadinessDayInput) {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);
        const current = await this.getReadinessDay(userId, normalizedDate);

        db.prepare(`
            UPDATE daily_readiness
            SET score = @score,
                band = @band,
                headline = @headline,
                summary = @summary,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = @userId AND date = @date
        `).run({
            userId,
            date: normalizedDate,
            score: input.score === undefined ? current.score : input.score,
            band: input.band ?? current.band,
            headline: input.headline ?? current.headline,
            summary: input.summary ?? current.summary
        });

        return this.getReadinessDay(userId, normalizedDate);
    }
}
