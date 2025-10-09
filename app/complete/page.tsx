'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

// Mock data — in production, fetch via server action with token validation
const mockNudge = {
    id: 'task_123',
    title: 'Submit Weekly Report',
    description: "Reminder to submit this week's client report.",
    dueDate: '2025-10-05',
    frequency: 'Weekly',
    recipientEmail: 'alice@example.com'
};

export default function NudgeCompletionPage() {
    const [status, setStatus] = useState<
        'idle' | 'loading' | 'success' | 'error'
    >('idle');
    const router = useRouter();

    async function handleComplete() {
        try {
            setStatus('loading');
            // Example: call server action
            await fetch('/api/nudge/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nudgeId: mockNudge.id })
            });
            setStatus('success');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    }

    return (
        <div className="container mx-auto max-w-md py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        Confirm Completion
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status === 'idle' && (
                        <>
                            <p className="text-gray-700">
                                You’re marking the following nudge as{' '}
                                <strong>completed</strong>:
                            </p>
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <h2 className="font-semibold">
                                    {mockNudge.title}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {mockNudge.description}
                                </p>
                                <p className="text-sm mt-2">
                                    <strong>Due:</strong> {mockNudge.dueDate}
                                </p>
                                <p className="text-sm">
                                    <strong>Recipient:</strong>{' '}
                                    {mockNudge.recipientEmail}
                                </p>
                            </div>
                            <Button
                                className="w-full"
                                onClick={handleComplete}
                                // disabled={status === 'loading'}
                            >
                                Confirm Complete
                                {/* {status === 'loading'
                                    ? 'Marking...'
                                    : 'Confirm Complete'} */}
                            </Button>
                        </>
                    )}

                    {status === 'success' && (
                        <div className="text-center space-y-3">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                            <h3 className="text-lg font-semibold">
                                Nudge Completed
                            </h3>
                            <p className="text-gray-600">
                                Thanks! This completion has been logged and the
                                team notified.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.push('https://nudgely.com')
                                }
                            >
                                Go to Nudgely
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <p className="text-red-600 text-sm">
                            Something went wrong. Please try again or contact
                            support.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
