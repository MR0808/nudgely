'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Building2, Trash2, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
import { DeactivateMemberDialogProps } from '@/types/team';
import { deleteTeam } from '@/actions/team';

const DeactivateMemberDialog = ({
    memberId,
    setFilteredUsers
}: DeactivateMemberDialogProps) => {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const onDelete = () => {
        startTransition(async () => {
            // const result = await deleteTeam(teamId);
            // if (result.error) {
            //     toast.error(result.error);
            // }
            // if (result.data) {
            //     if (setFilteredTeams) {
            //         setFilteredTeams(result.data);
            //         setOpen(false);
            //     } else {
            //         router.push('/team');
            //         setOpen(false);
            //     }
            //     toast.success('Team successfully deleted');
            // }
        });
    };

    return (
        <>
            <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Member
            </DropdownMenuItem>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Deactivate Member
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you wish to deactivate this member?
                            This will remove the member from your account total,
                            however, you will be able to reactivate them if you
                            wish, if you have space.
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
                            Deactivate Member
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DeactivateMemberDialog;
