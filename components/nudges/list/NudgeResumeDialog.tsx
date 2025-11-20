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
import { NudgePauseDialogProps } from '@/types/nudge';
import { resumeNudge } from '@/actions/nudges';

const NudgeResumeDialog = ({
    name,
    open,
    setOpen,
    nudgeId,
    setNudges
}: NudgePauseDialogProps) => {
    const [isPending, startTransition] = useTransition();

    const onPause = () => {
        startTransition(async () => {
            const result = await resumeNudge(nudgeId);
            if (!result.success) {
                toast.error(result.error);
            }
            if (result.success) {
                if (setNudges) setNudges(result.data.nudges);
                setOpen(false);
                toast.success('Nudge resumed');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Resume Nudge
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you wish to resume the{' '}
                        <span className="font-bold">{name}</span> nudge?
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
                        onClick={onPause}
                        className="cursor-pointer"
                    >
                        {isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Resume Nudge
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NudgeResumeDialog;
