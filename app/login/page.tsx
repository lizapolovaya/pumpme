import { LoginClient } from './login-client';
import { getSupabaseAuthConfig } from '../../lib/server/auth/config';

type LoginPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const nextValue = resolvedSearchParams.next;
    const nextPath = typeof nextValue === 'string' && nextValue.startsWith('/') ? nextValue : '/';
    const isConfigured = Boolean(getSupabaseAuthConfig());

    return <LoginClient isConfigured={isConfigured} nextPath={nextPath} />;
}
