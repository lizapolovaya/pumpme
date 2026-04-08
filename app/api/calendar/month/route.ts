import { NextResponse } from 'next/server';
import { createBackendServices, resolveCurrentUserContext } from '../../../../lib/server/backend';
import { jsonError, parseWorkoutDate } from '../../../../lib/server/backend/http';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const year = Number(url.searchParams.get('year'));
        const month = Number(url.searchParams.get('month'));
        const selectedDate = url.searchParams.get('selectedDate') ?? undefined;

        if (!Number.isInteger(year) || year < 2000 || year > 2100) {
            return jsonError('year must be a valid integer');
        }

        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return jsonError('month must be a valid integer from 1 to 12');
        }

        const { userId } = await resolveCurrentUserContext();
        const services = createBackendServices(userId);
        const result = await services.calendar.getMonth(
            year,
            month,
            selectedDate ? parseWorkoutDate(selectedDate) : undefined
        );

        return NextResponse.json(result);
    } catch (error) {
        return jsonError(error instanceof Error ? error.message : 'Unable to load calendar month', 500);
    }
}
