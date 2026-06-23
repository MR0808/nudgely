'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[app-error]', error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="max-w-md text-muted-foreground">
                An unexpected error occurred. Please try again, or contact
                support if the problem persists.
            </p>
            <Button onClick={() => reset()}>Try again</Button>
        </div>
    );
}
