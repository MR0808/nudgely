'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ReloadIcon } from '@radix-ui/react-icons';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogoutDialogProps } from '@/types/auth';
import { signOut } from '@/lib/auth-client';

const LogoutDialog = ({ open, onOpenChange }: LogoutDialogProps) => {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    async function handleConfirm() {
        await signOut({
            fetchOptions: {
                onRequest: () => {
                    setIsPending(true);
                },
                onResponse: () => {
                    setIsPending(true);
                },
                onError: (ctx) => {
                    toast.error(ctx.error.message);
                },
                onSuccess: () => {
                    toast.success("You've logged out. See you soon!");
                    router.push('/auth/login');
                }
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-4/5">
                <DialogHeader>
                    <DialogTitle>Sign out</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to sign out?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                Please wait...
                            </>
                        ) : (
                            'Confirm'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
export default LogoutDialog;
