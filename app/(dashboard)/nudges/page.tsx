'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// Dummy data for nudges
const mockNudges = [
    {
        id: 1,
        title: 'Send Weekly Report',
        description: 'Send updates to client',
        frequency: 'Weekly',
        time: '09:00 AM',
        recipients: ['alice@example.com', 'bob@example.com'],
        active: true
    },
    {
        id: 2,
        title: 'Team Standup',
        description: 'Daily reminder for 9:30 standup',
        frequency: 'Daily',
        time: '09:30 AM',
        recipients: ['team@example.com'],
        active: false
    }
];

const mockTeams = [
    { id: 'team1', name: 'Marketing' },
    { id: 'team2', name: 'Product' },
    { id: 'team3', name: 'Operations' }
];

export default function NudgeDashboard() {
    const [selectedTeam, setSelectedTeam] = useState(mockTeams[0].id);
    const [nudges, setNudges] = useState(mockNudges);

    function toggleNudgeActive(id: number) {
        setNudges((prev) =>
            prev.map((n) => (n.id === id ? { ...n, active: !n.active } : n))
        );
    }

    function deleteNudge(id: number) {
        setNudges((prev) => prev.filter((n) => n.id !== id));
    }

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold">Your Nudges</h1>

                <div className="flex items-center gap-4">
                    <Select
                        value={selectedTeam}
                        onValueChange={(val) => setSelectedTeam(val)}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                            {mockTeams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={() => alert('Go to Add Nudge Page')}>
                        + Add Nudge
                    </Button>
                </div>
            </div>

            {/* Nudge List */}
            <div className="grid gap-4">
                {nudges.map((nudge) => (
                    <Card
                        key={nudge.id}
                        className="hover:shadow-lg transition cursor-pointer group"
                    >
                        <Link href={`/nudges/${nudge.id}`} className="block">
                            <CardHeader className="flex flex-row justify-between items-center">
                                <CardTitle className="text-lg group-hover:text-blue-600 transition">
                                    {nudge.title}
                                </CardTitle>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => e.preventDefault()}
                                        >
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>
                                            Actions
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => alert('Edit Nudge')}
                                        >
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                toggleNudgeActive(nudge.id)
                                            }
                                        >
                                            {nudge.active ? 'Pause' : 'Resume'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                deleteNudge(nudge.id)
                                            }
                                            className="text-red-600"
                                        >
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600">
                                    {nudge.description}
                                </p>
                                <div className="mt-2 text-sm text-gray-500">
                                    Frequency:{' '}
                                    <span className="font-medium">
                                        {nudge.frequency}
                                    </span>{' '}
                                    <br />
                                    Time: {nudge.time} <br />
                                    Recipients: {nudge.recipients.join(', ')}
                                </div>
                                <div className="mt-2">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                            nudge.active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}
                                    >
                                        {nudge.active ? 'Active' : 'Paused'}
                                    </span>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    );
}
