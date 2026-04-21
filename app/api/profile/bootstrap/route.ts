import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseWorkoutDate } from '../../../../lib/server/backend/http';
import type { ProfileBootstrapResponse } from '../../../../lib/server/backend/types';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = parseWorkoutDate(searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const [nutrition, nutritionSettings, preferences, profile, readiness] = await Promise.all([
            services.nutrition.getDay(date),
            services.nutrition.getSettings(),
            services.preferences.getPreferences(),
            services.profile.getProfile(),
            services.readiness.getDay(date)
        ]);

        const bootstrap: ProfileBootstrapResponse = {
            nutrition,
            nutritionSettings,
            preferences,
            profile,
            readiness
        };

        return NextResponse.json(bootstrap);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load profile bootstrap', 500);
    }
}
