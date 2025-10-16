'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { NudgeDropdownProps } from '@/types/nudge';
import NudgePauseDialog from '@/components/nudges/list/NudgePauseDialog';
import NudgeResumeDialog from '@/components/nudges/list/NudgeResumeDialog';

const NudgeDropdown = ({ status, nudgeId, name, slug }: NudgeDropdownProps) => {
    const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
    const [resumeDialogOpen, setResumeDialogOpen] = useState(false);

    const onPause = (nudgeId: string, name: string) => {
        setPauseDialogOpen(true);
    };

    const onResume = (nudgeId: string, name: string) => {
        setResumeDialogOpen(true);
    };
    return (
        <div className="flex items-center gap-2">
            <Link href="/nudges">
                <Button className="cursor-pointer" variant="outline">
                    Back
                </Button>
            </Link>

            {status !== 'FINISHED' && (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => e.preventDefault()}
                                className="cursor-pointer"
                            >
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <Link href={`/nudges/edit/${slug}`}>Edit</Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() =>
                                    status === 'ACTIVE'
                                        ? setPauseDialogOpen(true)
                                        : setResumeDialogOpen(true)
                                }
                            >
                                {status === 'ACTIVE' ? 'Pause' : 'Resume'}
                            </DropdownMenuItem>

                            <DropdownMenuItem className="text-red-600 cursor-pointer">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <NudgePauseDialog
                        nudgeId={nudgeId}
                        name={name}
                        open={pauseDialogOpen}
                        setOpen={setPauseDialogOpen}
                    />
                    <NudgeResumeDialog
                        nudgeId={nudgeId}
                        name={name}
                        open={resumeDialogOpen}
                        setOpen={setResumeDialogOpen}
                    />
                </>
            )}
        </div>
    );
};
export default NudgeDropdown;
