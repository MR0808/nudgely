'use client';
import { useState } from 'react';

import { CheckCircle, Mail, Users } from 'lucide-react';
import {
    CompanyUserRegistationFormProps,
    CompanyUserRegistrationData,
    RegistrationStep
} from '@/types/register';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import CompanyUserInitialRegistationForm from '@/components/auth/companyUserRegistration/CompanyUserInitialRegistationForm';
import CompanyUserEmailVerificationForm from '@/components/auth/companyUserRegistration/CompanyUserEmailVerificationForm';
import CompanyUserRegistationComplete from '@/components/auth/companyUserRegistration/CompanyUserRegistationComplete';

const CompanyUserRegistationForm = ({
    companyId,
    inviteId,
    email
}: CompanyUserRegistationFormProps) => {
    const [currentStep, setCurrentStep] = useState<RegistrationStep>('initial');
    const [registrationData, setRegistrationData] =
        useState<CompanyUserRegistrationData>({
            name: '',
            lastName: '',
            email: email,
            password: '',
            terms: false
        });

    const updateRegistrationData = (
        data: Partial<CompanyUserRegistrationData>
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
                                <strong>{email}</strong>.
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
                            <CompanyUserInitialRegistationForm
                                companyId={companyId}
                                inviteId={inviteId}
                                data={registrationData}
                                onNext={(data) => {
                                    updateRegistrationData(data);
                                    goToStep('email-verify');
                                }}
                            />
                        )}

                        {currentStep === 'email-verify' && (
                            <CompanyUserEmailVerificationForm
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
                            <CompanyUserRegistationComplete />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default CompanyUserRegistationForm;
