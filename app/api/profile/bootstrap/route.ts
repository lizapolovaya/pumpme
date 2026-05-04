import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseWorkoutDate } from '../../../../lib/server/backend/http';
import type { GoogleConnectionDto, ProfileBootstrapResponse } from '../../../../lib/server/backend/types';
import { getGoogleConnectionSummary } from '../../../../lib/server/auth/google-fit';

const unavailableGoogleConnection: GoogleConnectionDto = {
    available: false,
    connected: false,
    email: null,
    fitnessScopeGranted: false,
    lastSyncAt: null,
    lastSyncError: null
};

function unwrapSettledResult<T>(result: PromiseSettledResult<T>): T {
    if (result.status === 'rejected') {
        throw result.reason;
    }

    return result.value;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = parseWorkoutDate(searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const [activity, nutrition, preferences, profile, readiness, googleConnectionResult] = await Promise.allSettled([
            services.activity.getDay(date),
            services.nutrition.getDay(date),
            services.preferences.getPreferences(),
            services.profile.getProfile(),
            services.readiness.getDay(date),
            getGoogleConnectionSummary(userId)
        ]);

        const bootstrap: ProfileBootstrapResponse = {
            activity: unwrapSettledResult(activity),
            googleConnection: googleConnectionResult.status === 'fulfilled' ? googleConnectionResult.value : unavailableGoogleConnection,
            nutrition: unwrapSettledResult(nutrition),
            preferences: unwrapSettledResult(preferences),
            profile: unwrapSettledResult(profile),
            readiness: unwrapSettledResult(readiness)
        };

        return NextResponse.json(bootstrap);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load profile bootstrap', 500);
    }
}
