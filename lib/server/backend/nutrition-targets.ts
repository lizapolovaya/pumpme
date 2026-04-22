import type { ProfileDto, UpdateNutritionDayInput } from './types';

export type EffectiveNutritionTargets = Required<
    Pick<UpdateNutritionDayInput, 'caloriesTarget' | 'proteinTarget' | 'carbsTarget' | 'fatsTarget'>
>;

function roundTarget(value: number): number {
    return Math.max(0, Math.round(value));
}

export function hasAutoNutritionInputs(profile: ProfileDto): boolean {
    return (
        profile.biologicalSex !== null &&
        profile.age !== null &&
        profile.heightCm !== null &&
        profile.weightKg !== null &&
        profile.gymSessionsPerWeek !== null &&
        profile.desiredWeightKg !== null
    );
}

function getActivityMultiplier(gymSessionsPerWeek: number): number {
    if (gymSessionsPerWeek <= 1) {
        return 1.2;
    }

    if (gymSessionsPerWeek <= 3) {
        return 1.375;
    }

    if (gymSessionsPerWeek <= 5) {
        return 1.55;
    }

    return 1.725;
}

function getCalorieAdjustment(currentWeightKg: number, desiredWeightKg: number | null): number {
    if (desiredWeightKg === null) {
        return 0;
    }

    if (desiredWeightKg <= currentWeightKg - 2) {
        return -300;
    }

    if (desiredWeightKg >= currentWeightKg + 2) {
        return 300;
    }

    return 0;
}

function getGoalCalorieAdjustment(profile: ProfileDto): number {
    switch (profile.primaryGoal) {
        case 'muscle_gain':
            return 250;
        case 'fat_loss':
            return -350;
        case 'strength':
            return 100;
        case 'maintenance':
        case 'athleticism':
            return 0;
        default:
            return 0;
    }
}

export function getAutoNutritionTargets(profile: ProfileDto): EffectiveNutritionTargets {
    if (!hasAutoNutritionInputs(profile)) {
        return {
            caloriesTarget: 0,
            proteinTarget: 0,
            carbsTarget: 0,
            fatsTarget: 0
        };
    }

    const weightKg = profile.weightKg ?? 0;
    const heightCm = profile.heightCm ?? 0;
    const age = profile.age ?? 0;
    const biologicalSexOffset = profile.biologicalSex === 'male' ? 5 : -161;
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + biologicalSexOffset;
    const activityMultiplier = getActivityMultiplier(profile.gymSessionsPerWeek ?? 0);
    const desiredWeightAdjustment = getCalorieAdjustment(weightKg, profile.desiredWeightKg);
    const goalAdjustment = getGoalCalorieAdjustment(profile);
    const caloriesTarget = roundTarget(
        bmr * activityMultiplier +
            (profile.primaryGoal === 'fat_loss'
                ? Math.min(goalAdjustment, desiredWeightAdjustment)
                : profile.primaryGoal === 'muscle_gain'
                  ? Math.max(goalAdjustment, desiredWeightAdjustment)
                  : desiredWeightAdjustment + goalAdjustment)
    );
    const proteinWeightBasis = profile.desiredWeightKg ?? weightKg;
    const proteinTarget = roundTarget(proteinWeightBasis * 1.8);
    const fatsTarget = roundTarget(weightKg * 0.8);
    const remainingCalories = Math.max(0, caloriesTarget - proteinTarget * 4 - fatsTarget * 9);
    const carbsTarget = roundTarget(remainingCalories / 4);

    return {
        caloriesTarget,
        proteinTarget,
        carbsTarget,
        fatsTarget
    };
}
