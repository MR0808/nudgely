'use client';

import type * as z from 'zod';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
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
import {
    saveBasicInfo,
    saveAddress,
    saveContact,
    saveAdditionalInfo
} from '@/actions/onboarding';

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
    userSession,
    company,
    image
}: CompanyOnboardingWizardProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [isComplete, setIsComplete] = useState(false);

    const form = useForm<z.infer<typeof CompanyOnboardingSchema>>({
        resolver: zodResolver(CompanyOnboardingSchema),
        defaultValues: {
            name: userSession?.company.name || '',
            logo: company.image || '',
            address1: company.address1 || '',
            address2: company.address2 || '',
            city: company.city || '',
            region: company.regionId || '',
            postalCode: company.postalCode || '',
            country: company.countryId || countryProp?.id || '',
            timezone: company.timezone || '',
            locale: company.locale || '',
            contactEmail: company.contactEmail || '',
            contactPhone: company.contactPhone || '',
            website: company.website || '',
            companySize: company.companySizeId || '',
            industry: company.industryId || ''
        }
    });

    const {
        formState: { errors }
    } = form;

    const saveCurrentStep = async () => {
        const values = form.getValues();

        try {
            switch (currentStep) {
                case 1: {
                    const result = await saveBasicInfo({
                        name: values.name,
                        logo: values.logo
                    });
                    if (result.error) {
                        toast.error(result.error);
                        return false;
                    }
                    toast.success('Basic information saved');
                    return true;
                }
                case 2: {
                    const result = await saveAddress({
                        address1: values.address1,
                        address2: values.address2,
                        city: values.city,
                        region: values.region,
                        postalCode: values.postalCode,
                        country: values.country,
                        timezone: values.timezone,
                        locale: values.locale
                    });
                    if (result.error) {
                        toast.error(result.error);
                        return false;
                    }
                    toast.success('Address information saved');
                    return true;
                }
                case 3: {
                    const result = await saveContact({
                        contactEmail: values.contactEmail,
                        contactPhone: values.contactPhone
                    });
                    if (result.error) {
                        toast.error(result.error);
                        return false;
                    }
                    toast.success('Contact information saved');
                    return true;
                }
                case 4: {
                    const result = await saveAdditionalInfo({
                        website: values.website,
                        companySize: values.companySize,
                        industry: values.industry
                    });
                    if (result.error) {
                        toast.error(result.error);
                        return false;
                    }
                    toast.success('Additional information saved');
                    return true;
                }
                default:
                    return true;
            }
        } catch (error) {
            console.error('Error saving step:', error);
            toast.error('Failed to save. Please try again.');
            return false;
        }
    };

    const nextStep = async () => {
        const fieldsToValidate = getFieldsForStep(currentStep);
        const isValid = await form.trigger(fieldsToValidate);

        if (isValid) {
            startTransition(async () => {
                const saved = await saveCurrentStep();
                if (saved) {
                    if (currentStep < steps.length) {
                        setCurrentStep(currentStep + 1);
                    } else {
                        setIsComplete(true);
                        toast.success(
                            'Company profile completed successfully!'
                        );
                    }
                }
            });
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

    const progress = (currentStep / steps.length) * 100;

    if (isComplete) {
        return <SuccessStep />;
    }

    return (
        <Form {...form}>
            <form>
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
                            started.
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
                            {currentStep === 1 && (
                                <BasicInfoStep image={image} />
                            )}
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
                                    disabled={currentStep === 1 || isPending}
                                    className="border-border bg-transparent cursor-pointer"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={isPending}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                                >
                                    {isPending
                                        ? 'Saving...'
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
