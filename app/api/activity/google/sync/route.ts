import { NextResponse } from 'next/server';
import { AuthenticationError, resolveCurrentUserContext } from '../../../../../lib/server/backend';
import { jsonError, parseWorkoutDate } from '../../../../../lib/server/backend/http';
import { syncGoogleStepsForDate } from '../../../../../lib/server/auth/google-fit';

export async function POST(request: Request) {
    try {
        const { userId } = await resolveCurrentUserContext();
        const url = new URL(request.url);
        const date = parseWorkoutDate(url.searchParams.get('date'));
        const activity = await syncGoogleStepsForDate(userId, date);

        return NextResponse.json(activity);
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return jsonError(error.message, 401);
        }

        const message = error instanceof Error ? error.message : 'Unable to sync Google activity';
        const status = message.includes('connected') || message.includes('scope') ? 400 : 500;
        return jsonError(message, status);
    }
}
