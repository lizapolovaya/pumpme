import type {
    WorkoutRepository,
} from '../contracts';
import type {
    AddWorkoutExerciseInput,
    AddWorkoutSetInput,
    StartWorkoutSessionInput,
    UpdateWorkoutExerciseInput,
    UpdateWorkoutSessionInput,
    UpdateWorkoutSetInput,
    WorkoutSessionDto,
    WorkoutSessionExerciseDto,
    WorkoutSetDto,
    WorkoutTemplateDto
} from '../../types';
import {
    createId,
    ensureDefaultTemplates,
    ensureScaffoldForDate,
    getSqliteRepositoryDatabase,
    toIsoDate
} from './shared';

type TemplateRow = {
    id: string;
    name: string;
    focus: string | null;
};

type TemplateExerciseRow = {
    id: string;
    template_id: string;
    exercise_id: string;
    exercise_name: string;
    sort_order: number;
};

type SessionRow = {
    id: string;
    template_id: string | null;
    date: string;
    title: string;
    focus: string | null;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    duration_minutes: number | null;
    total_volume_kg: number | null;
    estimated_burn_kcal: number | null;
};

type SessionExerciseRow = {
    id: string;
    session_id: string;
    exercise_id: string;
    exercise_name: string;
    sort_order: number;
};

type SetRow = {
    id: string;
    session_exercise_id: string;
    sort_order: number;
    weight_kg: number | null;
    reps: number | null;
    rpe: number | null;
    completed: number;
};

export class SqliteWorkoutRepository implements WorkoutRepository {
    async listTemplates(userId: string): Promise<WorkoutTemplateDto[]> {
        const db = getSqliteRepositoryDatabase();
        ensureDefaultTemplates(db, userId);

        const templates = db
            .prepare(`
                SELECT id, name, focus
                FROM workout_templates
                WHERE user_id = ?
                ORDER BY created_at ASC
            `)
            .all(userId) as TemplateRow[];

        const templateExercises = db
            .prepare(`
                SELECT id, template_id, exercise_id, exercise_name, sort_order
                FROM template_exercises
                WHERE template_id IN (
                    SELECT id FROM workout_templates WHERE user_id = ?
                )
                ORDER BY sort_order ASC
            `)
            .all(userId) as TemplateExerciseRow[];

        return templates.map((template) => ({
            id: template.id,
            name: template.name,
            focus: template.focus,
            exercises: templateExercises
                .filter((exercise) => exercise.template_id === template.id)
                .map((exercise) => ({
                    id: exercise.id,
                    exerciseId: exercise.exercise_id,
                    exerciseName: exercise.exercise_name,
                    order: exercise.sort_order
                }))
        }));
    }

    async getSessionByDate(userId: string, date: string): Promise<WorkoutSessionDto | null> {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);
        ensureScaffoldForDate(db, userId, normalizedDate);

        let session = this.findSessionRow(db, userId, normalizedDate);
        if (!session) {
            session = this.createDefaultSession(db, userId, normalizedDate);
        }

        return this.getSessionById(userId, session.id);
    }

    async findSessionByDate(userId: string, date: string): Promise<WorkoutSessionDto | null> {
        const db = getSqliteRepositoryDatabase();
        const normalizedDate = toIsoDate(date);

        const session = this.findSessionRowWithEntries(db, userId, normalizedDate);
        if (!session) {
            return null;
        }

        return this.getSessionById(userId, session.id);
    }

    async startSession(userId: string, input: StartWorkoutSessionInput): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        const date = toIsoDate(input.date);
        ensureScaffoldForDate(db, userId, date);

        const sessionId = createId('session');
        db.prepare(`
            INSERT INTO workout_sessions (id, user_id, template_id, date, title, focus, status)
            VALUES (@id, @userId, @templateId, @date, @title, @focus, 'active')
        `).run({
            id: sessionId,
            userId,
            templateId: input.templateId ?? null,
            date,
            title: input.title,
            focus: input.focus ?? null
        });

        if (input.templateId) {
            this.cloneTemplateExercises(db, sessionId, input.templateId);
        }

        return this.getSessionById(userId, sessionId);
    }

    async updateSession(userId: string, sessionId: string, input: UpdateWorkoutSessionInput): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        const current = this.requireSessionRow(db, userId, sessionId);

        db.prepare(`
            UPDATE workout_sessions
            SET title = @title,
                focus = @focus,
                duration_minutes = @durationMinutes,
                status = @status,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @sessionId AND user_id = @userId
        `).run({
            sessionId,
            userId,
            title: input.title ?? current.title,
            focus: input.focus === undefined ? current.focus : input.focus,
            durationMinutes:
                input.durationMinutes === undefined ? current.duration_minutes : input.durationMinutes,
            status: input.status ?? current.status
        });

        return this.getSessionById(userId, sessionId);
    }

    async addExercise(userId: string, sessionId: string, input: AddWorkoutExerciseInput): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        this.requireSessionRow(db, userId, sessionId);

        db.prepare(`
            INSERT INTO exercise_definitions (id, name, muscle_group, equipment)
            VALUES (@id, @name, NULL, NULL)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                updated_at = CURRENT_TIMESTAMP
        `).run({
            id: input.exerciseId,
            name: input.exerciseName
        });

        const nextOrder = this.getNextOrder(
            db,
            'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM workout_session_exercises WHERE session_id = ?',
            sessionId
        );

        const sessionExerciseId = createId('session-exercise');
        db.prepare(`
            INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, sort_order)
            VALUES (@id, @sessionId, @exerciseId, @exerciseName, @sortOrder)
        `).run({
            id: sessionExerciseId,
            sessionId,
            exerciseId: input.exerciseId,
            exerciseName: input.exerciseName,
            sortOrder: nextOrder
        });

        return this.getSessionById(userId, sessionId);
    }

    async updateExercise(
        userId: string,
        sessionId: string,
        exerciseRowId: string,
        input: UpdateWorkoutExerciseInput
    ): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        this.requireSessionRow(db, userId, sessionId);

        const current = db
            .prepare(`
                SELECT exercise_name
                FROM workout_session_exercises
                WHERE id = ? AND session_id = ?
            `)
            .get(exerciseRowId, sessionId) as { exercise_name: string } | undefined;

        if (!current) {
            throw new Error(`Workout exercise ${exerciseRowId} not found`);
        }

        db.prepare(`
            UPDATE workout_session_exercises
            SET exercise_name = @exerciseName,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @exerciseRowId AND session_id = @sessionId
        `).run({
            exerciseRowId,
            sessionId,
            exerciseName: input.exerciseName ?? current.exercise_name
        });

        return this.getSessionById(userId, sessionId);
    }

    async removeExercise(userId: string, sessionId: string, exerciseRowId: string): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        this.requireSessionRow(db, userId, sessionId);

        db.prepare(`
            DELETE FROM workout_session_exercises
            WHERE id = ? AND session_id = ?
        `).run(exerciseRowId, sessionId);

        return this.getSessionById(userId, sessionId);
    }

    async addSet(userId: string, sessionId: string, exerciseRowId: string, input: AddWorkoutSetInput): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        this.requireSessionRow(db, userId, sessionId);

        const nextOrder = this.getNextOrder(
            db,
            'SELECT COALESCE(MAX(sort_order), 0) AS maxOrder FROM workout_sets WHERE session_exercise_id = ?',
            exerciseRowId
        );

        db.prepare(`
            INSERT INTO workout_sets (id, session_exercise_id, sort_order, weight_kg, reps, rpe, completed)
            VALUES (@id, @exerciseRowId, @sortOrder, @weightKg, @reps, @rpe, @completed)
        `).run({
            id: createId('set'),
            exerciseRowId,
            sortOrder: nextOrder,
            weightKg: input.weightKg ?? null,
            reps: input.reps ?? null,
            rpe: input.rpe ?? null,
            completed: input.weightKg !== undefined || input.reps !== undefined || input.rpe !== undefined ? 1 : 0
        });

        return this.getSessionById(userId, sessionId);
    }

    async updateSet(
        userId: string,
        sessionId: string,
        setId: string,
        input: UpdateWorkoutSetInput
    ): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        this.requireSessionRow(db, userId, sessionId);

        const current = db
            .prepare(`
                SELECT weight_kg, reps, rpe, completed
                FROM workout_sets
                WHERE id = ?
            `)
            .get(setId) as SetRow | undefined;

        if (!current) {
            throw new Error(`Workout set ${setId} not found`);
        }

        const nextWeight = input.weightKg === undefined ? current.weight_kg : input.weightKg;
        const nextReps = input.reps === undefined ? current.reps : input.reps;
        const nextRpe = input.rpe === undefined ? current.rpe : input.rpe;
        const nextCompleted =
            input.completed === undefined ? current.completed : input.completed ? 1 : 0;

        db.prepare(`
            UPDATE workout_sets
            SET weight_kg = @weightKg,
                reps = @reps,
                rpe = @rpe,
                completed = @completed,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @setId
        `).run({
            setId,
            weightKg: nextWeight,
            reps: nextReps,
            rpe: nextRpe,
            completed: nextCompleted
        });

        return this.getSessionById(userId, sessionId);
    }

    async removeSet(userId: string, sessionId: string, setId: string): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        this.requireSessionRow(db, userId, sessionId);

        db.prepare('DELETE FROM workout_sets WHERE id = ?').run(setId);

        return this.getSessionById(userId, sessionId);
    }

    async finishSession(userId: string, sessionId: string): Promise<WorkoutSessionDto> {
        const db = getSqliteRepositoryDatabase();
        const session = this.requireSessionRow(db, userId, sessionId);

        const metrics = db
            .prepare(`
                SELECT
                    COALESCE(SUM(COALESCE(weight_kg, 0) * COALESCE(reps, 0)), 0) AS totalVolume,
                    COUNT(*) AS setCount
                FROM workout_sets
                WHERE session_exercise_id IN (
                    SELECT id FROM workout_session_exercises WHERE session_id = ?
                )
            `)
            .get(sessionId) as { totalVolume: number; setCount: number };

        const durationMinutes = session.duration_minutes ?? Math.max(metrics.setCount * 3, 30);
        const estimatedBurnKcal = Math.round(durationMinutes * 4.5);

        db.prepare(`
            UPDATE workout_sessions
            SET status = 'completed',
                duration_minutes = @durationMinutes,
                total_volume_kg = @totalVolumeKg,
                estimated_burn_kcal = @estimatedBurnKcal,
                completed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @sessionId AND user_id = @userId
        `).run({
            sessionId,
            userId,
            durationMinutes,
            totalVolumeKg: metrics.totalVolume,
            estimatedBurnKcal
        });

        db.prepare(`
            UPDATE workout_sets
            SET completed = CASE
                WHEN weight_kg IS NOT NULL OR reps IS NOT NULL OR rpe IS NOT NULL THEN 1
                ELSE completed
            END,
                updated_at = CURRENT_TIMESTAMP
            WHERE session_exercise_id IN (
                SELECT id FROM workout_session_exercises WHERE session_id = ?
            )
        `).run(sessionId);

        return this.getSessionById(userId, sessionId);
    }

    private getSessionById(userId: string, sessionId: string): WorkoutSessionDto {
        const db = getSqliteRepositoryDatabase();
        const session = this.requireSessionRow(db, userId, sessionId);

        const exercises = db
            .prepare(`
                SELECT id, session_id, exercise_id, exercise_name, sort_order
                FROM workout_session_exercises
                WHERE session_id = ?
                ORDER BY sort_order ASC
            `)
            .all(sessionId) as SessionExerciseRow[];

        const sets = db
            .prepare(`
                SELECT id, session_exercise_id, sort_order, weight_kg, reps, rpe, completed
                FROM workout_sets
                WHERE session_exercise_id IN (
                    SELECT id FROM workout_session_exercises WHERE session_id = ?
                )
                ORDER BY sort_order ASC
            `)
            .all(sessionId) as SetRow[];

        const mappedExercises: WorkoutSessionExerciseDto[] = exercises.map((exercise) => ({
            id: exercise.id,
            exerciseId: exercise.exercise_id,
            exerciseName: exercise.exercise_name,
            order: exercise.sort_order,
            sets: sets
                .filter((set) => set.session_exercise_id === exercise.id)
                .map(
                    (set): WorkoutSetDto => ({
                        id: set.id,
                        order: set.sort_order,
                        weightKg: set.weight_kg,
                        reps: set.reps,
                        rpe: set.rpe,
                        completed: Boolean(set.completed)
                    })
                )
        }));

        return {
            id: session.id,
            templateId: session.template_id,
            date: session.date,
            title: session.title,
            focus: session.focus,
            status: session.status,
            durationMinutes: session.duration_minutes,
            totalVolumeKg: session.total_volume_kg,
            estimatedBurnKcal: session.estimated_burn_kcal,
            exercises: mappedExercises
        };
    }

    private findSessionRow(db: ReturnType<typeof getSqliteRepositoryDatabase>, userId: string, date: string) {
        return db
            .prepare(`
                SELECT id, template_id, date, title, focus, status, duration_minutes, total_volume_kg, estimated_burn_kcal
                FROM workout_sessions
                WHERE user_id = ? AND date = ?
                ORDER BY created_at DESC
                LIMIT 1
            `)
            .get(userId, date) as SessionRow | undefined;
    }

    private findSessionRowWithEntries(db: ReturnType<typeof getSqliteRepositoryDatabase>, userId: string, date: string) {
        return db
            .prepare(`
                SELECT id, template_id, date, title, focus, status, duration_minutes, total_volume_kg, estimated_burn_kcal
                FROM workout_sessions
                WHERE user_id = ? AND date = ?
                  AND (
                      status = 'completed'
                      OR total_volume_kg IS NOT NULL
                      OR EXISTS (
                          SELECT 1
                          FROM workout_session_exercises exercises
                          WHERE exercises.session_id = workout_sessions.id
                      )
                      OR EXISTS (
                          SELECT 1
                          FROM workout_sets sets
                          JOIN workout_session_exercises exercises
                            ON exercises.id = sets.session_exercise_id
                          WHERE exercises.session_id = workout_sessions.id
                            AND (
                                sets.weight_kg IS NOT NULL
                                OR sets.reps IS NOT NULL
                                OR sets.rpe IS NOT NULL
                                OR sets.completed = 1
                            )
                      )
                  )
                ORDER BY created_at DESC
                LIMIT 1
            `)
            .get(userId, date) as SessionRow | undefined;
    }

    private requireSessionRow(
        db: ReturnType<typeof getSqliteRepositoryDatabase>,
        userId: string,
        sessionId: string
    ): SessionRow {
        const session = db
            .prepare(`
                SELECT id, template_id, date, title, focus, status, duration_minutes, total_volume_kg, estimated_burn_kcal
                FROM workout_sessions
                WHERE id = ? AND user_id = ?
            `)
            .get(sessionId, userId) as SessionRow | undefined;

        if (!session) {
            throw new Error(`Workout session ${sessionId} not found`);
        }

        return session;
    }

    private createDefaultSession(
        db: ReturnType<typeof getSqliteRepositoryDatabase>,
        userId: string,
        date: string
    ): SessionRow {
        const defaultTemplate = db
            .prepare(`
                SELECT id, name, focus
                FROM workout_templates
                WHERE user_id = ?
                ORDER BY created_at ASC
                LIMIT 1
            `)
            .get(userId) as TemplateRow | undefined;

        if (!defaultTemplate) {
            throw new Error('No workout template available for default session creation');
        }

        const sessionId = createId('session');
        db.prepare(`
            INSERT INTO workout_sessions (id, user_id, template_id, date, title, focus, status)
            VALUES (@id, @userId, @templateId, @date, @title, @focus, 'scheduled')
        `).run({
            id: sessionId,
            userId,
            templateId: defaultTemplate.id,
            date,
            title: defaultTemplate.name,
            focus: defaultTemplate.focus
        });

        this.cloneTemplateExercises(db, sessionId, defaultTemplate.id);
        return this.requireSessionRow(db, userId, sessionId);
    }

    private cloneTemplateExercises(
        db: ReturnType<typeof getSqliteRepositoryDatabase>,
        sessionId: string,
        templateId: string
    ): void {
        const templateExercises = db
            .prepare(`
                SELECT exercise_id, exercise_name, sort_order
                FROM template_exercises
                WHERE template_id = ?
                ORDER BY sort_order ASC
            `)
            .all(templateId) as Array<{
            exercise_id: string;
            exercise_name: string;
            sort_order: number;
        }>;

        const insertExercise = db.prepare(`
            INSERT INTO workout_session_exercises (id, session_id, exercise_id, exercise_name, sort_order)
            VALUES (@id, @sessionId, @exerciseId, @exerciseName, @sortOrder)
        `);

        const insertSet = db.prepare(`
            INSERT INTO workout_sets (id, session_exercise_id, sort_order, weight_kg, reps, rpe, completed)
            VALUES (@id, @sessionExerciseId, @sortOrder, @weightKg, @reps, @rpe, @completed)
        `);

        templateExercises.forEach((exercise) => {
            const sessionExerciseId = createId('session-exercise');
            insertExercise.run({
                id: sessionExerciseId,
                sessionId,
                exerciseId: exercise.exercise_id,
                exerciseName: exercise.exercise_name,
                sortOrder: exercise.sort_order
            });

            const defaults =
                exercise.exercise_name === 'Bench Press'
                    ? [
                          { weightKg: 80, reps: 10, rpe: 8 },
                          { weightKg: 80, reps: 10, rpe: 7 }
                      ]
                    : exercise.exercise_name === 'Tricep Pushdowns'
                      ? [{ weightKg: 25, reps: 15, rpe: 9 }]
                      : [{ weightKg: null, reps: null, rpe: null }];

            defaults.forEach((set, index) => {
                insertSet.run({
                    id: createId('set'),
                    sessionExerciseId,
                    sortOrder: index + 1,
                    weightKg: set.weightKg,
                    reps: set.reps,
                    rpe: set.rpe,
                    completed: set.weightKg !== null || set.reps !== null || set.rpe !== null ? 1 : 0
                });
            });
        });
    }

    private getNextOrder(
        db: ReturnType<typeof getSqliteRepositoryDatabase>,
        sql: string,
        ...params: Array<string>
    ): number {
        const row = db.prepare(sql).get(...params) as { maxOrder: number };
        return row.maxOrder + 1;
    }
}
