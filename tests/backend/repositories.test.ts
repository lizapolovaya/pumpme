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

function getIsoDateDaysAgo(daysAgo: number): string {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
}

function getIsoDateWeeksAgo(weeksAgo: number): string {
    return getIsoDateDaysAgo(weeksAgo * 7);
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

    await repositories.workouts.updateSet('local-user', session.id, set!.id, {
        reps: 6
    });
    const afterUpdate = await repositories.workouts.getSession('local-user', session.id);
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

test('analytics repository returns average RPE as a first-class progress metric', async () => {
    const repositories = createSqliteRepositories();
    const sessionDate = getIsoDateDaysAgo(2);

    const session = await repositories.workouts.startSession('local-user', {
        date: sessionDate,
        title: 'Intensity Session',
        focus: 'Upper body'
    });
    const withExercise = await repositories.workouts.addExercise('local-user', session.id, {
        exerciseId: 'exercise-overhead-press',
        exerciseName: 'Overhead Press'
    });
    const exercise = withExercise.exercises[0];
    assert.ok(exercise);

    const withFirstSet = await repositories.workouts.addSet('local-user', session.id, exercise!.id, {
        weightKg: 40,
        reps: 6,
        rpe: 7
    });
    const firstSet = withFirstSet.exercises[0]?.sets[0];
    assert.ok(firstSet);

    const withSecondSet = await repositories.workouts.addSet('local-user', session.id, exercise!.id, {
        weightKg: 42.5,
        reps: 5,
        rpe: 9
    });
    const secondSet = withSecondSet.exercises[0]?.sets[1];
    assert.ok(secondSet);

    await repositories.workouts.updateSet('local-user', session.id, firstSet!.id, {
        completed: true
    });
    await repositories.workouts.updateSet('local-user', session.id, secondSet!.id, {
        completed: true
    });
    await repositories.workouts.finishSession('local-user', session.id);

    const summary = await repositories.analytics.getProgressSummary('local-user', '30d');

    assert.equal(summary.averageRpe, 8);
    assert.equal(summary.logs.some((log) => log.title.includes('RPE')), false);
    assert.equal(summary.logs.some((log) => log.title === 'Recovery Score'), false);
});

test('analytics repository month-to-date RPE excludes prior-month sessions', async () => {
    const repositories = createSqliteRepositories();
    const today = new Date();
    const currentMonthDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), Math.max(2, today.getUTCDate())));
    const previousMonthDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));

    const createCompletedSessionWithRpe = async (date: string, rpe: number) => {
        const session = await repositories.workouts.startSession('local-user', {
            date,
            title: `RPE ${rpe} Session`,
            focus: 'Upper body'
        });
        const withExercise = await repositories.workouts.addExercise('local-user', session.id, {
            exerciseId: 'exercise-bench-press',
            exerciseName: 'Bench Press'
        });
        const exercise = withExercise.exercises[0];
        assert.ok(exercise);

        const withSet = await repositories.workouts.addSet('local-user', session.id, exercise!.id, {
            weightKg: 60,
            reps: 5,
            rpe
        });
        const set = withSet.exercises[0]?.sets[0];
        assert.ok(set);

        await repositories.workouts.updateSet('local-user', session.id, set!.id, {
            completed: true
        });
        await repositories.workouts.finishSession('local-user', session.id);
    };

    await createCompletedSessionWithRpe(previousMonthDate.toISOString().slice(0, 10), 10);
    await createCompletedSessionWithRpe(currentMonthDate.toISOString().slice(0, 10), 8);

    const summary = await repositories.analytics.getProgressSummary('local-user', 'mtd');

    assert.equal(summary.averageRpe, 8);
});

test('analytics repository returns fixed weekly volume buckets with current week as W8', async () => {
    const repositories = createSqliteRepositories();

    const createCompletedSessionWithVolume = async (date: string, weightKg: number, reps: number) => {
        const session = await repositories.workouts.startSession('local-user', {
            date,
            title: `Volume ${date}`,
            focus: 'Lower body'
        });
        const withExercise = await repositories.workouts.addExercise('local-user', session.id, {
            exerciseId: 'exercise-squat',
            exerciseName: 'Squat'
        });
        const exercise = withExercise.exercises[0];
        assert.ok(exercise);

        const withSet = await repositories.workouts.addSet('local-user', session.id, exercise!.id, {
            weightKg,
            reps
        });
        const set = withSet.exercises[0]?.sets[0];
        assert.ok(set);

        await repositories.workouts.updateSet('local-user', session.id, set!.id, {
            completed: true
        });
        await repositories.workouts.finishSession('local-user', session.id);
    };

    await createCompletedSessionWithVolume(getIsoDateWeeksAgo(3), 100, 5);
    await createCompletedSessionWithVolume(getIsoDateWeeksAgo(1), 80, 4);
    await createCompletedSessionWithVolume(getIsoDateWeeksAgo(0), 60, 3);

    const summary = await repositories.analytics.getProgressSummary('local-user', 'mtd');

    assert.deepEqual(
        summary.volumeTrend,
        [
            { label: 'W1', value: 0 },
            { label: 'W2', value: 0 },
            { label: 'W3', value: 0 },
            { label: 'W4', value: 0 },
            { label: 'W5', value: 500 },
            { label: 'W6', value: 0 },
            { label: 'W7', value: 80 * 4 },
            { label: 'W8', value: 60 * 3 }
        ]
    );
});

test('analytics repository returns recovery score as a first-class progress metric', async () => {
    const repositories = createSqliteRepositories();
    const firstDate = getIsoDateDaysAgo(3);
    const secondDate = getIsoDateDaysAgo(2);

    await repositories.readiness.updateReadinessDay('local-user', firstDate, {
        score: 80
    });
    await repositories.readiness.updateReadinessDay('local-user', secondDate, {
        score: 90
    });

    const firstSession = await repositories.workouts.startSession('local-user', {
        date: firstDate,
        title: 'Recovery Test A',
        focus: 'Upper body'
    });
    const secondSession = await repositories.workouts.startSession('local-user', {
        date: secondDate,
        title: 'Recovery Test B',
        focus: 'Lower body'
    });

    await repositories.workouts.finishSession('local-user', firstSession.id);
    await repositories.workouts.finishSession('local-user', secondSession.id);

    const summary = await repositories.analytics.getProgressSummary('local-user', '30d');

    assert.equal(summary.recoveryScore, 85);
    assert.equal(summary.logs.some((log) => log.title === 'Recovery Score'), false);
});
