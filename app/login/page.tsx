import { LoginClient } from './login-client';

type LoginPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const nextValue = resolvedSearchParams.next;
    const nextPath = typeof nextValue === 'string' && nextValue.startsWith('/') ? nextValue : '/';

    return <LoginClient nextPath={nextPath} />;
}
