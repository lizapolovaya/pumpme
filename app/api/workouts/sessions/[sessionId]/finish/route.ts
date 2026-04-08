import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../../../lib/server/backend';
import { jsonError } from '../../../../../../lib/server/backend/http';

type RouteContext = {
    params: Promise<{
        sessionId: string;
    }>;
};

export async function POST(_request: Request, context: RouteContext) {
    try {
        const { sessionId } = await context.params;
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const session = await services.workouts.finishSession(sessionId);

        return NextResponse.json(session);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to finish workout session', 500);
    }
}
