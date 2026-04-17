import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseWorkoutDate } from '../../../../lib/server/backend/http';
import type { WorkoutsBootstrapResponse } from '../../../../lib/server/backend/types';

function parseEditFlag(value: string | null): boolean {
    return value === '1';
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = parseWorkoutDate(searchParams.get('date'));
        const allowEditingCompleted = parseEditFlag(searchParams.get('edit'));
        const today = new Date().toISOString().slice(0, 10);
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const [session, templates] = await Promise.all([
            date === today || allowEditingCompleted
                ? services.workouts.getSessionByDate(date)
                : services.workouts.findSessionByDate(date),
            services.workouts.listTemplates()
        ]);

        const bootstrap: WorkoutsBootstrapResponse = {
            session,
            templates
        };

        return NextResponse.json(bootstrap);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load workouts bootstrap', 500);
    }
}
