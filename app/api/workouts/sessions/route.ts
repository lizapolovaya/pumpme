import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import {
    jsonError,
    parseJsonBody,
    parseWorkoutDate,
    parseWorkoutSessionStart
} from '../../../../lib/server/backend/http';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = parseWorkoutDate(searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const session = await services.workouts.getSessionByDate(date);

        return NextResponse.json(session);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load workout session', 500);
    }
}

export async function POST(request: Request) {
    try {
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseWorkoutSessionStart(body);
        const services = createBackendServices(userId);
        const session = await services.workouts.startSession(input);

        return NextResponse.json(session, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create workout session';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}
