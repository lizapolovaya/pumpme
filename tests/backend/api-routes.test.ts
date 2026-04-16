import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { closeDatabase } from '../../lib/server/backend/db';
import * as bootstrapRoute from '../../app/api/bootstrap/route';
import * as calendarRoute from '../../app/api/calendar/month/route';
import * as nutritionRoute from '../../app/api/nutrition/today/route';
import * as profileRoute from '../../app/api/profile/route';
import * as preferencesRoute from '../../app/api/preferences/route';
import * as sessionsRoute from '../../app/api/workouts/sessions/route';
import * as sessionExercisesRoute from '../../app/api/workouts/sessions/[sessionId]/exercises/route';
import * as finishRoute from '../../app/api/workouts/sessions/[sessionId]/finish/route';

let tempDir = '';

function setTestDatabase() {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pumpme-backend-api-'));
    process.env.PUMPME_SQLITE_PATH = path.join(tempDir, 'pumpme.sqlite');
}

function jsonRequest(url: string, method: string, body: Record<string, unknown>) {
    return new Request(url, {
        method,
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

beforeEach(() => {
    closeDatabase();
    setTestDatabase();
});

afterEach(() => {
    closeDatabase();
    if (tempDir) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        tempDir = '';
    }
    delete process.env.PUMPME_SQLITE_PATH;
});

test('profile and preferences routes read and update backend state', async () => {
    const profileResponse = await profileRoute.GET();
    assert.equal(profileResponse.status, 200);
    const initialProfile = await profileResponse.json();
    assert.equal(initialProfile.displayName, 'Alex Rivers');

    const updatedProfileResponse = await profileRoute.PATCH(
        jsonRequest('http://localhost/api/profile', 'PATCH', {
            displayName: 'Casey Stone',
            primaryGoal: 'muscle_gain',
            age: 29
        })
    );
    assert.equal(updatedProfileResponse.status, 200);
    const updatedProfile = await updatedProfileResponse.json();
    assert.equal(updatedProfile.displayName, 'Casey Stone');
    assert.equal(updatedProfile.primaryGoal, 'muscle_gain');
    assert.equal(updatedProfile.age, 29);

    const updatedPreferencesResponse = await preferencesRoute.PATCH(
        jsonRequest('http://localhost/api/preferences', 'PATCH', {
            unitSystem: 'imperial',
            foodDatabaseRegion: 'CA'
        })
    );
    assert.equal(updatedPreferencesResponse.status, 200);
    const updatedPreferences = await updatedPreferencesResponse.json();
    assert.equal(updatedPreferences.unitSystem, 'imperial');
    assert.equal(updatedPreferences.foodDatabaseRegion, 'CA');
});

test('nutrition route validates payloads and persists updates', async () => {
    const invalidResponse = await nutritionRoute.PATCH(
        jsonRequest('http://localhost/api/nutrition/today?date=2026-04-09', 'PATCH', {
            caloriesCurrent: -10
        })
    );

    assert.equal(invalidResponse.status, 400);
    assert.deepEqual(await invalidResponse.json(), {
        error: 'caloriesCurrent must be a non-negative number'
    });

    const validResponse = await nutritionRoute.PATCH(
        jsonRequest('http://localhost/api/nutrition/today?date=2026-04-09', 'PATCH', {
            caloriesCurrent: 2100,
            caloriesTarget: 2500,
            proteinCurrent: 160,
            proteinTarget: 180
        })
    );

    assert.equal(validResponse.status, 200);
    const nutrition = await validResponse.json();
    assert.equal(nutrition.calories.current, 2100);
    assert.equal(nutrition.protein.target, 180);
});

test('bootstrap and workout routes expose a coherent session flow', async () => {
    const sessionResponse = await sessionsRoute.POST(
        jsonRequest('http://localhost/api/workouts/sessions', 'POST', {
            date: '2026-04-09',
            title: 'Heavy Push',
            focus: 'Chest and shoulders'
        })
    );

    assert.equal(sessionResponse.status, 201);
    const session = await sessionResponse.json();
    assert.equal(session.status, 'active');

    const finishedResponse = await finishRoute.POST(
        new Request('http://localhost/api/workouts/sessions/finish', {
            method: 'POST'
        }),
        {
            params: Promise.resolve({ sessionId: session.id })
        }
    );

    assert.equal(finishedResponse.status, 200);
    const finishedSession = await finishedResponse.json();
    assert.equal(finishedSession.status, 'completed');

    const bootstrapResponse = await bootstrapRoute.GET(
        new Request('http://localhost/api/bootstrap?date=2026-04-09')
    );
    assert.equal(bootstrapResponse.status, 200);
    const bootstrap = await bootstrapResponse.json();
    assert.equal(bootstrap.user.displayName, 'Alex Rivers');
    assert.ok(Array.isArray(bootstrap.today.weeklyDiscipline));
});

test('calendar route returns selected day session details', async () => {
    const sessionResponse = await sessionsRoute.POST(
        jsonRequest('http://localhost/api/workouts/sessions', 'POST', {
            date: '2026-04-09',
            title: 'Speed Session',
            focus: 'Lower body'
        })
    );

    assert.equal(sessionResponse.status, 201);
    const session = await sessionResponse.json();

    const addExerciseResponse = await sessionExercisesRoute.POST(
        jsonRequest(`http://localhost/api/workouts/sessions/${session.id}/exercises`, 'POST', {
            exerciseId: 'exercise-squat',
            exerciseName: 'Squat'
        }),
        {
            params: Promise.resolve({ sessionId: session.id })
        }
    );
    assert.equal(addExerciseResponse.status, 201);

    const calendarResponse = await calendarRoute.GET(
        new Request('http://localhost/api/calendar/month?year=2026&month=4&selectedDate=2026-04-09')
    );

    assert.equal(calendarResponse.status, 200);
    const calendar = await calendarResponse.json();
    assert.equal(calendar.selectedDay.date, '2026-04-09');
    assert.equal(calendar.selectedDay.sessions[0].id, session.id);
});
