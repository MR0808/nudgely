'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { RemoveMemberDialogProps } from '@/types/team';
import { removeTeamMember } from '@/actions/teamMember';

const RemoveMemberDialog = ({
    name,
    email,
    memberId,
    teamId,
    setMembers,
    open,
    onOpenChange
}: RemoveMemberDialogProps) => {
    const [isPending, startTransition] = useTransition();

    const onRemove = () => {
        startTransition(async () => {
            const result = await removeTeamMember(memberId, teamId);
            if (result.error) {
                toast.error(result.error);
            }
            if (result.data) {
                setMembers(result.data);
                onOpenChange(false);
                toast.success('User removed from team');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Remove member from team
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you wish to remove {name} ({email}) from
                        your team? This will not remove the member from your
                        company, you will need to do that separately.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={isPending}
                        onClick={onRemove}
                        className="cursor-pointer"
                    >
                        {isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Remove User
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RemoveMemberDialog;
