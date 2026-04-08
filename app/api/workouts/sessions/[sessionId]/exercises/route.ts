import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../../../lib/server/backend';
import { jsonError, parseJsonBody, parseWorkoutExerciseAdd } from '../../../../../../lib/server/backend/http';

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
        const input = parseWorkoutExerciseAdd(body);
        const services = createBackendServices(userId);
        const session = await services.workouts.addExercise(sessionId, input);

        return NextResponse.json(session, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to add workout exercise';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}
