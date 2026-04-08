import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../../../../lib/server/backend';
import {
    jsonError,
    parseJsonBody,
    parseWorkoutExerciseUpdate
} from '../../../../../../../lib/server/backend/http';

type RouteContext = {
    params: Promise<{
        sessionId: string;
        exerciseRowId: string;
    }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const { sessionId, exerciseRowId } = await context.params;
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseWorkoutExerciseUpdate(body);
        const services = createBackendServices(userId);
        const session = await services.workouts.updateExercise(sessionId, exerciseRowId, input);

        return NextResponse.json(session);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update workout exercise';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}

export async function DELETE(_request: Request, context: RouteContext) {
    try {
        const { sessionId, exerciseRowId } = await context.params;
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const session = await services.workouts.removeExercise(sessionId, exerciseRowId);

        return NextResponse.json(session);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to remove workout exercise', 500);
    }
}
