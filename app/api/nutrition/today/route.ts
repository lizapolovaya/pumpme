import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseJsonBody, parseWorkoutDate } from '../../../../lib/server/backend/http';

function parseNutritionUpdate(body: Record<string, unknown>) {
    const input: Record<string, number> = {};

    for (const key of [
        'caloriesCurrent',
        'caloriesTarget',
        'proteinCurrent',
        'proteinTarget',
        'carbsCurrent',
        'carbsTarget',
        'fatsCurrent',
        'fatsTarget'
    ] as const) {
        const value = body[key];
        if (value !== undefined) {
            if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
                throw new Error(`${key} must be a non-negative number`);
            }
            input[key] = value;
        }
    }

    return input;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const date = parseWorkoutDate(url.searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const nutrition = await services.nutrition.getDay(date);

        return NextResponse.json(nutrition);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load nutrition', 500);
    }
}

export async function PATCH(request: Request) {
    try {
        const url = new URL(request.url);
        const date = parseWorkoutDate(url.searchParams.get('date'));
        const { userId } = await resolveCurrentUserContext();
        const body = await parseJsonBody(request);
        const input = parseNutritionUpdate(body);
        const services = createBackendServices(userId);
        const nutrition = await services.nutrition.updateDay(date, input);

        return NextResponse.json(nutrition);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update nutrition';
        const status = message.includes('must') || message.includes('invalid') ? 400 : 500;
        return jsonError(message, status);
    }
}
