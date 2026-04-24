import { createBackendServices } from '../backend/services';
import type { ActivityDayDto, GoogleConnectionDto } from '../backend/types';
import { GOOGLE_HEALTH_ACTIVITY_SCOPE } from './constants';
import {
    getGoogleConnection,
    hasGoogleHealthActivityScope,
    refreshGoogleAccessToken,
    isGoogleConnectionStoreAvailable,
    updateGoogleSyncResult
} from './google-connection';

function getDayRange(date: string) {
    return {
        endTime: `${date}T23:59:59Z`,
        startTime: `${date}T00:00:00Z`
    };
}

function readStepCountFromDailyRollup(payload: Record<string, unknown>): number {
    const points = Array.isArray(payload.rollupDataPoints) ? payload.rollupDataPoints : [];
    let total = 0;

    for (const point of points) {
        if (!point || typeof point !== 'object') {
            continue;
        }

        const steps = (point as { steps?: { countSum?: unknown } }).steps;
        const countSum = steps?.countSum;

        if (typeof countSum === 'string') {
            total += Number.parseInt(countSum, 10) || 0;
            continue;
        }

        if (typeof countSum === 'number' && Number.isFinite(countSum)) {
            total += countSum;
        }
    }

    return total;
}

export async function getGoogleConnectionSummary(userId: string): Promise<GoogleConnectionDto> {
    if (!isGoogleConnectionStoreAvailable()) {
        return {
            available: false,
            connected: false,
            email: null,
            fitnessScopeGranted: false,
            lastSyncAt: null,
            lastSyncError: null
        };
    }

    const connection = await getGoogleConnection(userId);

    return {
        available: true,
        connected: Boolean(connection?.refreshToken),
        email: connection?.email ?? null,
        fitnessScopeGranted: connection ? hasGoogleHealthActivityScope(connection.scopes) : false,
        lastSyncAt: connection?.lastSyncAt ?? null,
        lastSyncError: connection?.lastSyncError ?? null
    };
}

export async function syncGoogleStepsForDate(userId: string, date: string): Promise<ActivityDayDto> {
    if (!isGoogleConnectionStoreAvailable()) {
        throw new Error('Google step sync requires PUMPME_STORAGE_DRIVER=supabase');
    }

    const connection = await getGoogleConnection(userId);

    if (!connection || !connection.refreshToken) {
        throw new Error('Google account is not connected.');
    }

    if (!hasGoogleHealthActivityScope(connection.scopes)) {
        throw new Error(
            `Google account is connected without ${GOOGLE_HEALTH_ACTIVITY_SCOPE}. Reconnect Google and grant activity access.`
        );
    }

    const { accessToken } = await refreshGoogleAccessToken(connection);
    const { endTime, startTime } = getDayRange(date);
    const response = await fetch('https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints:dailyRollUp', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        },
        cache: 'no-store',
        body: JSON.stringify({
            range: {
                startTime,
                endTime
            }
        })
    });

    const payload = (await response.json()) as Record<string, unknown> & { error?: { message?: string } };

    if (!response.ok) {
        const message = payload.error?.message ?? 'Unable to read Google Health API steps';
        await updateGoogleSyncResult(userId, {
            lastSyncError: message
        });
        throw new Error(message);
    }

    const steps = readStepCountFromDailyRollup(payload);
    const syncedAt = new Date().toISOString();
    const services = createBackendServices(userId);
    const activity = await services.activity.syncDay(date, {
        source: 'google_health',
        steps,
        syncedAt
    });

    await updateGoogleSyncResult(userId, {
        lastSyncAt: syncedAt,
        lastSyncError: null
    });

    return activity;
}
