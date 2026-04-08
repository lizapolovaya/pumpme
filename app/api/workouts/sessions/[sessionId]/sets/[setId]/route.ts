import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../../../../lib/server/backend';
import { jsonError, parseJsonBody, parseWorkoutSetUpdate } from '../../../../../../../lib/server/backend/http';

type RouteContext = {
    params: Promise<{
        sessionId: string;
        setId: string;
    }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { sessionId, setId } = await context.params;
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseWorkoutSetUpdate(body);
        const services = createBackendServices(userId);
        const session = await services.workouts.updateSet(sessionId, setId, input);

        return NextResponse.json(session);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update workout set';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const { sessionId, setId } = await context.params;
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const session = await services.workouts.removeSet(sessionId, setId);

        return NextResponse.json(session);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to remove workout set', 500);
    }
}
