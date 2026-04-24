import type { User } from '@supabase/supabase-js';
import { getBackendConfig } from '../backend/config';
import { getDatabase } from '../backend/db';
import { createSupabaseServerClient } from '../backend/repositories/supabase/client';
import {
    ensureDailyScaffold as ensureSupabaseDailyScaffold,
    ensureDefaultTemplates as ensureSupabaseDefaultTemplates,
    ensureUserScaffold as ensureSupabaseUserScaffold
} from '../backend/repositories/supabase/shared';
import {
    ensureDailyScaffold as ensureSqliteDailyScaffold,
    ensureDefaultTemplates as ensureSqliteDefaultTemplates,
    ensureUserScaffold as ensureSqliteUserScaffold
} from '../backend/repositories/sqlite/shared';
import type { AuthenticatedUserSeed } from './types';

function getUserSeed(user: User): AuthenticatedUserSeed {
    const metadata = user.user_metadata ?? {};

    return {
        avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null,
        displayName:
            typeof metadata.full_name === 'string'
                ? metadata.full_name
                : typeof metadata.name === 'string'
                  ? metadata.name
                  : null,
        email: user.email ?? null
    };
}

export async function ensureBackendUserFromAuthUser(user: User): Promise<void> {
    const config = getBackendConfig();
    const seed = getUserSeed(user);
    const today = new Date().toISOString().slice(0, 10);

    if (config.storageDriver === 'supabase') {
        const client = createSupabaseServerClient(config.supabase);
        await ensureSupabaseUserScaffold(client, user.id, seed);
        await ensureSupabaseDefaultTemplates(client, user.id);
        await ensureSupabaseDailyScaffold(client, user.id, today);
        return;
    }

    const db = getDatabase();
    ensureSqliteUserScaffold(db, user.id, seed);
    ensureSqliteDefaultTemplates(db, user.id);
    ensureSqliteDailyScaffold(db, user.id, today);
}

