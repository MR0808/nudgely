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
import { CancelInviteDialogProps } from '@/types/company';
import { cancelCompanyInvitation } from '@/actions/companyMembers';

const CancelInviteDialog = ({
    name,
    email,
    inviteId,
    setPendingInvites,
    open,
    onOpenChange
}: CancelInviteDialogProps) => {
    const [isPending, startTransition] = useTransition();

    const onCancel = () => {
        startTransition(async () => {
            const result = await cancelCompanyInvitation(inviteId);
            if (result.error) {
                toast.error(result.error);
            }
            if (result.data) {
                setPendingInvites(result.data.invitations);
                onOpenChange(false);
                toast.success('User invite cancelled');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Cancel Invite
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you wish to cancel the invitation for{' '}
                        {name} ({email})?
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={isPending}
                        onClick={onCancel}
                    >
                        {isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Cancel Invite
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CancelInviteDialog;
