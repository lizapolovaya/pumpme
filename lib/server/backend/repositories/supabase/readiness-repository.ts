import type { SupabaseClient } from '@supabase/supabase-js';
import type { ReadinessRepository } from '../contracts';
import type { UpdateReadinessDayInput } from '../../types';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';

type ReadinessRow = {
    score: number | null;
    band: 'low' | 'moderate' | 'high' | 'excellent';
    headline: string;
    summary: string;
};

export class SupabaseReadinessRepository implements ReadinessRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getReadinessDay(userId: string, date: string) {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);

        const result = await this.client
            .from('daily_readiness')
            .select('score,band,headline,summary')
            .eq('user_id', userId)
            .eq('date', normalizedDate)
            .single();

        const row = requireSupabaseOk(result as any, 'Readiness day not found') as ReadinessRow;

        return {
            date: normalizedDate,
            score: row.score,
            band: row.band,
            headline: row.headline,
            summary: row.summary
        };
    }

    async updateReadinessDay(userId: string, date: string, input: UpdateReadinessDayInput) {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);
        const current = await this.getReadinessDay(userId, normalizedDate);

        const update = await this.client
            .from('daily_readiness')
            .update({
                score: input.score === undefined ? current.score : input.score,
                band: input.band ?? current.band,
                headline: input.headline ?? current.headline,
                summary: input.summary ?? current.summary
            })
            .eq('user_id', userId)
            .eq('date', normalizedDate);
        if (update.error) {
            throw update.error;
        }

        return this.getReadinessDay(userId, normalizedDate);
    }
}
