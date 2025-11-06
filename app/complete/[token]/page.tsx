import { XCircle } from 'lucide-react';

import CompletionForm from '@/components/complete/CompletionForm';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { ParamsToken } from '@/types/global';
import { getRecipientEvent } from '@/actions/complete';

const CompletePage = async (props: { params: Promise<ParamsToken> }) => {
    const { token } = await props.params;

    const { data: recipientEvent, error } = await getRecipientEvent(token);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
                <Card className="w-full max-w-md border-2 border-destructive/20 shadow-lg">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                                Error
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                An error occurred while loading this reminder.
                            </CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (!recipientEvent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
                <Card className="w-full max-w-md border-2 border-destructive/20 shadow-lg">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                                Invalid Link
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                This reminder link is not valid.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-sm text-muted-foreground">
                            <p>Please check the URL and try again.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Check if token has expired
    if (new Date() > recipientEvent.expiresAt) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
                <Card className="w-full max-w-md border-2 border-destructive/20 shadow-lg">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                                Link Expired
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                This reminder link has expired.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-sm text-muted-foreground">
                            <p>
                                Please contact your team administrator if you
                                need assistance.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Check if already completed
    if (recipientEvent.nudgeInstance.completion) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
                <Card className="w-full max-w-md border-2 border-destructive/20 shadow-lg">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                                Already Completed
                            </CardTitle>
                            <CardDescription className="text-base mt-2">
                                This reminder has already been completed.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-sm text-muted-foreground">
                            <p>
                                Completed on{' '}
                                {new Date(
                                    recipientEvent.nudgeInstance.completion.createdAt
                                ).toLocaleString()}
                                {recipientEvent.nudgeInstance.completion
                                    .completedByName &&
                                    ` by ${recipientEvent.nudgeInstance.completion.completedByName}`}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Show confirmation form
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
            <CompletionForm
                token={token}
                nudgeName={recipientEvent.nudgeInstance.nudge.name}
                nudgeDescription={
                    recipientEvent.nudgeInstance.nudge.description
                }
                recipientName={recipientEvent.recipientName}
                scheduledFor={recipientEvent.nudgeInstance.scheduledFor}
            />
        </div>
    );
};

export default CompletePage;
