import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../lib/server/backend';
import { jsonError, parseWorkoutDate } from '../../../lib/server/backend/http';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = parseWorkoutDate(searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const bootstrap = await services.dashboard.getBootstrap(date);

        return NextResponse.json(bootstrap);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load bootstrap', 500);
    }
}
