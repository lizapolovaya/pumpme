import { headers } from 'next/headers';
import type { UserContext } from './types';

export const DEFAULT_LOCAL_USER_ID = 'local-user';

export async function resolveCurrentUserContext(): Promise<UserContext> {
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
