import { headers } from 'next/headers';
import type { UserContext } from './types';

export const DEFAULT_LOCAL_USER_ID = 'local-user';

export async function resolveCurrentUserContext(): Promise<UserContext> {
    const requestHeaders = await headers();
    const forwardedUserId = requestHeaders.get('x-pumpme-user-id');

    return {
        userId: forwardedUserId ?? DEFAULT_LOCAL_USER_ID
    };
}
