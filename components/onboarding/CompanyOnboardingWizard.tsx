'use client';

import type * as z from 'zod';
import { useEffect, useState, useTransition } from 'react';
import { useForm, SubmitErrorHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Building2, MapPin, Phone, Globe } from 'lucide-react';
import {
    type CompanyOnboardingData,
    CompanyOnboardingSchema
} from '@/schemas/onboarding';
import { CompanyOnboardingWizardProps } from '@/types/onboarding';
import SuccessStep from '@/components/onboarding/steps/SuccessStep';
import BasicInfoStep from '@/components/onboarding/steps/BasicInfoStep';
import AddressStep from '@/components/onboarding/steps/AddressStep';
import ContactStep from '@/components/onboarding/steps/ContactStep';
import AdditionalInfoStep from '@/components/onboarding/steps/AdditionalInfoStep';
import { updateCompany } from '@/actions/onboarding';
import { logCompanyUpdated } from '@/actions/audit/audit-company';

const steps = [
    {
        id: 1,
        title: 'Basic Information',
        description: 'Tell us about your company',
        icon: Building2
    },
    {
        id: 2,
        title: 'Address',
        description: 'Where is your company located?',
        icon: MapPin
    },
    {
        id: 3,
        title: 'Contact Details',
        description: 'How can we reach you?',
        icon: Phone
    },
    {
        id: 4,
        title: 'Additional Info',
        description: 'Help us understand your business',
        icon: Globe
    }
];

const CompanyOnboardingWizard = ({
    countryProp,
    countries,
    regions,
    companySizes,
    industries,
    userSession
}: CompanyOnboardingWizardProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [isComplete, setIsComplete] = useState(false);

    const form = useForm<z.infer<typeof CompanyOnboardingSchema>>({
        resolver: zodResolver(CompanyOnboardingSchema),
        defaultValues: {
            name: userSession?.company.name || '',
            address1: '',
            address2: '',
            city: '',
            region: '',
            postalCode: '',
            country: countryProp?.id || '',
            timezone: '',
            locale: '',
            contactEmail: '',
            contactPhone: '',
            website: '',
            companySize: '',
            industry: ''
        }
    });

    const {
        formState: { errors }
    } = form;

    const nextStep = async () => {
        const fieldsToValidate = getFieldsForStep(currentStep);
        const isValid = await form.trigger(fieldsToValidate);

        if (isValid) {
            if (currentStep < steps.length) {
                setCurrentStep(currentStep + 1);
            } else {
                onSubmit(form.getValues());
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const getFieldsForStep = (
        step: number
    ): (keyof CompanyOnboardingData)[] => {
        switch (step) {
            case 1:
                return ['name'];
            case 2:
                return [
                    'address1',
                    'city',
                    'region',
                    'postalCode',
                    'country',
                    'timezone',
                    'locale'
                ];
            case 3:
                return ['contactEmail', 'contactPhone'];
            case 4:
                return ['website'];
            default:
                return [];
        }
    };

    const onSubmit = (values: z.infer<typeof CompanyOnboardingSchema>) => {
        startTransition(async () => {
            const data = await updateCompany(values);
            if (data.error) {
                toast.error(data.error);
            }
            if (data.data) {
                if (userSession) {
                    await logCompanyUpdated(userSession.user.id, {
                        companyId: data.data.id
                    });
                }
                setIsComplete(true);
                toast.success('Company successfully created');
            }
        });
    };

    const progress = (currentStep / steps.length) * 100;

    if (isComplete) {
        return <SuccessStep />;
    }

    // const onError: SubmitErrorHandler<
    //     z.infer<typeof CompanyOnboardingSchema>
    // > = (errors) => {
    //     console.log(errors);
    // };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <div className="text-center mb-8">
                        <div className="flex flex-row w-full justify-center">
                            <Image
                                src="/images/logo/logo.png"
                                width={300}
                                height={200}
                                alt="Nudgely"
                                className="items-center pb-5"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Welcome to Nudgely
                        </h1>
                        <p className="text-muted-foreground">
                            Let&apos;s set up your company profile to get
                            started. You need a company to create teams and
                            tasks.
                        </p>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-foreground">
                                Step {currentStep} of {steps.length}
                            </span>
                            <Badge
                                variant="secondary"
                                className="bg-accent/10 text-accent-foreground"
                            >
                                {Math.round(progress)}% Complete
                            </Badge>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Step Indicators */}
                    <div className="flex justify-between mb-8">
                        {steps.map((step) => {
                            const Icon = step.icon;
                            const isCompleted = currentStep > step.id;
                            const isCurrent = currentStep === step.id;

                            return (
                                <div
                                    key={step.id}
                                    className="flex flex-col items-center text-center flex-1"
                                >
                                    <div
                                        className={`
                    w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors
                    ${
                        isCompleted
                            ? 'bg-accent text-accent-foreground'
                            : isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                    }
                  `}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <Icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <div className="text-xs font-medium text-foreground hidden sm:block">
                                        {step.title}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Form Card */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle className="text-xl text-card-foreground">
                                {steps[currentStep - 1].title}
                            </CardTitle>
                            <CardDescription>
                                {steps[currentStep - 1].description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {currentStep === 1 && <BasicInfoStep />}
                            {currentStep === 2 && (
                                <AddressStep
                                    countries={countries}
                                    regions={regions}
                                />
                            )}
                            {currentStep === 3 && (
                                <ContactStep defaultCountry={countryProp!} />
                            )}
                            {currentStep === 4 && (
                                <AdditionalInfoStep
                                    companySizes={companySizes}
                                    industries={industries}
                                />
                            )}

                            {/* Navigation */}
                            <div className="flex justify-between pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={prevStep}
                                    disabled={currentStep === 1}
                                    className="border-border bg-transparent cursor-pointer"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={isPending}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90  cursor-pointer"
                                >
                                    {isPending
                                        ? 'Creating...'
                                        : currentStep === steps.length
                                          ? 'Complete Setup'
                                          : 'Next'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </Form>
    );
};

export default CompanyOnboardingWizard;
