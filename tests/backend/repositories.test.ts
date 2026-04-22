import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { closeDatabase } from '../../lib/server/backend/db';
import { createSqliteRepositories } from '../../lib/server/backend/repositories/sqlite';

let tempDir = '';

function setTestDatabase() {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pumpme-backend-repos-'));
    process.env.PUMPME_SQLITE_PATH = path.join(tempDir, 'pumpme.sqlite');
}

beforeEach(() => {
    closeDatabase();
    setTestDatabase();
    process.env.PUMPME_STORAGE_DRIVER = 'sqlite';
});

afterEach(() => {
    closeDatabase();
    if (tempDir) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        tempDir = '';
    }
    delete process.env.PUMPME_SQLITE_PATH;
    delete process.env.PUMPME_STORAGE_DRIVER;
});

test('profile repository scaffolds and persists updates', async () => {
    const repositories = createSqliteRepositories();

    const initialProfile = await repositories.profile.getProfile('local-user');
    assert.equal(initialProfile.displayName, 'Alex Rivers');
    assert.equal(initialProfile.primaryGoal, 'muscle_gain');

    const updatedProfile = await repositories.profile.updateProfile('local-user', {
        displayName: 'Jordan Vale',
        age: 31,
        primaryGoal: 'strength',
        heightCm: 182,
        weightKg: 87.5,
        stepGoal: 12000
    });

    assert.equal(updatedProfile.displayName, 'Jordan Vale');
    assert.equal(updatedProfile.age, 31);
    assert.equal(updatedProfile.primaryGoal, 'strength');
    assert.equal(updatedProfile.heightCm, 182);
    assert.equal(updatedProfile.weightKg, 87.5);
    assert.equal(updatedProfile.stepGoal, 12000);
});

test('workout repository finishes a session and computes totals', async () => {
    const repositories = createSqliteRepositories();
    const templates = await repositories.workouts.listTemplates('local-user');
    assert.ok(templates.length > 0);

    const session = await repositories.workouts.startSession('local-user', {
        date: '2026-04-09',
        title: 'Heavy Push',
        focus: 'Chest and triceps'
    });

    const withExercise = await repositories.workouts.addExercise('local-user', session.id, {
        exerciseId: 'exercise-bench-press',
        exerciseName: 'Bench Press'
    });

    const firstExercise = withExercise.exercises[0];
    assert.ok(firstExercise);

    const withSet = await repositories.workouts.addSet('local-user', session.id, firstExercise.id, {
        weightKg: 50,
        reps: 5,
        rpe: 8
    });

    const createdSet = withSet.exercises[0]?.sets[0];
    assert.ok(createdSet);

    await repositories.workouts.updateSet('local-user', session.id, createdSet.id, {
        completed: true
    });

    const finished = await repositories.workouts.finishSession('local-user', session.id);

    assert.equal(finished.status, 'completed');
    assert.equal(finished.totalVolumeKg, 250);
    assert.ok((finished.estimatedBurnKcal ?? 0) > 0);
});

test('workout repository auto-recalculates totals on set edits and removals', async () => {
    const repositories = createSqliteRepositories();

    const session = await repositories.workouts.startSession('local-user', {
        date: '2026-04-10',
        title: 'Auto Save Session',
        focus: 'Full body'
    });

    const withExercise = await repositories.workouts.addExercise('local-user', session.id, {
        exerciseId: 'exercise-squat',
        exerciseName: 'Squat'
    });
    const exercise = withExercise.exercises[0];
    assert.ok(exercise);

    const withSet = await repositories.workouts.addSet('local-user', session.id, exercise!.id, {
        weightKg: 100,
        reps: 5
    });
    const set = withSet.exercises[0]?.sets[0];
    assert.ok(set);
    assert.equal(withSet.totalVolumeKg, 500);

    const afterUpdate = await repositories.workouts.updateSet('local-user', session.id, set!.id, {
        reps: 6
    });
    assert.equal(afterUpdate.totalVolumeKg, 600);
    assert.equal(afterUpdate.status, 'active');

    const afterRemove = await repositories.workouts.removeSet('local-user', session.id, set!.id);
    assert.equal(afterRemove.totalVolumeKg, 0);
    assert.equal(afterRemove.status, 'active');
});

test('nutrition repository upserts daily targets and totals', async () => {
    const repositories = createSqliteRepositories();
    const initialDay = await repositories.nutrition.getNutritionDay('local-user', '2026-04-09');
    assert.equal(initialDay.calories.current, 0);
    assert.equal(initialDay.protein.current, 0);
    assert.equal(initialDay.carbs.current, 0);
    assert.equal(initialDay.fats.current, 0);

    const updatedDay = await repositories.nutrition.updateNutritionDay('local-user', '2026-04-09', {
        caloriesCurrent: 1800,
        proteinCurrent: 145,
    });

    assert.equal(updatedDay.calories.current, 1800);
    assert.equal(updatedDay.protein.current, 145);
    assert.equal(updatedDay.calories.target, initialDay.calories.target);
    assert.equal(updatedDay.protein.target, initialDay.protein.target);

    const fetchedDay = await repositories.nutrition.getNutritionDay('local-user', '2026-04-09');
    assert.equal(fetchedDay.calories.current, 1800);
    assert.equal(fetchedDay.protein.target, initialDay.protein.target);
});

test('default today session is empty when no workout input exists yet', async () => {
    const repositories = createSqliteRepositories();

    const session = await repositories.workouts.getSessionByDate('local-user', '2026-04-15');

    assert.ok(session);
    assert.equal(session?.title, 'Session Apr 15');
    assert.equal(session?.status, 'scheduled');
    assert.deepEqual(session?.exercises, []);
});
