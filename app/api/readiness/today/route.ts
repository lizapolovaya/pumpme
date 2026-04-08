import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseJsonBody, parseWorkoutDate } from '../../../../lib/server/backend/http';

function parseReadinessUpdate(body: Record<string, unknown>) {
    const input: Record<string, string | number | null> = {};

    if (body.score !== undefined) {
        if (body.score !== null && (!Number.isInteger(body.score) || (body.score as number) < 0)) {
            throw new Error('score must be a non-negative integer or null');
        }
        input.score = body.score as number | null;
    }

    if (body.band !== undefined) {
        if (
            typeof body.band !== 'string' ||
            !['low', 'moderate', 'high', 'excellent'].includes(body.band)
        ) {
            throw new Error('band is invalid');
        }
        input.band = body.band;
    }

    if (body.headline !== undefined) {
        if (typeof body.headline !== 'string' || body.headline.trim().length === 0) {
            throw new Error('headline must be a non-empty string');
        }
        input.headline = body.headline.trim();
    }

    if (body.summary !== undefined) {
        if (typeof body.summary !== 'string' || body.summary.trim().length === 0) {
            throw new Error('summary must be a non-empty string');
        }
        input.summary = body.summary.trim();
    }

    return input;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const date = parseWorkoutDate(url.searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const readiness = await services.readiness.getDay(date);

        return NextResponse.json(readiness);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load readiness', 500);
    }
}

export async function PATCH(request: Request) {
    try {
        const url = new URL(request.url);
        const date = parseWorkoutDate(url.searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseReadinessUpdate(body);
        const services = createBackendServices(userId);
        const readiness = await services.readiness.updateDay(date, input);

        return NextResponse.json(readiness);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update readiness';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}
