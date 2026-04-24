import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAuthConfig } from './config';

export async function createSupabaseServerAuthClient() {
    const config = getSupabaseAuthConfig();

    if (!config) {
        return null;
    }

    const cookieStore = await cookies();

    return createServerClient(config.url, config.anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    for (const cookie of cookiesToSet) {
                        cookieStore.set(cookie.name, cookie.value, cookie.options as CookieOptions);
                    }
                } catch {
                    return;
                }
            }
        }
    });
}

