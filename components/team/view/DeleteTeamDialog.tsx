'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Building2, Trash2, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DeleteTeamDialogProps } from '@/types/team';

const DeleteTeamDialog = ({ teamId }: DeleteTeamDialogProps) => {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const onDelete = () => {
        // startTransition(async () => {
        //     const result = await removeTeamMember(memberId, teamId);
        //     if (result.error) {
        //         toast.error(result.error);
        //     }
        //     if (result.data) {
        //         setMembers(result.data);
        //         onOpenChange(false);
        //         toast.success('User removed from team');
        //     }
        // });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        className="text-destructive cursor-pointer"
                        onClick={() => setOpen(true)}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Delete Team
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you wish to delete this team? This will
                            be permanent. Team members will not be removed from
                            your company, just the team.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isPending}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={isPending}
                            onClick={onDelete}
                            className="cursor-pointer"
                        >
                            {isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Delete Team
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DeleteTeamDialog;
