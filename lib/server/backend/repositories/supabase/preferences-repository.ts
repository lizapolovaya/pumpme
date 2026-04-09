import type { SupabaseClient } from '@supabase/supabase-js';
import type { PreferencesRepository } from '../contracts';
import type { UpdatePreferencesInput } from '../../types';
import { ensureUserScaffold } from './shared';
import { requireSupabaseOk } from './client';

type PreferencesRow = {
    unit_system: string;
    food_database_region: string;
    theme_mode: 'dark';
};

function mapPreferencesRow(row: PreferencesRow) {
    return {
        unitSystem: row.unit_system as any,
        foodDatabaseRegion: row.food_database_region,
        themeMode: row.theme_mode
    };
}

export class SupabasePreferencesRepository implements PreferencesRepository {
    constructor(private readonly client: SupabaseClient) {}

    async getPreferences(userId: string) {
        await ensureUserScaffold(this.client, userId);

        const result = await this.client
            .from('user_preferences')
            .select('unit_system,food_database_region,theme_mode')
            .eq('user_id', userId)
            .single();

        const row = requireSupabaseOk(result as any, `Preferences not found for user ${userId}`) as PreferencesRow;
        return mapPreferencesRow(row);
    }

    async updatePreferences(userId: string, input: UpdatePreferencesInput) {
        await ensureUserScaffold(this.client, userId);
        const current = await this.getPreferences(userId);

        const nextPreferences = {
            unitSystem: input.unitSystem ?? current.unitSystem,
            foodDatabaseRegion: input.foodDatabaseRegion ?? current.foodDatabaseRegion
        };

        const update = await this.client
            .from('user_preferences')
            .update({
                unit_system: nextPreferences.unitSystem,
                food_database_region: nextPreferences.foodDatabaseRegion
            })
            .eq('user_id', userId);
        if (update.error) {
            throw update.error;
        }

        return this.getPreferences(userId);
    }
}
