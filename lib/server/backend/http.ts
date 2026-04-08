import { NextResponse } from 'next/server';
import type {
    AddWorkoutExerciseInput,
    AddWorkoutSetInput,
    PrimaryGoal,
    StartWorkoutSessionInput,
    UnitSystem,
    UpdatePreferencesInput,
    UpdateProfileInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSessionInput,
    UpdateWorkoutSetInput
} from './types';

const PRIMARY_GOALS: readonly PrimaryGoal[] = [
    'muscle_gain',
    'fat_loss',
    'strength',
    'maintenance',
    'athleticism'
];

const UNIT_SYSTEMS: readonly UnitSystem[] = ['metric', 'imperial'];

export function jsonError(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody(request: Request): Promise<Record<string, unknown>> {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('Request body must be a JSON object');
    }

    return body as Record<string, unknown>;
}

export function parseProfileUpdate(body: Record<string, unknown>): UpdateProfileInput {
    const input: UpdateProfileInput = {};

    if (body.displayName !== undefined) {
        if (typeof body.displayName !== 'string' || body.displayName.trim().length === 0) {
            throw new Error('displayName must be a non-empty string');
        }

        input.displayName = body.displayName.trim();
    }

    if (body.avatarUrl !== undefined) {
        if (body.avatarUrl !== null && typeof body.avatarUrl !== 'string') {
            throw new Error('avatarUrl must be a string or null');
        }

        input.avatarUrl = body.avatarUrl;
    }

    if (body.age !== undefined) {
        if (body.age !== null && (!Number.isInteger(body.age) || (body.age as number) < 0)) {
            throw new Error('age must be a non-negative integer or null');
        }

        input.age = body.age as number | null;
    }

    if (body.primaryGoal !== undefined) {
        if (typeof body.primaryGoal !== 'string' || !PRIMARY_GOALS.includes(body.primaryGoal as PrimaryGoal)) {
            throw new Error('primaryGoal is invalid');
        }

        input.primaryGoal = body.primaryGoal as PrimaryGoal;
    }

    if (body.heightCm !== undefined) {
        if (body.heightCm !== null && (typeof body.heightCm !== 'number' || body.heightCm < 0)) {
            throw new Error('heightCm must be a non-negative number or null');
        }

        input.heightCm = body.heightCm as number | null;
    }

    if (body.weightKg !== undefined) {
        if (body.weightKg !== null && (typeof body.weightKg !== 'number' || body.weightKg < 0)) {
            throw new Error('weightKg must be a non-negative number or null');
        }

        input.weightKg = body.weightKg as number | null;
    }

    if (body.stepGoal !== undefined) {
        if (body.stepGoal !== null && (!Number.isInteger(body.stepGoal) || (body.stepGoal as number) < 0)) {
            throw new Error('stepGoal must be a non-negative integer or null');
        }

        input.stepGoal = body.stepGoal as number | null;
    }

    return input;
}

export function parsePreferencesUpdate(body: Record<string, unknown>): UpdatePreferencesInput {
    const input: UpdatePreferencesInput = {};

    if (body.unitSystem !== undefined) {
        if (typeof body.unitSystem !== 'string' || !UNIT_SYSTEMS.includes(body.unitSystem as UnitSystem)) {
            throw new Error('unitSystem is invalid');
        }

        input.unitSystem = body.unitSystem as UnitSystem;
    }

    if (body.foodDatabaseRegion !== undefined) {
        if (typeof body.foodDatabaseRegion !== 'string' || body.foodDatabaseRegion.trim().length === 0) {
            throw new Error('foodDatabaseRegion must be a non-empty string');
        }

        input.foodDatabaseRegion = body.foodDatabaseRegion.trim();
    }

    return input;
}

export function parseWorkoutDate(rawValue: string | null | undefined): string {
    if (!rawValue) {
        return new Date().toISOString().slice(0, 10);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        throw new Error('date must be in YYYY-MM-DD format');
    }

    return rawValue;
}

export function parseWorkoutSessionStart(body: Record<string, unknown>): StartWorkoutSessionInput {
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        throw new Error('title must be a non-empty string');
    }

    const input: StartWorkoutSessionInput = {
        date: parseWorkoutDate(typeof body.date === 'string' ? body.date : undefined),
        title: body.title.trim()
    };

    if (body.templateId !== undefined) {
        if (body.templateId !== null && typeof body.templateId !== 'string') {
            throw new Error('templateId must be a string or null');
        }
        input.templateId = body.templateId as string | null;
    }

    if (body.focus !== undefined) {
        if (body.focus !== null && typeof body.focus !== 'string') {
            throw new Error('focus must be a string or null');
        }
        input.focus = body.focus as string | null;
    }

    return input;
}

export function parseWorkoutSessionUpdate(body: Record<string, unknown>): UpdateWorkoutSessionInput {
    const input: UpdateWorkoutSessionInput = {};

    if (body.title !== undefined) {
        if (typeof body.title !== 'string' || body.title.trim().length === 0) {
            throw new Error('title must be a non-empty string');
        }
        input.title = body.title.trim();
    }

    if (body.focus !== undefined) {
        if (body.focus !== null && typeof body.focus !== 'string') {
            throw new Error('focus must be a string or null');
        }
        input.focus = body.focus as string | null;
    }

    if (body.durationMinutes !== undefined) {
        if (body.durationMinutes !== null && (!Number.isInteger(body.durationMinutes) || (body.durationMinutes as number) < 0)) {
            throw new Error('durationMinutes must be a non-negative integer or null');
        }
        input.durationMinutes = body.durationMinutes as number | null;
    }

    if (body.status !== undefined) {
        if (
            typeof body.status !== 'string' ||
            !['scheduled', 'active', 'completed', 'cancelled'].includes(body.status)
        ) {
            throw new Error('status is invalid');
        }
        input.status = body.status as UpdateWorkoutSessionInput['status'];
    }

    return input;
}

export function parseWorkoutExerciseAdd(body: Record<string, unknown>): AddWorkoutExerciseInput {
    if (typeof body.exerciseId !== 'string' || body.exerciseId.trim().length === 0) {
        throw new Error('exerciseId must be a non-empty string');
    }

    if (typeof body.exerciseName !== 'string' || body.exerciseName.trim().length === 0) {
        throw new Error('exerciseName must be a non-empty string');
    }

    return {
        exerciseId: body.exerciseId.trim(),
        exerciseName: body.exerciseName.trim()
    };
}

export function parseWorkoutExerciseUpdate(body: Record<string, unknown>): UpdateWorkoutExerciseInput {
    const input: UpdateWorkoutExerciseInput = {};

    if (body.exerciseName !== undefined) {
        if (typeof body.exerciseName !== 'string' || body.exerciseName.trim().length === 0) {
            throw new Error('exerciseName must be a non-empty string');
        }
        input.exerciseName = body.exerciseName.trim();
    }

    return input;
}

export function parseWorkoutSetAdd(body: Record<string, unknown>): AddWorkoutSetInput {
    return {
        weightKg: parseNullableNumber(body.weightKg, 'weightKg'),
        reps: parseNullableInteger(body.reps, 'reps'),
        rpe: parseNullableNumber(body.rpe, 'rpe')
    };
}

export function parseWorkoutSetUpdate(body: Record<string, unknown>): UpdateWorkoutSetInput {
    const input: UpdateWorkoutSetInput = {};

    if (body.weightKg !== undefined) {
        input.weightKg = parseNullableNumber(body.weightKg, 'weightKg');
    }
    if (body.reps !== undefined) {
        input.reps = parseNullableInteger(body.reps, 'reps');
    }
    if (body.rpe !== undefined) {
        input.rpe = parseNullableNumber(body.rpe, 'rpe');
    }
    if (body.completed !== undefined) {
        if (typeof body.completed !== 'boolean') {
            throw new Error('completed must be a boolean');
        }
        input.completed = body.completed;
    }

    return input;
}

function parseNullableNumber(value: unknown, key: string): number | null | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
        throw new Error(`${key} must be a non-negative number or null`);
    }

    return value;
}

function parseNullableInteger(value: unknown, key: string): number | null | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (!Number.isInteger(value) || (value as number) < 0) {
        throw new Error(`${key} must be a non-negative integer or null`);
    }

    return value as number;
}
