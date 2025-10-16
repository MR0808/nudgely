'use client';

import type * as z from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { CreateNudgeSchema } from '@/schemas/nudge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { NudgeEditFormProps } from '@/types/nudge';
import NudgeCreateFormBasicInformation from '@/components/nudges/form/NudgeCreateFormBasicInformation';
import NudgeCreateFormScheduleSettings from '@/components/nudges/form/NudgeCreateFormScheduleSettings';
import NudgeCreateFormEndDate from '@/components/nudges/form/NudgeCreateFormEndDate';
import NudgeCreateFormRecipients from '@/components/nudges/form/NudgeCreateFormRecipients';
import { createNudge } from '@/actions/nudges';
import { logNudgeCreated } from '@/actions/audit/audit-nudge';

const NudgeEditForm = ({
    nudge,
    returnTeams,
    userSession,
    plan
}: NudgeEditFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [submitMessage, setSubmitMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);
    const router = useRouter();

    const form = useForm<z.infer<typeof CreateNudgeSchema>>({
        resolver: zodResolver(CreateNudgeSchema),
        defaultValues: {
            name: nudge.name,
            description: nudge.description || '',
            frequency: nudge.frequency,
            teamId: nudge.teamId,
            interval: nudge.interval,
            endType: nudge.endType,
            timezone: nudge.timezone,
            recipients: nudge.recipients,
            timeOfDay: nudge.timeOfDay,
            monthlyType: nudge.monthlyType ?? undefined,
            dayOfMonth: nudge.dayOfMonth ?? undefined,
            nthOccurrence: nudge.nthOccurrence ?? undefined,
            dayOfWeekForMonthly: nudge.dayOfWeekForMonthly ?? undefined,
            dayOfWeek: nudge.dayOfWeek ?? undefined,
            endDate: nudge.endDate?.toString() ?? undefined,
            endAfterOccurrences: nudge.endAfterOccurrences ?? undefined
        }
    });

    const onSubmit = async (data: z.infer<typeof CreateNudgeSchema>) => {
        setSubmitMessage(null);
        startTransition(async () => {
            // const result = await createNudge(data);
            // if (result.nudge) {
            //     if (userSession) {
            //         await logNudgeCreated(userSession.user.id, {
            //             nudgeId: result.nudge.id,
            //             teamName: result.nudge.name
            //         });
            //     }
            //     toast.success('Nudge successfully created');
            //     router.push(`/nudges/${result.nudge.slug}`);
            // } else {
            //     setSubmitMessage({
            //         type: 'error',
            //         message: result.error || 'Failed to create nudge'
            //     });
            //     toast.error(result.error);
            // }
        });
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="max-w-5xl mx-auto p-6 space-y-8"
            >
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">Create Nudge</h1>
                    <p className="text-muted-foreground text-lg">
                        Set up automated email reminders with flexible
                        scheduling
                    </p>
                </div>

                {submitMessage && (
                    <div
                        className={`p-4 rounded-lg border-2 ${
                            submitMessage.type === 'success'
                                ? 'bg-green-50 border-green-500 text-green-800'
                                : 'bg-red-50 border-red-500 text-red-800'
                        }`}
                    >
                        {submitMessage.message}
                    </div>
                )}

                {/* Basic Information */}
                <NudgeCreateFormBasicInformation returnTeams={returnTeams} />

                {/* Schedule Settings */}
                <NudgeCreateFormScheduleSettings />

                {/* End Date Settings */}
                <NudgeCreateFormEndDate />

                {/* Recipients */}
                <NudgeCreateFormRecipients
                    maxRecipients={plan.maxRecipients}
                    planName={plan.name}
                />

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isPending}
                        className="px-12 text-lg bg-secondary hover:bg-secondary/90 text-secondary-foreground disabled:opacity-50"
                    >
                        {isPending ? 'Creating...' : 'Create Nudge'}
                    </Button>
                </div>
            </form>
        </Form>
    );
};

export default NudgeEditForm;
