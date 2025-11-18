'use client';

import { differenceInDays } from 'date-fns';
import { useState } from 'react';
import parsePhoneNumber from 'libphonenumber-js';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    MapPin,
    Mail,
    Phone,
    Edit,
    Crown,
    Clock,
    Globe,
    Factory,
    Users,
    Earth,
    Languages,
    Camera
} from 'lucide-react';
import { CompanyProps } from '@/types/company';
import EditCompanyDialog from '@/components/company/EditCompanyDialog';
import Image from 'next/image';
import { UpdateLogoDialog } from '@/components/company/UpdateLogoDialog';

const CompanyDetails = ({
    company,
    userRole,
    image,
    countries,
    regions,
    companySizes,
    industries,
    userSession
}: CompanyProps) => {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isLogoDialogOpen, setIsLogoDialogOpen] = useState(false);

    let isTrialing = false;
    let trialDaysLeft = 0;
    const today = new Date();
    const phoneNumber = company.contactPhone
        ? parsePhoneNumber(company.contactPhone)
        : undefined;

    if (company.trialEndsAt && company.trialEndsAt > today) {
        isTrialing = true;
        trialDaysLeft = differenceInDays(today, company.trialEndsAt);
    }
    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Company Details
                        </CardTitle>
                        <CardDescription>
                            Manage your company information and settings
                        </CardDescription>
                    </div>
                    <div className="flex flex-row gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-transparent cursor-pointer"
                            onClick={() => setIsEditDialogOpen(true)}
                        >
                            <Edit className="h-4 w-4" />
                            Edit Details
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Company Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                {image ? (
                                    <Image
                                        src={image.image}
                                        alt={company.name}
                                        height={64}
                                        width={64}
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="h-16 rounded-xl object-cover border border-border cursor-pointer transition-opacity group-hover:opacity-75"
                                        onClick={() =>
                                            setIsLogoDialogOpen(true)
                                        }
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                                        <Building2 className="h-8 w-8 text-primary-foreground" />
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer"
                                    onClick={() => setIsLogoDialogOpen(true)}
                                >
                                    <Camera className="w-3 h-3" />
                                </Button>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">
                                    {company.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                        variant={company.plan.colour}
                                        className="gap-1"
                                    >
                                        {company.plan.name !== 'Free' && (
                                            <Crown className="h-3 w-3" />
                                        )}
                                        {company.plan.name}
                                    </Badge>
                                    {isTrialing && (
                                        <Badge
                                            variant="outline"
                                            className="gap-1"
                                        >
                                            <Clock className="h-3 w-3" />
                                            {trialDaysLeft} days left
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Info Grid */}
                    <div className="flex flex-col space-y-4 justify-center w-full">
                        <div className="w-full grid grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Address
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.address1}
                                    </p>
                                    {company.address2 && (
                                        <p className="text-sm text-muted-foreground">
                                            {company.address2}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        {company.city}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Website
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.website}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.contactEmail}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Phone</p>
                                    <p className="text-sm text-muted-foreground">
                                        {phoneNumber
                                            ? phoneNumber.formatNational()
                                            : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <Earth className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Timezone
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.timezone || ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Languages className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Locale
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.locale || ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <Factory className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Industry
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.industry?.name || ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Company Size
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {company.companySize ? (
                                            <>
                                                <span className="font-bold">
                                                    {company.companySize?.name}
                                                </span>
                                                &nbsp;
                                                {company.companySize?.size}
                                            </>
                                        ) : (
                                            ''
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <EditCompanyDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                company={company}
                countries={countries}
                regions={regions}
                companySizes={companySizes}
                industries={industries}
                userSession={userSession}
            />
            <UpdateLogoDialog
                open={isLogoDialogOpen}
                onOpenChange={setIsLogoDialogOpen}
                currentLogo={image?.image || ''}
                userSession={userSession}
            />
        </>
    );
};

export default CompanyDetails;
