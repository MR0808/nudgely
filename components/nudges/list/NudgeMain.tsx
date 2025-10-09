'use client';

import { useState } from 'react';
import Link from 'next/link';

import NudgeTeamSelector from '@/components/nudges/list/NudgeTeamSelector';
import { Button } from '@/components/ui/button';
import { NudgeMainProps } from '@/types/nudge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTeamStore } from '@/stores/teamStore';

const NudgeMain = ({ returnTeams, returnNudges }: NudgeMainProps) => {
    const [nudges, setNudges] = useState(returnNudges);
    const [selectedTeam, setSelectedTeam] = useState(returnTeams[0]);

    if (!returnTeams) return null;

    return (
        <div className="container mx-auto max-w-5xl py-10 space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h1 className="text-2xl font-bold">Your Nudges</h1>

                <div className="flex items-center gap-4">
                    <NudgeTeamSelector
                        returnTeams={returnTeams}
                        selectedTeam={selectedTeam}
                        setSelectedTeam={setSelectedTeam}
                    />

                    {returnTeams && returnTeams.length > 0 && (
                        <Link href={`/nudges/create?id=${selectedTeam?.id}`}>
                            <Button className="h-12 cursor-pointer">
                                + Add Nudge
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
            <div className="grid gap-4">
                {nudges && nudges.length > 0
                    ? nudges.map((nudge) => (
                          <Card
                              key={nudge.id}
                              className="hover:shadow-lg transition cursor-pointer group"
                          >
                              <Link
                                  href={`/nudges/${nudge.id}`}
                                  className="block"
                              >
                                  <CardHeader className="flex flex-row justify-between items-center">
                                      <CardTitle className="text-lg group-hover:text-blue-600 transition">
                                          {nudge.title}
                                      </CardTitle>

                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={(e) =>
                                                      e.preventDefault()
                                                  }
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
                                                  onClick={() =>
                                                      alert('Edit Nudge')
                                                  }
                                              >
                                                  Edit
                                              </DropdownMenuItem>
                                              <DropdownMenuItem>
                                                  {nudge.status === 'ACTIVE'
                                                      ? 'Pause'
                                                      : 'Resume'}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem className="text-red-600">
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
                                          Time: {nudge.dueHour} <br />
                                          Recipients:{' '}
                                          {nudge.recipients.join(', ')}
                                      </div>
                                      <div className="mt-2">
                                          <span
                                              className={`px-2 py-1 rounded text-xs font-medium ${
                                                  nudge.status == 'ACTIVE'
                                                      ? 'bg-green-100 text-green-700'
                                                      : 'bg-gray-200 text-gray-600'
                                              }`}
                                          >
                                              {nudge.status === 'ACTIVE'
                                                  ? 'Active'
                                                  : 'Paused'}
                                          </span>
                                      </div>
                                  </CardContent>
                              </Link>
                          </Card>
                      ))
                    : "There are no nudges for this team. Why don't you create one now?"}
            </div>
        </div>
    );
};
export default NudgeMain;
