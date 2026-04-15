import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../../lib/server/backend';
import { jsonError, parseJsonBody, parseWorkoutSessionUpdate } from '../../../../../lib/server/backend/http';

type RouteContext = {
    params: Promise<{
        sessionId: string;
    }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { sessionId } = await context.params;
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseWorkoutSessionUpdate(body);
        const services = createBackendServices(userId);
        const session = await services.workouts.updateSession(sessionId, input);

        return NextResponse.json(session);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update workout session';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}

export async function GET(_request: Request, context: RouteContext) {
    try {
        const { sessionId } = await context.params;
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const session = await services.workouts.getSession(sessionId);

        return NextResponse.json(session);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load workout session', 500);
    }
}
