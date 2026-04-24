import { createBackendServices } from '../backend/services';
import type { ActivityDayDto, GoogleConnectionDto } from '../backend/types';
import { GOOGLE_FIT_ACTIVITY_SCOPE } from './constants';
import {
    getGoogleConnection,
    hasGoogleFitnessScope,
    refreshGoogleAccessToken,
    isGoogleConnectionStoreAvailable,
    updateGoogleSyncResult
} from './google-connection';

function getDayRange(date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    return {
        endTimeMillis: end.getTime(),
        startTimeMillis: start.getTime()
    };
}

function readStepCountFromAggregate(payload: Record<string, unknown>): number {
    const buckets = Array.isArray(payload.bucket) ? payload.bucket : [];

    for (const bucket of buckets) {
        if (!bucket || typeof bucket !== 'object') {
            continue;
        }

        const datasets = Array.isArray((bucket as { dataset?: unknown[] }).dataset) ? (bucket as { dataset: unknown[] }).dataset : [];

        for (const dataset of datasets) {
            if (!dataset || typeof dataset !== 'object') {
                continue;
            }

            const points = Array.isArray((dataset as { point?: unknown[] }).point) ? (dataset as { point: unknown[] }).point : [];

            for (const point of points) {
                if (!point || typeof point !== 'object') {
                    continue;
                }

                const values = Array.isArray((point as { value?: unknown[] }).value) ? (point as { value: unknown[] }).value : [];

                for (const value of values) {
                    if (!value || typeof value !== 'object') {
                        continue;
                    }

                    const intVal = (value as { intVal?: unknown }).intVal;

                    if (typeof intVal === 'number' && Number.isFinite(intVal)) {
                        return intVal;
                    }
                }
            }
        }
    }

    return 0;
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
        fitnessScopeGranted: connection ? hasGoogleFitnessScope(connection.scopes) : false,
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

    if (!hasGoogleFitnessScope(connection.scopes)) {
        throw new Error(`Google account is connected without ${GOOGLE_FIT_ACTIVITY_SCOPE}. Reconnect Google and grant activity access.`);
    }

    const { accessToken } = await refreshGoogleAccessToken(connection);
    const { endTimeMillis, startTimeMillis } = getDayRange(date);
    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        cache: 'no-store',
        body: JSON.stringify({
            aggregateBy: [
                {
                    dataTypeName: 'com.google.step_count.delta'
                }
            ],
            bucketByTime: {
                durationMillis: endTimeMillis - startTimeMillis + 1
            },
            endTimeMillis,
            startTimeMillis
        })
    });

    const payload = (await response.json()) as Record<string, unknown> & { error?: { message?: string } };

    if (!response.ok) {
        const message = payload.error?.message ?? 'Unable to read Google Fit steps';
        await updateGoogleSyncResult(userId, {
            lastSyncError: message
        });
        throw new Error(message);
    }

    const steps = readStepCountFromAggregate(payload);
    const syncedAt = new Date().toISOString();
    const services = createBackendServices(userId);
    const activity = await services.activity.syncDay(date, {
        source: 'google_fit',
        steps,
        syncedAt
    });

    await updateGoogleSyncResult(userId, {
        lastSyncAt: syncedAt,
        lastSyncError: null
    });

    return activity;
}
