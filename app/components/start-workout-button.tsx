'use client';

import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { useState, useTransition } from 'react';

type StartWorkoutButtonProps = {
    date: string;
    focus: string | null;
    sessionId: string | null;
    sessionStatus: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'none';
    templateId: string | null;
    title: string;
};

export function StartWorkoutButton({
    date,
    focus,
    sessionId,
    sessionStatus,
    templateId,
    title
}: StartWorkoutButtonProps) {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        startTransition(async () => {
            setError(null);

            try {
                if (sessionId && sessionStatus === 'scheduled') {
                    const response = await fetch(`/api/workouts/sessions/${sessionId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status: 'active'
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Unable to activate workout');
                    }
                } else if (!sessionId || sessionStatus === 'none' || sessionStatus === 'cancelled') {
                    const response = await fetch('/api/workouts/sessions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            date,
                            focus,
                            templateId,
                            title
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Unable to create workout');
                    }
                }

                router.push('/workouts');
                router.refresh();
            } catch {
                setError('Unable to open today\'s workout.');
            }
        });
    }

    return (
        <div className="space-y-2">
            <button
                className="flex w-full items-center justify-center gap-4 rounded-2xl bg-linear-to-r from-primary to-primary-container px-6 py-6 text-on-primary-fixed shadow-lime transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isPending}
                onClick={handleClick}
                type="button"
            >
                <span className="font-headline text-2xl font-black italic uppercase tracking-[-0.08em]">
                    {isPending ? 'Opening Workout' : 'Start Workout'}
                </span>
                <Play className="h-6 w-6 fill-current" strokeWidth={2.4} />
            </button>
            {error ? (
                <p className="text-sm text-error">{error}</p>
            ) : null}
        </div>
    );
}
