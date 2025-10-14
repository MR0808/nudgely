'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Example placeholder data (replace with fetch in production)
const mockNudge = {
    id: 1,
    title: 'Send Weekly Report',
    description: 'Send updates to client with progress and blockers.',
    frequency: 'Weekly',
    time: '09:00 AM',
    timezone: 'Australia/Melbourne',
    recipients: ['alice@example.com', 'bob@example.com'],
    status: 'Active',
    history: [
        {
            id: 'h1',
            date: '2025-10-01',
            status: 'Completed',
            completedBy: 'alice@example.com'
        },
        {
            id: 'h2',
            date: '2025-09-24',
            status: 'Completed',
            completedBy: 'bob@example.com'
        },
        { id: 'h3', date: '2025-09-17', status: 'Failed' }
    ]
};

export default function NudgeDetailPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto max-w-4xl py-10 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{mockNudge.title}</h1>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/dashboard/nudges')}
                    >
                        Back
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => alert('Edit Nudge')}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => alert('Pause/Resume Nudge')}
                            >
                                {mockNudge.status === 'Active'
                                    ? 'Pause'
                                    : 'Resume'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => confirm('Delete Nudge?')}
                                className="text-red-600"
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Nudge Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-gray-700">{mockNudge.description}</p>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Frequency:</span>{' '}
                            {mockNudge.frequency}
                        </div>
                        <div>
                            <span className="font-medium">Time:</span>{' '}
                            {mockNudge.time} ({mockNudge.timezone})
                        </div>
                        <div>
                            <span className="font-medium">Recipients:</span>{' '}
                            {mockNudge.recipients.join(', ')}
                        </div>
                        <div>
                            <span className="font-medium">Status:</span>{' '}
                            <Badge
                                variant={
                                    mockNudge.status === 'Active'
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {mockNudge.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* History */}
            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {mockNudge.history.map((h) => (
                            <div
                                key={h.id}
                                className="flex justify-between items-center border-b py-2 text-sm"
                            >
                                <span>{h.date}</span>
                                <span
                                    className={`font-medium ${
                                        h.status === 'Completed'
                                            ? 'text-green-600'
                                            : h.status === 'Failed'
                                              ? 'text-red-600'
                                              : 'text-gray-600'
                                    }`}
                                >
                                    {h.status}
                                </span>
                                {h.completedBy && (
                                    <span className="text-gray-500 text-xs">
                                        by {h.completedBy}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
