import { headers } from 'next/headers';
import type { UserContext } from './types';
import { createSupabaseServerAuthClient } from '../auth/supabase';
import { ensureBackendUserFromAuthUser } from '../auth/users';
import { isSupabaseAuthEnabled } from '../auth/config';

export const DEFAULT_LOCAL_USER_ID = 'local-user';

export class AuthenticationError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

export async function resolveCurrentUserContext(): Promise<UserContext> {
    if (isSupabaseAuthEnabled()) {
        const client = await createSupabaseServerAuthClient();

        if (!client) {
            throw new AuthenticationError();
        }

        const {
            data: { user },
            error
        } = await client.auth.getUser();

        if (error || !user) {
            throw new AuthenticationError();
        }

        await ensureBackendUserFromAuthUser(user);

        return {
            userId: user.id
        };
    }

    try {
        const requestHeaders = await headers();
        const forwardedUserId = requestHeaders.get('x-pumpme-user-id');

        return {
            userId: forwardedUserId ?? DEFAULT_LOCAL_USER_ID
        };
    } catch {
        // Tests and local backend probes run outside Next request scope.
        return {
            userId: DEFAULT_LOCAL_USER_ID
        };
    }
}
