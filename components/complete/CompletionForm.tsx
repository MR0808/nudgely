'use client';

import type * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { useState, useTransition } from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { completeNudge } from '@/actions/complete';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CompletionFormProps } from '@/types/complete';
import { CompletionSchema } from '@/schemas/complete';

const CompletionForm = ({
    token,
    nudgeName,
    nudgeDescription,
    recipientName,
    scheduledFor
}: CompletionFormProps) => {
    const [isPending, startTransition] = useTransition();
    const [comments, setComments] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [result, setResult] = useState<any>(null);

    const form = useForm<z.infer<typeof CompletionSchema>>({
        resolver: zodResolver(CompletionSchema),
        defaultValues: {
            comments: ''
        }
    });

    const formatDateTime = (date: Date | string) => {
        const d = new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(d);
    };

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(d);
    };

    const onSubmit = (values: z.infer<typeof CompletionSchema>) => {
        startTransition(async () => {
            try {
                const response = await completeNudge({
                    token,
                    comments: values.comments || undefined
                });
                setResult(response);
                if (response.success) {
                    setComments(values.comments || '');
                    setIsCompleted(true);
                }
            } catch (error) {
                setResult({
                    success: false,
                    message: 'An error occurred. Please try again.'
                });
            }
        });
    };

    if (isCompleted && result?.success) {
        return (
            <Card className="w-full max-w-md border-2 border-primary/20 shadow-lg">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
                            Completed!
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            Thank you for completing this reminder
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <h3 className="font-semibold mb-2">
                            {result.nudgeName}
                        </h3>
                        {result.nudgeDescription && (
                            <p className="text-sm text-muted-foreground">
                                {result.nudgeDescription}
                            </p>
                        )}
                    </div>

                    {comments && (
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <p className="text-sm font-medium mb-1">
                                Your comment:
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {comments}
                            </p>
                        </div>
                    )}

                    <div className="text-center text-sm text-muted-foreground">
                        <p>
                            Completed at {formatDateTime(result.completedAt!)}
                        </p>
                        {result.completedBy && (
                            <p className="mt-1">by {result.completedBy}</p>
                        )}
                    </div>

                    {result.nextScheduled && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                Next reminder:{' '}
                                {formatDate(result.nextScheduled)}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-lg">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader className="text-center space-y-2 pb-5">
                        <CardTitle className="flex flex-col items-center justify-center gap-2 text-2xl font-bold">
                            <Image
                                src="/images/logo/logo.png"
                                alt="Nudgely"
                                width={200}
                                height={100}
                                className="mx-auto"
                            />
                            Complete Reminder
                        </CardTitle>
                        <CardDescription>
                            Confirm that you have completed this task
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/50 border border-border">
                            <h3 className="font-semibold mb-2">{nudgeName}</h3>
                            {nudgeDescription && (
                                <p className="text-sm text-muted-foreground mb-3">
                                    {nudgeDescription}
                                </p>
                            )}
                            <div className="text-xs text-muted-foreground">
                                <p>For: {recipientName}</p>
                                <p>Scheduled: {formatDateTime(scheduledFor)}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="comments"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Add a comment (optional)
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Add any notes or comments about completing this task..."
                                                rows={4}
                                                className="resize-none"
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <p className="text-xs text-muted-foreground pb-5">
                                This comment will be saved with your completion
                                record.
                            </p>
                        </div>

                        {result && !result.success && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-900 dark:text-red-100">
                                    {result.message}
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Completing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark as Complete
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
};

export default CompletionForm;
