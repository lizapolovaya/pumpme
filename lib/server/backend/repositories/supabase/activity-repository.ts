import type { SupabaseClient } from '@supabase/supabase-js';
import type { ActivityRepository } from '../contracts';
import type { ActivityDayDto, UpdateActivityDayInput } from '../../types';
import { ensureScaffoldForDate, toIsoDate } from './shared';
import { requireSupabaseOk } from './client';

type ActivityRow = {
    steps: number;
    active_minutes: number | null;
    source?: string | null;
    last_synced_at?: string | null;
};

function isMissingSchemaError(error: { message?: string } | null): boolean {
    if (!error?.message) {
        return false;
    }

    return error.message.includes('does not exist') || error.message.includes('schema cache') || error.message.includes('Could not find the');
}

function mapActivityRow(date: string, row: ActivityRow): ActivityDayDto {
    const isUnsyncedLegacyRow = !row.source && !row.last_synced_at && row.steps === 8500 && row.active_minutes === 74;

    return {
        date,
        steps: isUnsyncedLegacyRow ? 0 : row.steps,
        activeMinutes: isUnsyncedLegacyRow ? null : row.active_minutes,
        lastSyncedAt: row.last_synced_at ?? null,
        source: row.source === 'health_connect' || row.source === 'google_fit' ? row.source : null
    };
}

export class SupabaseActivityRepository implements ActivityRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getActivityDay(userId: string, date: string) {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);

        const result = await this.client
            .from('activity_daily_summaries')
            .select('steps,active_minutes,source,last_synced_at')
            .eq('user_id', userId)
            .eq('date', normalizedDate)
            .single();
        const fallbackResult = isMissingSchemaError(result.error)
            ? await this.client
                  .from('activity_daily_summaries')
                  .select('steps,active_minutes')
                  .eq('user_id', userId)
                  .eq('date', normalizedDate)
                  .single()
            : result;
        const row = requireSupabaseOk(fallbackResult as any, 'Activity not found') as ActivityRow;

        return mapActivityRow(normalizedDate, row);
    }

    async syncActivityDay(userId: string, date: string, input: UpdateActivityDayInput) {
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);
        const current = await this.getActivityDay(userId, normalizedDate);
        const nextSyncedAt = input.syncedAt ?? new Date().toISOString();

        if (current.lastSyncedAt && current.lastSyncedAt > nextSyncedAt) {
            return current;
        }

        let result = await this.client
            .from('activity_daily_summaries')
            .update({
                steps: input.steps,
                active_minutes: input.activeMinutes === undefined ? current.activeMinutes : input.activeMinutes,
                source: input.source,
                last_synced_at: nextSyncedAt
            })
            .eq('user_id', userId)
            .eq('date', normalizedDate);

        if (isMissingSchemaError(result.error)) {
            result = await this.client
                .from('activity_daily_summaries')
                .update({
                    steps: input.steps,
                    active_minutes: input.activeMinutes === undefined ? current.activeMinutes : input.activeMinutes
                })
                .eq('user_id', userId)
                .eq('date', normalizedDate);
        }

        if (result.error) {
            throw result.error;
        }

        const synced = await this.getActivityDay(userId, normalizedDate);
        return synced.source || synced.lastSyncedAt
            ? synced
            : {
                  ...synced,
                  source: input.source,
                  lastSyncedAt: nextSyncedAt
              };
    }
}
