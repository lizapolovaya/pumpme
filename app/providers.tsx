'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function AppProviders({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    mutations: {
                        retry: 0
                    },
                    queries: {
                        gcTime: 600_000,
                        refetchOnWindowFocus: false,
                        retry: 1
                    }
                }
            })
    );

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
