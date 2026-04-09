import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkoutRepository } from '../contracts';
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
import { requireSupabaseOk } from './client';
import { createId, ensureDefaultTemplates, ensureScaffoldForDate, toIsoDate } from './shared';

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
    created_at: string;
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
    completed: boolean;
};

export class SupabaseWorkoutRepository implements WorkoutRepository {
    constructor(private readonly client: SupabaseClient) {}

    async listTemplates(userId: string): Promise<WorkoutTemplateDto[]> {
        await ensureDefaultTemplates(this.client, userId);

        const templatesResult = await this.client
            .from('workout_templates')
            .select('id,name,focus')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
        const templates = requireSupabaseOk(templatesResult as any, 'Unable to list workout templates') as TemplateRow[];

        if (!templates.length) {
            return [];
        }

        const templateIds = templates.map((template) => template.id);
        const exercisesResult = await this.client
            .from('template_exercises')
            .select('id,template_id,exercise_id,exercise_name,sort_order')
            .in('template_id', templateIds)
            .order('sort_order', { ascending: true });
        const templateExercises = requireSupabaseOk(exercisesResult as any, 'Unable to list template exercises') as TemplateExerciseRow[];

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
        const normalizedDate = toIsoDate(date);
        await ensureScaffoldForDate(this.client, userId, normalizedDate);

        const sessionRow = await this.findLatestSessionRow(userId, normalizedDate);
        if (sessionRow) {
            return this.getSessionById(userId, sessionRow.id);
        }

        const defaultTemplate = await this.getDefaultTemplateRow(userId);
        if (!defaultTemplate) {
            return null;
        }

        const sessionId = createId('session');
        const insertResult = await this.client.from('workout_sessions').insert({
            id: sessionId,
            user_id: userId,
            template_id: defaultTemplate.id,
            date: normalizedDate,
            title: defaultTemplate.name,
            focus: defaultTemplate.focus,
            status: 'scheduled'
        });
        if (insertResult.error) {
            throw insertResult.error;
        }

        await this.cloneTemplateExercises(sessionId, defaultTemplate.id);
        return this.getSessionById(userId, sessionId);
    }

    async findSessionByDate(userId: string, date: string): Promise<WorkoutSessionDto | null> {
        const normalizedDate = toIsoDate(date);

        const sessionsResult = await this.client
            .from('workout_sessions')
            .select('id,template_id,date,title,focus,status,duration_minutes,total_volume_kg,estimated_burn_kcal,created_at')
            .eq('user_id', userId)
            .eq('date', normalizedDate)
            .order('created_at', { ascending: false });

        const sessions = requireSupabaseOk(sessionsResult as any, 'Unable to load sessions') as SessionRow[];
        if (!sessions.length) {
            return null;
        }

        const byId = new Map(sessions.map((session) => [session.id, session]));
        const sessionIds = sessions.map((session) => session.id);

        for (const session of sessions) {
            if (session.status === 'completed' || session.total_volume_kg !== null) {
                return this.getSessionById(userId, session.id);
            }
        }

        const exercisesResult = await this.client
            .from('workout_session_exercises')
            .select('id,session_id')
            .in('session_id', sessionIds);
        const exercises = requireSupabaseOk(exercisesResult as any, 'Unable to load session exercises') as Array<{
            id: string;
            session_id: string;
        }>;

        const sessionIdsWithExercises = new Set(exercises.map((exercise) => exercise.session_id));
        for (const session of sessions) {
            if (sessionIdsWithExercises.has(session.id)) {
                return this.getSessionById(userId, session.id);
            }
        }

        const exerciseIds = exercises.map((exercise) => exercise.id);
        if (!exerciseIds.length) {
            return null;
        }

        const setsResult = await this.client
            .from('workout_sets')
            .select('id,session_exercise_id,weight_kg,reps,rpe,completed')
            .in('session_exercise_id', exerciseIds);
        const sets = requireSupabaseOk(setsResult as any, 'Unable to load workout sets') as Array<{
            session_exercise_id: string;
            weight_kg: number | null;
            reps: number | null;
            rpe: number | null;
            completed: boolean;
        }>;

        const exerciseIdToSessionId = new Map(exercises.map((exercise) => [exercise.id, exercise.session_id]));
        const sessionIdsWithSetEntries = new Set<string>();
        for (const set of sets) {
            if (set.completed || set.weight_kg !== null || set.reps !== null || set.rpe !== null) {
                const sessionId = exerciseIdToSessionId.get(set.session_exercise_id);
                if (sessionId) {
                    sessionIdsWithSetEntries.add(sessionId);
                }
            }
        }

        for (const session of sessions) {
            if (sessionIdsWithSetEntries.has(session.id) && byId.has(session.id)) {
                return this.getSessionById(userId, session.id);
            }
        }

        return null;
    }

    async startSession(userId: string, input: StartWorkoutSessionInput): Promise<WorkoutSessionDto> {
        const date = toIsoDate(input.date);
        await ensureScaffoldForDate(this.client, userId, date);

        const sessionId = createId('session');
        const insertResult = await this.client.from('workout_sessions').insert({
            id: sessionId,
            user_id: userId,
            template_id: input.templateId ?? null,
            date,
            title: input.title,
            focus: input.focus ?? null,
            status: 'active'
        });
        if (insertResult.error) {
            throw insertResult.error;
        }

        if (input.templateId) {
            await this.cloneTemplateExercises(sessionId, input.templateId);
        }

        return this.getSessionById(userId, sessionId);
    }

    async updateSession(userId: string, sessionId: string, input: UpdateWorkoutSessionInput): Promise<WorkoutSessionDto> {
        const current = await this.requireSessionRow(userId, sessionId);

        const updateResult = await this.client
            .from('workout_sessions')
            .update({
                title: input.title ?? current.title,
                focus: input.focus === undefined ? current.focus : input.focus,
                duration_minutes: input.durationMinutes === undefined ? current.duration_minutes : input.durationMinutes,
                status: input.status ?? current.status
            })
            .eq('id', sessionId)
            .eq('user_id', userId);
        if (updateResult.error) {
            throw updateResult.error;
        }

        return this.getSessionById(userId, sessionId);
    }

    async addExercise(userId: string, sessionId: string, input: AddWorkoutExerciseInput): Promise<WorkoutSessionDto> {
        await this.requireSessionRow(userId, sessionId);

        const definitionUpsert = await this.client.from('exercise_definitions').upsert(
            {
                id: input.exerciseId,
                name: input.exerciseName,
                muscle_group: null,
                equipment: null
            },
            { onConflict: 'id' }
        );
        if (definitionUpsert.error) {
            throw definitionUpsert.error;
        }

        const lastOrderResult = await this.client
            .from('workout_session_exercises')
            .select('sort_order')
            .eq('session_id', sessionId)
            .order('sort_order', { ascending: false })
            .limit(1);

        const lastOrder = requireSupabaseOk(lastOrderResult as any, 'Unable to load exercise order') as Array<{
            sort_order: number;
        }>;
        const nextOrder = (lastOrder[0]?.sort_order ?? 0) + 1;

        const insertExercise = await this.client.from('workout_session_exercises').insert({
            id: createId('session-exercise'),
            session_id: sessionId,
            exercise_id: input.exerciseId,
            exercise_name: input.exerciseName,
            sort_order: nextOrder
        });
        if (insertExercise.error) {
            throw insertExercise.error;
        }

        return this.getSessionById(userId, sessionId);
    }

    async updateExercise(
        userId: string,
        sessionId: string,
        exerciseRowId: string,
        input: UpdateWorkoutExerciseInput
    ): Promise<WorkoutSessionDto> {
        await this.requireSessionRow(userId, sessionId);

        const updateResult = await this.client
            .from('workout_session_exercises')
            .update({
                exercise_name: input.exerciseName
            })
            .eq('id', exerciseRowId)
            .eq('session_id', sessionId);
        if (updateResult.error) {
            throw updateResult.error;
        }

        return this.getSessionById(userId, sessionId);
    }

    async removeExercise(userId: string, sessionId: string, exerciseRowId: string): Promise<WorkoutSessionDto> {
        await this.requireSessionRow(userId, sessionId);

        const deleteResult = await this.client
            .from('workout_session_exercises')
            .delete()
            .eq('id', exerciseRowId)
            .eq('session_id', sessionId);
        if (deleteResult.error) {
            throw deleteResult.error;
        }

        return this.getSessionById(userId, sessionId);
    }

    async addSet(userId: string, sessionId: string, exerciseRowId: string, input: AddWorkoutSetInput): Promise<WorkoutSessionDto> {
        await this.requireSessionRow(userId, sessionId);

        const lastOrderResult = await this.client
            .from('workout_sets')
            .select('sort_order')
            .eq('session_exercise_id', exerciseRowId)
            .order('sort_order', { ascending: false })
            .limit(1);
        const lastOrder = requireSupabaseOk(lastOrderResult as any, 'Unable to load set order') as Array<{ sort_order: number }>;
        const nextOrder = (lastOrder[0]?.sort_order ?? 0) + 1;

        const completed = input.weightKg !== undefined || input.reps !== undefined || input.rpe !== undefined;

        const insertResult = await this.client.from('workout_sets').insert({
            id: createId('set'),
            session_exercise_id: exerciseRowId,
            sort_order: nextOrder,
            weight_kg: input.weightKg ?? null,
            reps: input.reps ?? null,
            rpe: input.rpe ?? null,
            completed
        });
        if (insertResult.error) {
            throw insertResult.error;
        }

        return this.getSessionById(userId, sessionId);
    }

    async updateSet(userId: string, sessionId: string, setId: string, input: UpdateWorkoutSetInput): Promise<WorkoutSessionDto> {
        await this.requireSessionRow(userId, sessionId);

        const currentResult = await this.client
            .from('workout_sets')
            .select('id,weight_kg,reps,rpe,completed')
            .eq('id', setId)
            .single();
        const current = requireSupabaseOk(currentResult as any, `Workout set ${setId} not found`) as {
            weight_kg: number | null;
            reps: number | null;
            rpe: number | null;
            completed: boolean;
        };

        const nextWeight = input.weightKg === undefined ? current.weight_kg : input.weightKg;
        const nextReps = input.reps === undefined ? current.reps : input.reps;
        const nextRpe = input.rpe === undefined ? current.rpe : input.rpe;
        const nextCompleted = input.completed === undefined ? current.completed : input.completed;

        const update = await this.client
            .from('workout_sets')
            .update({
                weight_kg: nextWeight,
                reps: nextReps,
                rpe: nextRpe,
                completed: nextCompleted
            })
            .eq('id', setId);
        if (update.error) {
            throw update.error;
        }

        return this.getSessionById(userId, sessionId);
    }

    async removeSet(userId: string, sessionId: string, setId: string): Promise<WorkoutSessionDto> {
        await this.requireSessionRow(userId, sessionId);

        const deleteResult = await this.client.from('workout_sets').delete().eq('id', setId);
        if (deleteResult.error) {
            throw deleteResult.error;
        }

        return this.getSessionById(userId, sessionId);
    }

    async finishSession(userId: string, sessionId: string): Promise<WorkoutSessionDto> {
        const session = await this.requireSessionRow(userId, sessionId);

        const exercisesResult = await this.client
            .from('workout_session_exercises')
            .select('id')
            .eq('session_id', sessionId);
        const exercises = requireSupabaseOk(exercisesResult as any, 'Unable to load exercises') as Array<{ id: string }>;
        const exerciseIds = exercises.map((exercise) => exercise.id);

        const sets = await this.loadSetsByExerciseIds(exerciseIds);

        const totalVolume = sets.reduce((sum, set) => sum + (set.weight_kg ?? 0) * (set.reps ?? 0), 0);
        const setCount = sets.length;
        const durationMinutes = session.duration_minutes ?? Math.max(setCount * 3, 30);
        const estimatedBurnKcal = Math.round(durationMinutes * 4.5);

        const updateSession = await this.client
            .from('workout_sessions')
            .update({
                status: 'completed',
                duration_minutes: durationMinutes,
                total_volume_kg: totalVolume,
                estimated_burn_kcal: estimatedBurnKcal,
                completed_at: new Date().toISOString()
            })
            .eq('id', sessionId)
            .eq('user_id', userId);
        if (updateSession.error) {
            throw updateSession.error;
        }

        const shouldMarkCompleted = sets
            .filter((set) => !set.completed && (set.weight_kg !== null || set.reps !== null || set.rpe !== null))
            .map((set) => set.id);

        if (shouldMarkCompleted.length) {
            const updateSets = await this.client
                .from('workout_sets')
                .update({ completed: true })
                .in('id', shouldMarkCompleted);
            if (updateSets.error) {
                throw updateSets.error;
            }
        }

        return this.getSessionById(userId, sessionId);
    }

    private async getSessionById(userId: string, sessionId: string): Promise<WorkoutSessionDto> {
        const sessionResult = await this.client
            .from('workout_sessions')
            .select('id,template_id,date,title,focus,status,duration_minutes,total_volume_kg,estimated_burn_kcal')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        const session = requireSupabaseOk(sessionResult as any, `Workout session ${sessionId} not found`) as Omit<SessionRow, 'created_at'>;

        const exercisesResult = await this.client
            .from('workout_session_exercises')
            .select('id,session_id,exercise_id,exercise_name,sort_order')
            .eq('session_id', sessionId)
            .order('sort_order', { ascending: true });
        const exercises = requireSupabaseOk(exercisesResult as any, 'Unable to load workout exercises') as SessionExerciseRow[];

        const sets = await this.loadSetsByExerciseIds(exercises.map((exercise) => exercise.id));

        const mappedExercises: WorkoutSessionExerciseDto[] = exercises.map((exercise) => ({
            id: exercise.id,
            exerciseId: exercise.exercise_id,
            exerciseName: exercise.exercise_name,
            order: exercise.sort_order,
            sets: sets
                .filter((set) => set.session_exercise_id === exercise.id)
                .sort((a, b) => a.sort_order - b.sort_order)
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

    private async loadSetsByExerciseIds(exerciseIds: string[]): Promise<SetRow[]> {
        if (!exerciseIds.length) {
            return [];
        }

        const setsResult = await this.client
            .from('workout_sets')
            .select('id,session_exercise_id,sort_order,weight_kg,reps,rpe,completed')
            .in('session_exercise_id', exerciseIds)
            .order('sort_order', { ascending: true });
        return requireSupabaseOk(setsResult as any, 'Unable to load workout sets') as SetRow[];
    }

    private async findLatestSessionRow(userId: string, date: string): Promise<SessionRow | null> {
        const result = await this.client
            .from('workout_sessions')
            .select('id,template_id,date,title,focus,status,duration_minutes,total_volume_kg,estimated_burn_kcal,created_at')
            .eq('user_id', userId)
            .eq('date', date)
            .order('created_at', { ascending: false })
            .limit(1);

        const rows = requireSupabaseOk(result as any, 'Unable to load workout session') as SessionRow[];
        return rows[0] ?? null;
    }

    private async requireSessionRow(userId: string, sessionId: string): Promise<SessionRow> {
        const result = await this.client
            .from('workout_sessions')
            .select('id,template_id,date,title,focus,status,duration_minutes,total_volume_kg,estimated_burn_kcal,created_at')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        return requireSupabaseOk(result as any, `Workout session ${sessionId} not found`) as SessionRow;
    }

    private async getDefaultTemplateRow(userId: string): Promise<TemplateRow | null> {
        const result = await this.client
            .from('workout_templates')
            .select('id,name,focus')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(1);

        const rows = requireSupabaseOk(result as any, 'Unable to load workout template') as TemplateRow[];
        return rows[0] ?? null;
    }

    private async cloneTemplateExercises(sessionId: string, templateId: string): Promise<void> {
        const exercisesResult = await this.client
            .from('template_exercises')
            .select('exercise_id,exercise_name,sort_order')
            .eq('template_id', templateId)
            .order('sort_order', { ascending: true });
        const templateExercises = requireSupabaseOk(exercisesResult as any, 'Unable to load template exercises') as Array<{
            exercise_id: string;
            exercise_name: string;
            sort_order: number;
        }>;

        if (!templateExercises.length) {
            return;
        }

        const insertRows = templateExercises.map((exercise) => ({
            id: createId('session-exercise'),
            session_id: sessionId,
            exercise_id: exercise.exercise_id,
            exercise_name: exercise.exercise_name,
            sort_order: exercise.sort_order
        }));

        const insertResult = await this.client.from('workout_session_exercises').insert(insertRows);
        if (insertResult.error) {
            throw insertResult.error;
        }
    }
}
