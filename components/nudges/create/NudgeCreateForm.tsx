'use client';

import type * as z from 'zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';

import { CreateNudgeSchema } from '@/schemas/nudge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { NudgeCreateFormProps } from '@/types/nudge';
import NudgeCreateFormBasicInformation from '@/components/nudges/create/NudgeCreateFormBasicInformation';
import NudgeCreateFormScheduleSettings from '@/components/nudges/create/NudgeCreateFormScheduleSettings';
import NudgeCreateFormEndDate from '@/components/nudges/create/NudgeCreateFormEndDate';
import NudgeCreateFormRecipients from '@/components/nudges/create/NudgeCreateFormRecipients';

const NudgeCreateForm = ({
    returnTeams,
    initialTeam,
    initialTimezone
}: NudgeCreateFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [submitMessage, setSubmitMessage] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    const form = useForm<z.infer<typeof CreateNudgeSchema>>({
        resolver: zodResolver(CreateNudgeSchema),
        defaultValues: {
            frequency: 'DAILY',
            teamId: initialTeam,
            interval: 1,
            endType: 'NEVER',
            timezone: initialTimezone,
            recipients: [{ firstName: '', email: '' }],
            timeOfDay: '9:00 AM',
            monthlyType: undefined, // or a default enum value
            dayOfMonth: undefined,
            nthOccurrence: undefined,
            dayOfWeekForMonthly: undefined
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'recipients'
    });

    const onSubmit = async (data: z.infer<typeof CreateNudgeSchema>) => {
        setSubmitMessage(null);
        startTransition(async () => {
            console.log(data);
        });

        // try {
        //     // const result = await createReminder(data);
        //     // if (result.success) {
        //     //     setSubmitMessage({
        //     //         type: 'success',
        //     //         message: 'Reminder created successfully!'
        //     //     });
        //     //     form.reset();
        //     // } else {
        //     //     setSubmitMessage({
        //     //         type: 'error',
        //     //         message: result.error || 'Failed to create reminder'
        //     //     });
        //     // }
        // } catch (error) {
        //     setSubmitMessage({
        //         type: 'error',
        //         message: 'An unexpected error occurred'
        //     });
        // }
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
                <NudgeCreateFormRecipients />

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

export default NudgeCreateForm;
