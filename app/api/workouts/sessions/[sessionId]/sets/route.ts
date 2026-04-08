import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../../../lib/server/backend';
import { jsonError, parseJsonBody, parseWorkoutSetAdd } from '../../../../../../lib/server/backend/http';

type RouteContext = {
    params: Promise<{
        sessionId: string;
    }>;
};

export async function POST(request: Request, context: RouteContext) {
    try {
        const { sessionId } = await context.params;
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseWorkoutSetAdd(body);
        const exerciseRowId = body.exerciseRowId;

        if (typeof exerciseRowId !== 'string' || exerciseRowId.trim().length === 0) {
            return jsonError('exerciseRowId must be a non-empty string');
        }

        const services = createBackendServices(userId);
        const session = await services.workouts.addSet(sessionId, exerciseRowId.trim(), input);

        return NextResponse.json(session, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to add workout set';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}
