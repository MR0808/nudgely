'use client';
import { useState } from 'react';

import { CheckCircle, Mail, Users } from 'lucide-react';
import {
    TeamUserRegistationFormProps,
    InviteUserRegistrationData,
    RegistrationStep
} from '@/types/register';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import TeamUserInitialRegistationForm from '@/components/auth/teamUserRegistration/TeamUserInitialRegistationForm';
import TeamUserEmailVerificationForm from '@/components/auth/teamUserRegistration/TeamUserEmailVerificationForm';
import TeamUserRegistationComplete from '@/components/auth/teamUserRegistration/TeamUserRegistationComplete';

const TeamUserRegistationForm = ({ invite }: TeamUserRegistationFormProps) => {
    const [currentStep, setCurrentStep] = useState<RegistrationStep>('initial');
    const [registrationData, setRegistrationData] =
        useState<InviteUserRegistrationData>({
            name: '',
            lastName: '',
            email: invite.email,
            password: '',
            terms: false
        });

    const updateRegistrationData = (
        data: Partial<InviteUserRegistrationData>
    ) => {
        setRegistrationData((prev) => ({ ...prev, ...data }));
    };

    const goToStep = (step: RegistrationStep) => {
        setCurrentStep(step);
    };

    return (
        <div className="bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                {currentStep === 'initial' && (
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl">
                            Create your account
                        </CardTitle>
                        <CardDescription>
                            Thanks for accepting your invite. Use the form below
                            to create your account.
                        </CardDescription>
                    </CardHeader>
                )}

                {currentStep === 'email-verify' && (
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                            <Mail className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl">
                            Verify Your Email
                        </CardTitle>
                        <CardDescription>
                            <p>
                                We&apos;ve sent a 6-digit code to{' '}
                                <strong>{invite.email}</strong>.
                            </p>
                            <p>Please enter it below.</p>
                        </CardDescription>
                    </CardHeader>
                )}

                {currentStep === 'complete' && (
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-primary-foreground" />
                        </div>
                        <CardTitle className="text-2xl">
                            Welcome to Nudgely, {registrationData.name}!
                        </CardTitle>
                        <CardDescription>
                            Your account has been successfully created and
                            verified.
                        </CardDescription>
                    </CardHeader>
                )}

                <CardContent className="space-y-6">
                    {/* Role */}
                    <div className="p-4 border rounded-lg">
                        {currentStep === 'initial' && (
                            <TeamUserInitialRegistationForm
                                invite={invite}
                                data={registrationData}
                                onNext={(data) => {
                                    updateRegistrationData(data);
                                    goToStep('email-verify');
                                }}
                            />
                        )}

                        {currentStep === 'email-verify' && (
                            <TeamUserEmailVerificationForm
                                email={registrationData.email}
                                userId={registrationData.userId}
                                password={registrationData.password}
                                name={registrationData.name}
                                onNext={(userId) => {
                                    updateRegistrationData({ userId });
                                    goToStep('complete');
                                }}
                            />
                        )}

                        {currentStep === 'complete' && (
                            <TeamUserRegistationComplete />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default TeamUserRegistationForm;
