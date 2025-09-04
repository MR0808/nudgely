'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SuccessStep = () => {
    const router = useRouter();

    const handleContinue = () => {
        router.push('/');
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="text-center">
                <Card className="border-border">
                    <CardHeader className="text-center pb-6">
                        <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-accent" />
                        </div>
                        <CardTitle className="text-2xl text-card-foreground">
                            Welcome to Nudgely!
                        </CardTitle>
                        <CardDescription className="text-lg">
                            Your company profile has been created successfully
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <div className="space-y-2">
                            <p className="text-muted-foreground">
                                You&apos;re all set! You can now start creating
                                teams, inviting members, and managing your
                                recurring tasks.
                            </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <h4 className="font-medium text-card-foreground">
                                Next steps:
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-1 text-left">
                                <li>• Create your first team</li>
                                <li>• Invite team members</li>
                                <li>• Set up your first recurring task</li>
                                <li>• Explore billing options</li>
                            </ul>
                        </div>

                        <Button
                            onClick={handleContinue}
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            Continue to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SuccessStep;
