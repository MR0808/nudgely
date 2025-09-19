'use client';

import { Loader2, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { ReactivateMemberDialogProps } from '@/types/team';

const ReactivateMemberDialog = ({
    memberId,
    open,
    setOpen,
    onReactivate,
    isPending
}: ReactivateMemberDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Deactivate Member
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you wish to reactivate this member? If you
                        have used all your users, this will fail. Please note,
                        you will need to add this user back to all their teams
                        again.
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
                        onClick={() => onReactivate(memberId)}
                        className="cursor-pointer"
                    >
                        {isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Reactivate Member
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReactivateMemberDialog;
