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
import { RemoveAdminMemberDialogProps } from '@/types/company';
import { removeCompanyAdminMember } from '@/actions/companyMembers';

const RemoveAdminMemberDialog = ({
    name,
    email,
    memberId,
    setMembers,
    open,
    onOpenChange
}: RemoveAdminMemberDialogProps) => {
    const [isPending, startTransition] = useTransition();

    const onRemove = () => {
        startTransition(async () => {
            const result = await removeCompanyAdminMember(memberId);
            if (result.error) {
                toast.error(result.error);
            }
            if (result.members) {
                setMembers(result.members);
                onOpenChange(false);
                toast.success('User removed as admin');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Remove admin
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you wish to remove {name} ({email}) as an
                        admin? This will not remove the user from your company,
                        only as an admin, you will need to do this through the
                        Teams and Users page.
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
                        onClick={onRemove}
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

export default RemoveAdminMemberDialog;
