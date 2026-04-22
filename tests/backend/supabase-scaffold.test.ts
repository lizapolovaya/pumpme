import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ensureDailyScaffold,
    ensureDefaultTemplates,
    ensureUserScaffold
} from '../../lib/server/backend/repositories/supabase/shared';

type UpsertCall = {
    table: string;
    options: Record<string, unknown> | undefined;
};

function createMockSupabaseClient() {
    const calls: UpsertCall[] = [];

    return {
        calls,
        client: {
            from(table: string) {
                return {
                    upsert(_values: unknown, options?: Record<string, unknown>) {
                        calls.push({ table, options });
                        return Promise.resolve({ error: null });
                    }
                };
            }
        }
    };
}

test('supabase scaffold only seeds missing rows', async () => {
    const { calls, client } = createMockSupabaseClient();

    await ensureUserScaffold(client as never, 'local-user');
    await ensureDefaultTemplates(client as never, 'local-user');
    await ensureDailyScaffold(client as never, 'local-user', '2026-04-22');

    const seededTables = new Map(calls.map((call) => [call.table, call.options]));

    assert.equal(seededTables.get('users')?.ignoreDuplicates, true);
    assert.equal(seededTables.get('user_preferences')?.ignoreDuplicates, true);
    assert.equal(seededTables.get('user_metrics')?.ignoreDuplicates, true);
    assert.equal(seededTables.get('workout_templates')?.ignoreDuplicates, true);
    assert.equal(seededTables.get('template_exercises')?.ignoreDuplicates, true);
    assert.equal(seededTables.get('daily_readiness')?.ignoreDuplicates, true);
    assert.equal(seededTables.get('daily_nutrition_targets')?.ignoreDuplicates, true);
    assert.equal(seededTables.get('daily_nutrition_totals')?.ignoreDuplicates, true);
    assert.equal(seededTables.get('activity_daily_summaries')?.ignoreDuplicates, true);
});
