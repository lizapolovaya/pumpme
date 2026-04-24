import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseWorkoutDate } from '../../../../lib/server/backend/http';
import type { ProfileBootstrapResponse } from '../../../../lib/server/backend/types';
import { getGoogleConnectionSummary } from '../../../../lib/server/auth/google-fit';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = parseWorkoutDate(searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const [activity, nutrition, preferences, profile, readiness, googleConnection] = await Promise.all([
            services.activity.getDay(date),
            services.nutrition.getDay(date),
            services.preferences.getPreferences(),
            services.profile.getProfile(),
            services.readiness.getDay(date),
            getGoogleConnectionSummary(userId)
        ]);

        const bootstrap: ProfileBootstrapResponse = {
            activity,
            googleConnection,
            nutrition,
            preferences,
            profile,
            readiness
        };

        return NextResponse.json(bootstrap);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load profile bootstrap', 500);
    }
}
