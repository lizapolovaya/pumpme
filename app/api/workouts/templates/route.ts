import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError } from '../../../../lib/server/backend/http';

export async function GET() {
    try {
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const templates = await services.workouts.listTemplates();

        return NextResponse.json(templates);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load workout templates', 500);
    }
}
