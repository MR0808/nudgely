'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { TemplateDeleteDialogProps } from '@/types/template';
import { AlertTriangle } from 'lucide-react';

const TemplateDeleteDialog = ({
    open,
    onOpenChange,
    templateName,
    onConfirm,
    isPending
}: TemplateDeleteDialogProps) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="pt-3">
                        Are you sure you want to delete{' '}
                        <span className="font-semibold text-foreground">
                            {templateName}
                        </span>
                        ? This action cannot be undone and the template will be
                        permanently removed from your team.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel
                        disabled={isPending}
                        className=" cursor-pointer"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                    >
                        {isPending ? 'Deleting...' : 'Delete Template'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default TemplateDeleteDialog;
